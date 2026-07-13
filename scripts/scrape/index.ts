/**
 * CLI del generador de catálogo Incarnon.
 *
 * Uso: npm run scrape -- --all | --weapon <id> | --list-only [--cache-dir <dir>]
 *
 * Flujo: descarga /w/Incarnon → resuelve checklist + rotación → descarga cada arma
 * (rate limited) → parsea/normaliza → merge con el catálogo existente (registros no
 * re-scrapeados o con error de fetch se conservan) → valida TODO con Zod → escritura
 * atómica de src/data/incarnon-catalog.json → informe en scripts/scrape/report/last-run.json.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  incarnonCatalogSchema,
  type IncarnonCatalog,
  type IncarnonWeapon,
  type WeaponCategory,
} from "../../src/data/catalog-schema";
import { politeFetch } from "./fetch";
import { stripGenesisSuffix } from "./normalize";
import { parseIndex, type IndexWeaponEntry, type ParsedIndex } from "./parse-index";
import { parseWeaponPage } from "./parse-weapon";
import { printSummary, writeReport, type RunReport } from "./report";
import { decideDataStatus, formatValidationError, validateCatalog } from "./validate";

const INDEX_URL = "https://wiki.warframe.com/w/Incarnon";
const CATALOG_PATH = join("src", "data", "incarnon-catalog.json");

const ATTRIBUTION = {
  source: "Warframe Wiki",
  sourceUrl: "https://wiki.warframe.com/w/Incarnon",
  license: "CC BY-NC-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
} as const;

interface CliOptions {
  mode: "all" | "weapon" | "list-only";
  weaponId: string | null;
  cacheDir: string | null;
}

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { mode: "all", weaponId: null, cacheDir: null };
  let modeSet = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--all":
        options.mode = "all";
        modeSet = true;
        break;
      case "--list-only":
        options.mode = "list-only";
        modeSet = true;
        break;
      case "--weapon": {
        const id = argv[i + 1];
        if (!id || id.startsWith("--")) {
          throw new Error("--weapon requiere un id de arma (ej. --weapon braton).");
        }
        options.mode = "weapon";
        options.weaponId = id;
        modeSet = true;
        i++;
        break;
      }
      case "--cache-dir": {
        const dir = argv[i + 1];
        if (!dir || dir.startsWith("--")) {
          throw new Error("--cache-dir requiere una ruta de directorio.");
        }
        options.cacheDir = dir;
        i++;
        break;
      }
      default:
        throw new Error(`Argumento no reconocido: ${arg}`);
    }
  }

  if (!modeSet) {
    throw new Error("Uso: npm run scrape -- --all | --weapon <id> | --list-only");
  }
  return options;
}

/** Descarga una URL, con cache opcional en disco para iteraciones de desarrollo. */
async function getHtml(url: string, cacheKey: string, cacheDir: string | null): Promise<string> {
  if (cacheDir) {
    const cachePath = join(cacheDir, `${cacheKey}.html`);
    if (existsSync(cachePath)) return readFileSync(cachePath, "utf8");
    const html = await politeFetch(url);
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cachePath, html, "utf8");
    return html;
  }
  return politeFetch(url);
}

function loadExistingCatalog(): IncarnonCatalog | null {
  if (!existsSync(CATALOG_PATH)) return null;
  try {
    const raw: unknown = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
    const result = validateCatalog(raw);
    if (result.success) return result.catalog;
    console.warn("Aviso: el catálogo existente no valida; se ignora para el merge.");
    return null;
  } catch {
    console.warn("Aviso: no se pudo leer el catálogo existente; se ignora para el merge.");
    return null;
  }
}

/** Construye el registro de un arma a partir de su página ya descargada. */
function buildWeaponRecord(
  entry: IndexWeaponEntry,
  index: ParsedIndex,
  html: string,
): IncarnonWeapon {
  const weaponName = stripGenesisSuffix(entry.name);
  const parsed = parseWeaponPage(html, {
    weaponId: entry.id,
    weaponName,
    kind: entry.kind,
    sourceUrl: entry.url,
  });
  const reviewNotes = [...parsed.reviewNotes];

  // Genesis: categoría del checklist. Innatas: del infobox (Slot) de su página.
  let category: WeaponCategory;
  if (entry.category !== null) {
    category = entry.category;
  } else if (parsed.infoboxCategory !== null) {
    category = parsed.infoboxCategory;
  } else {
    category = "primary";
    reviewNotes.push(
      'Infobox: no se pudo determinar la categoría (Slot); asignada "primary" por defecto.',
    );
  }

  let rotation: IncarnonWeapon["rotation"] = null;
  if (entry.kind === "genesis") {
    rotation = index.rotation[entry.id] ?? null;
    if (rotation === null) {
      reviewNotes.push("Rotación: el adaptador no aparece en la tabla de The Circuit.");
    }
  }

  const weapon: IncarnonWeapon = {
    id: entry.id,
    name: entry.name,
    weaponName,
    kind: entry.kind,
    category,
    rotation,
    variants: parsed.variants,
    evolutions: parsed.evolutions,
    sourceUrl: entry.url,
    scrapedAt: new Date().toISOString(),
    dataStatus: "complete",
    reviewNotes,
  };
  weapon.dataStatus = decideDataStatus(weapon);
  return weapon;
}

/** Escritura atómica: tmp → validación → rename. El JSON previo queda intacto si algo falla. */
function writeCatalogAtomically(catalog: IncarnonCatalog): void {
  const tmpPath = `${CATALOG_PATH}.tmp`;
  mkdirSync(dirname(CATALOG_PATH), { recursive: true });
  writeFileSync(tmpPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  const reread: unknown = JSON.parse(readFileSync(tmpPath, "utf8"));
  const check = incarnonCatalogSchema.safeParse(reread);
  if (!check.success) {
    throw new Error(`El catálogo temporal no valida:\n${formatValidationError(check.error)}`);
  }
  renameSync(tmpPath, CATALOG_PATH);
}

function printList(index: ParsedIndex): void {
  console.log(`Armas en el checklist: ${index.weapons.length}`);
  for (const weapon of index.weapons) {
    const rotation = index.rotation[weapon.id];
    const rotationLabel = rotation ? `semana ${rotation.week} (${rotation.letter})` : "—";
    console.log(
      `  ${weapon.id.padEnd(18)} ${weapon.kind.padEnd(7)} ${(weapon.category ?? "?").padEnd(9)} ${rotationLabel}`,
    );
  }
  if (index.reviewNotes.length > 0) {
    console.log("Notas de revisión del índice:");
    for (const note of index.reviewNotes) console.log(`  - ${note}`);
  }
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const mode = options.mode === "weapon" ? `weapon:${options.weaponId}` : options.mode;

  console.log(`Descargando índice: ${INDEX_URL}`);
  const indexHtml = await getHtml(INDEX_URL, "Incarnon", options.cacheDir);
  const index = parseIndex(indexHtml);
  for (const note of index.reviewNotes) console.warn(`Índice: ${note}`);

  if (options.mode === "list-only") {
    printList(index);
    const report: RunReport = {
      startedAt,
      finishedAt: new Date().toISOString(),
      mode,
      total: index.weapons.length,
      ok: index.weapons.length,
      reviewRequired: [],
      kept: [],
      errors: index.reviewNotes.map((note) => ({ id: "index", error: note })),
    };
    writeReport(report);
    printSummary(report);
    return;
  }

  if (options.mode === "weapon") {
    const target = index.weapons.find((weapon) => weapon.id === options.weaponId);
    if (!target) {
      console.error(`No existe el arma "${options.weaponId}" en el checklist de la wiki.`);
      console.error("Usa --list-only para ver los ids disponibles.");
      process.exitCode = 1;
      return;
    }
  }

  const existing = loadExistingCatalog();
  const existingById = new Map<string, IncarnonWeapon>(
    (existing?.weapons ?? []).map((weapon) => [weapon.id, weapon]),
  );

  const weapons: IncarnonWeapon[] = [];
  const report: RunReport = {
    startedAt,
    finishedAt: "",
    mode,
    total: index.weapons.length,
    ok: 0,
    reviewRequired: [],
    kept: [],
    errors: [],
  };

  for (const entry of index.weapons) {
    const isTarget = options.mode === "all" || entry.id === options.weaponId;
    const previous = existingById.get(entry.id);

    if (!isTarget) {
      // --weapon: el resto de armas se conserva del catálogo existente.
      if (previous) {
        weapons.push(previous);
        report.kept.push(entry.id);
      }
      continue;
    }

    console.log(`Descargando ${entry.name} (${entry.url})…`);
    let html: string;
    try {
      html = await getHtml(entry.url, entry.id, options.cacheDir);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (previous) {
        // Fallo de fetch tras reintentos: se conserva el registro previo.
        weapons.push(previous);
        report.kept.push(entry.id);
        console.warn(`  Error de fetch; se conserva el registro previo: ${message}`);
      } else {
        report.errors.push({ id: entry.id, error: message });
        console.error(`  Error de fetch sin registro previo: ${message}`);
      }
      continue;
    }

    const weapon = buildWeaponRecord(entry, index, html);
    weapons.push(weapon);
    if (weapon.dataStatus === "review-required") {
      report.reviewRequired.push({ id: weapon.id, notes: weapon.reviewNotes });
    } else {
      report.ok++;
    }
  }

  const catalog: IncarnonCatalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    attribution: { ...ATTRIBUTION },
    weapons,
  };

  const validation = validateCatalog(catalog);
  if (!validation.success) {
    console.error("La validación global del catálogo falló; no se toca el JSON anterior.");
    console.error(formatValidationError(validation.error));
    report.finishedAt = new Date().toISOString();
    report.errors.push({ id: "catalog", error: "Validación Zod global fallida." });
    writeReport(report);
    printSummary(report);
    process.exitCode = 1;
    return;
  }

  writeCatalogAtomically(validation.catalog);
  console.log(`Catálogo escrito en ${CATALOG_PATH} (${weapons.length} armas).`);

  report.finishedAt = new Date().toISOString();
  writeReport(report);
  printSummary(report);
}

// No ejecutar el flujo al importar desde tests.
const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/scrape/index.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
