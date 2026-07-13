import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";

import type {
  EvolutionPerk,
  EvolutionTier,
  WeaponCategory,
  WeaponKind,
  WeaponVariant,
} from "../../src/data/catalog-schema";
import { absoluteWikiUrl, cleanText, joinValueLines, perkId, slugify } from "./normalize";

export interface ParseWeaponContext {
  weaponId: string;
  /** Nombre del arma sin sufijo Genesis: "Braton", "Phenmor". */
  weaponName: string;
  kind: WeaponKind;
  sourceUrl: string;
}

export interface ParsedWeaponPage {
  variants: WeaponVariant[];
  evolutions: EvolutionTier[];
  /** Categoría del infobox (campo Slot); necesaria para armas innatas. */
  infoboxCategory: WeaponCategory | null;
  /** Motivos de revisión ante estructura inesperada; vacío si todo cuadra. */
  reviewNotes: string[];
}

const EXPECTED_TIERS: Record<WeaponKind, number> = { genesis: 4, innate: 5 };

/** Nº de tier de una fila EVOn: texto "EVO2" en el th o imagen con alt/src que contenga EVOn. */
function evoTierNumber($: CheerioAPI, cell: Cheerio<AnyNode>): number | null {
  const text = cleanText(cell.text());
  const textMatch = text.match(/^EVO\s*(\d+)$/i);
  if (textMatch && textMatch[1]) return Number.parseInt(textMatch[1], 10);

  let fromImage: number | null = null;
  cell.find("img").each((_, img) => {
    const alt = $(img).attr("alt") ?? "";
    const src = $(img).attr("src") ?? "";
    const imgMatch = `${alt} ${src}`.match(/EVO\s*(\d+)/i);
    if (imgMatch && imgMatch[1] && fromImage === null) {
      fromImage = Number.parseInt(imgMatch[1], 10);
    }
  });
  return fromImage;
}

function isChallengeRow(text: string): boolean {
  return /^Evolution(\s+[IVXLC0-9]+)?\s+Challenge$/i.test(text);
}

/** Texto de una celda respetando `<br>` como salto de línea. */
function cellLines($: CheerioAPI, cell: Cheerio<AnyNode>): string[] {
  const clone = cell.clone();
  clone.find("br").replaceWith("\n");
  return clone
    .text()
    .split("\n")
    .map((line) => cleanText(line))
    .filter((line) => line.length > 0);
}

function cellSpan(cell: Cheerio<AnyNode>): number {
  const raw = cell.attr("colspan");
  const parsed = raw === undefined ? 1 : Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

/** Localiza la primera `table.wikitable` posterior a la cabecera `#Evolutions` (h2 o h3). */
function findEvolutionsTable($: CheerioAPI): Cheerio<AnyNode> | null {
  const heading = $("#Evolutions").first();
  if (heading.length === 0) return null;
  const start = heading.parent().is("div.mw-heading") ? heading.parent() : heading;

  let node = start.next();
  while (node.length > 0) {
    if (node.is("div.mw-heading, h2, h3")) break;
    if (node.is("table.wikitable")) return node;
    const inner = node.find("table.wikitable").first();
    if (inner.length > 0) return inner;
    node = node.next();
  }
  return null;
}

/**
 * Cabecera: `<th colspan>Evolution</th>` + un `<th>` por variante + `<th>Notes</th>`.
 * Páginas innatas: sin columnas de variante → 1 variante implícita (el arma misma).
 */
function parseVariants(
  $: CheerioAPI,
  headerRow: Cheerio<AnyNode>,
  ctx: ParseWeaponContext,
  notes: string[],
): WeaponVariant[] {
  const cells = headerRow.children("th, td");
  if (cells.length < 2) {
    notes.push("Evolutions: fila de cabecera con menos de 2 columnas.");
    return [];
  }

  const variantCells = cells.slice(1, cells.length - 1);
  const variants: WeaponVariant[] = [];

  variantCells.each((_, el) => {
    const cell = $(el);
    const tooltip = cell.find("span.tooltip[data-param-name]").first();
    const rawName = tooltip.attr("data-param-name") ?? "";
    const name = cleanText(rawName) || cleanText(cell.text());
    if (!name) {
      notes.push("Evolutions: columna de variante sin nombre en la cabecera.");
      return;
    }
    const href = cell.find("a").first().attr("href");
    const wikiUrl = href
      ? absoluteWikiUrl(href)
      : absoluteWikiUrl(`/w/${name.replace(/\s+/g, "_")}`);
    if (!href) {
      notes.push(`Evolutions: la variante "${name}" no tiene enlace; URL derivada del nombre.`);
    }
    variants.push({ id: slugify(name), name, wikiUrl });
  });

  if (variants.length === 0) {
    // Cabecera solo con "Evolution" + "Notes": arma innata con variante implícita.
    if (ctx.kind === "innate") {
      return [{ id: ctx.weaponId, name: ctx.weaponName, wikiUrl: ctx.sourceUrl }];
    }
    notes.push("Evolutions: cabecera sin columnas de variante en un adaptador Genesis.");
  }

  return variants;
}

interface MutableTier {
  tier: number;
  unlockCondition: string | null;
  perks: EvolutionPerk[];
}

/**
 * Parsea las celdas de un perk (sin el marcador EVOn): nombre, descripción,
 * valores por variante (respetando colspan) y notas finales.
 */
function parsePerkCells(
  $: CheerioAPI,
  cells: Cheerio<Element>,
  tier: number,
  variantColumnIds: string[],
  ctx: ParseWeaponContext,
  notes: string[],
): EvolutionPerk | null {
  if (cells.length < 2) {
    notes.push(`Evolutions: fila de perk con celdas insuficientes en el tier ${tier}.`);
    return null;
  }

  const name = cleanText(cells.eq(0).text());
  if (!name) {
    notes.push(`Evolutions: perk sin nombre en el tier ${tier}; fila descartada.`);
    return null;
  }
  const description = cellLines($, cells.eq(1)).join(" ");

  // Valores por variante: desde la 3.ª celda, expandiendo colspan hasta cubrir las columnas.
  const values: string[] = [];
  let index = 2;
  while (values.length < variantColumnIds.length && index < cells.length) {
    const cell = cells.eq(index);
    const value = joinValueLines(cellLines($, cell));
    const span = Math.min(cellSpan(cell), variantColumnIds.length - values.length);
    for (let i = 0; i < span; i++) values.push(value);
    index++;
  }
  if (values.length < variantColumnIds.length) {
    notes.push(
      `Evolutions: el perk "${name}" (tier ${tier}) no cubre todas las columnas de variante.`,
    );
  }

  const variantValues: Record<string, string> = {};
  let hasRealValue = false;
  variantColumnIds.forEach((variantId, i) => {
    const value = values[i];
    if (value !== undefined && value !== "" && value !== "-") {
      variantValues[variantId] = value;
      hasRealValue = true;
    }
  });

  const notesCell = index < cells.length ? cells.eq(index) : null;
  const noteText = notesCell ? cellLines($, notesCell).join(" ") : "";

  const perk: EvolutionPerk = {
    id: perkId(ctx.weaponId, tier, name),
    name,
    description,
  };
  if (hasRealValue) perk.variantValues = variantValues;
  if (noteText && noteText !== "-") perk.notes = noteText;
  return perk;
}

function parseEvolutions(
  $: CheerioAPI,
  table: Cheerio<AnyNode>,
  variants: WeaponVariant[],
  ctx: ParseWeaponContext,
  notes: string[],
): EvolutionTier[] {
  const rows = table.find("tr");
  if (rows.length === 0) {
    notes.push("Evolutions: la tabla no tiene filas.");
    return [];
  }

  // En innatas la tabla no tiene columnas de valor por variante.
  const headerCells = rows.first().children("th, td");
  const variantColumnCount = Math.max(0, headerCells.length - 2);
  const variantColumnIds =
    variantColumnCount > 0 ? variants.slice(0, variantColumnCount).map((v) => v.id) : [];

  const tiers: MutableTier[] = [];
  let currentTier: MutableTier | null = null;
  let pendingChallenge: string | null = null;

  rows.slice(1).each((_, tr) => {
    const cells = $(tr).children("th, td") as Cheerio<Element>;
    if (cells.length === 0) return;
    const firstCell = cells.first();
    const firstText = cleanText(firstCell.text());

    // Regla universal: la fila de desafío se asigna al SIGUIENTE tier EVOn del documento.
    if (isChallengeRow(firstText)) {
      const condition = cells.length > 1 ? cellLines($, cells.last()).join(" ") : "";
      if (!condition) {
        notes.push(`Evolutions: fila de desafío sin condición ("${firstText}").`);
        return;
      }
      if (pendingChallenge !== null) {
        notes.push("Evolutions: dos filas de desafío consecutivas sin tier intermedio.");
      }
      pendingChallenge = condition;
      return;
    }

    const tierNumber = firstCell.is("th") ? evoTierNumber($, firstCell) : null;
    if (tierNumber !== null) {
      currentTier = { tier: tierNumber, unlockCondition: pendingChallenge, perks: [] };
      pendingChallenge = null;
      tiers.push(currentTier);
      const perk = parsePerkCells(
        $,
        cells.slice(1) as Cheerio<Element>,
        tierNumber,
        variantColumnIds,
        ctx,
        notes,
      );
      if (perk) currentTier.perks.push(perk);
      return;
    }

    // Fila sin marcador EVO: perk adicional del tier abierto.
    if (!currentTier) {
      notes.push("Evolutions: fila de perk antes del primer marcador EVO; descartada.");
      return;
    }
    const perk = parsePerkCells($, cells, currentTier.tier, variantColumnIds, ctx, notes);
    if (perk) currentTier.perks.push(perk);
  });

  if (pendingChallenge !== null) {
    notes.push("Evolutions: fila de desafío final sin tier posterior al que asignarse.");
  }

  const result: EvolutionTier[] = [];
  for (const tier of tiers) {
    if (tier.perks.length === 0) {
      notes.push(`Evolutions: el tier ${tier.tier} no tiene perks; descartado.`);
      continue;
    }
    result.push({
      tier: tier.tier,
      selectable: tier.tier !== 1,
      unlockCondition: tier.unlockCondition,
      perks: tier.perks,
    });
  }
  return result;
}

/** Categoría del infobox: fila con etiqueta "Slot" → valor Primary/Secondary/Melee. */
function parseInfoboxCategory($: CheerioAPI): WeaponCategory | null {
  let category: WeaponCategory | null = null;
  $("div.label").each((_, el) => {
    if (category !== null) return;
    const label = cleanText($(el).text());
    if (label !== "Slot") return;
    const value = cleanText($(el).siblings("div.value").first().text()).toLowerCase();
    if (value === "primary" || value === "secondary" || value === "melee") {
      category = value;
    }
  });
  return category;
}

/**
 * Parsea la página de un arma: variantes (cabecera de la tabla de evoluciones),
 * tiers/perks/desafíos y categoría del infobox.
 * Ante estructura inesperada devuelve lo parseado + `reviewNotes` con el motivo.
 */
export function parseWeaponPage(html: string, ctx: ParseWeaponContext): ParsedWeaponPage {
  const $ = load(html);
  const reviewNotes: string[] = [];
  const infoboxCategory = parseInfoboxCategory($);

  const table = findEvolutionsTable($);
  if (!table) {
    reviewNotes.push('Evolutions: no se encontró la sección "Evolutions" con su tabla.');
    return { variants: [], evolutions: [], infoboxCategory, reviewNotes };
  }

  const headerRow = table.find("tr").first();
  const variants = parseVariants($, headerRow, ctx, reviewNotes);
  const evolutions = parseEvolutions($, table, variants, ctx, reviewNotes);

  const expected = EXPECTED_TIERS[ctx.kind];
  if (evolutions.length === 0) {
    reviewNotes.push("Evolutions: no se encontró ningún tier EVOn.");
  } else if (evolutions.length !== expected) {
    reviewNotes.push(
      `Evolutions: se esperaban ${expected} tiers (${ctx.kind}) y se encontraron ${evolutions.length}.`,
    );
  }
  if (variants.length === 0) {
    reviewNotes.push("Evolutions: el arma quedó sin variantes.");
  }

  return { variants, evolutions, infoboxCategory, reviewNotes };
}
