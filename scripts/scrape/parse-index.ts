import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

import type { WeaponCategory, WeaponKind, WeaponRotation } from "../../src/data/catalog-schema";
import { absoluteWikiUrl, cleanText, weaponIdFromName } from "./normalize";

/** Entrada del checklist de /w/Incarnon (aún sin evoluciones ni variantes). */
export interface IndexWeaponEntry {
  /** Slug derivado del nombre canónico: "braton", "ack-and-brunt", "phenmor". */
  id: string;
  /** Nombre canónico decodificado: "Braton Incarnon Genesis" | "Phenmor". */
  name: string;
  /** URL absoluta de la página del arma. */
  url: string;
  kind: WeaponKind;
  /** Solo conocida en Genesis (por subsección del checklist); en innatas se resuelve en su página. */
  category: WeaponCategory | null;
}

export interface ParsedIndex {
  weapons: IndexWeaponEntry[];
  /** weaponId → semana/letra de The Circuit. */
  rotation: Record<string, WeaponRotation>;
  /** Problemas estructurales detectados en la página índice. */
  reviewNotes: string[];
}

const CHECKLIST_SECTIONS: ReadonlyArray<{
  headingId: string;
  kind: WeaponKind;
  category: WeaponCategory | null;
}> = [
  { headingId: "Incarnon_Weapons_Obtained", kind: "innate", category: null },
  { headingId: "Incarnon_Genesis_Primary_Obtained", kind: "genesis", category: "primary" },
  { headingId: "Incarnon_Genesis_Secondary_Obtained", kind: "genesis", category: "secondary" },
  { headingId: "Incarnon_Genesis_Melee_Obtained", kind: "genesis", category: "melee" },
];

const HEADING_SELECTOR = "div.mw-heading, h1, h2, h3, h4, h5";

/**
 * Devuelve el nodo desde el que iterar hermanos para una cabecera de sección.
 * El skin actual envuelve los `h2/h3/h4` en `div.mw-heading`.
 */
function headingWrapper($: CheerioAPI, headingId: string): Cheerio<AnyNode> | null {
  const heading = $(`#${headingId}`);
  if (heading.length === 0) return null;
  const parent = heading.parent();
  return parent.is("div.mw-heading") ? parent : heading;
}

/** Recorre los hermanos posteriores a una cabecera hasta la siguiente cabecera. */
function sectionSiblings($: CheerioAPI, wrapper: Cheerio<AnyNode>): Cheerio<AnyNode>[] {
  const siblings: Cheerio<AnyNode>[] = [];
  let node = wrapper.next();
  while (node.length > 0 && !node.is(HEADING_SELECTOR)) {
    siblings.push(node);
    node = node.next();
  }
  return siblings;
}

function parseChecklist($: CheerioAPI, notes: string[]): IndexWeaponEntry[] {
  const weapons: IndexWeaponEntry[] = [];

  for (const section of CHECKLIST_SECTIONS) {
    const wrapper = headingWrapper($, section.headingId);
    if (!wrapper) {
      notes.push(`Checklist: no se encontró la subsección "${section.headingId}".`);
      continue;
    }

    let found = 0;
    for (const sibling of sectionSiblings($, wrapper)) {
      sibling.find("span.tooltip[data-param-name]").each((_, el) => {
        const rawName = $(el).attr("data-param-name") ?? "";
        const name = cleanText(rawName);
        if (!name) return;
        const href = $(el).find("a").first().attr("href");
        if (!href) {
          notes.push(`Checklist: "${name}" no tiene enlace a su página.`);
          return;
        }
        weapons.push({
          id: weaponIdFromName(name),
          name,
          url: absoluteWikiUrl(href),
          kind: section.kind,
          category: section.category,
        });
        found++;
      });
    }

    if (found === 0) {
      notes.push(`Checklist: la subsección "${section.headingId}" no contiene armas.`);
    }
  }

  return weapons;
}

function parseRotation($: CheerioAPI, notes: string[]): Record<string, WeaponRotation> {
  const rotation: Record<string, WeaponRotation> = {};

  const wrapper = headingWrapper($, "Reward_Rotation");
  if (!wrapper) {
    notes.push('Rotación: no se encontró la sección "Reward_Rotation".');
    return rotation;
  }

  let table: Cheerio<AnyNode> | null = null;
  for (const sibling of sectionSiblings($, wrapper)) {
    if (sibling.is("table")) {
      table = sibling;
      break;
    }
    const inner = sibling.find("table").first();
    if (inner.length > 0) {
      table = inner;
      break;
    }
  }
  if (!table) {
    notes.push('Rotación: no se encontró la tabla tras "Reward_Rotation".');
    return rotation;
  }

  table.find("tr").each((_, tr) => {
    const firstCell = $(tr).children("th, td").first();
    const match = cleanText(firstCell.text()).match(/^Week\s+(\d+)\s*\(([A-Z])\)/i);
    if (!match || !match[1] || !match[2]) return;
    const week = Number.parseInt(match[1], 10);
    const letter = match[2].toUpperCase();

    $(tr)
      .find("span.tooltip[data-param-name]")
      .each((_i, el) => {
        const name = cleanText($(el).attr("data-param-name") ?? "");
        // Las filas también enlazan las variantes ("Braton", "Mk1-Braton"…):
        // solo los adaptadores llevan el sufijo "Incarnon Genesis".
        if (!/\sIncarnon\s+Genesis$/i.test(name)) return;
        rotation[weaponIdFromName(name)] = { week, letter };
      });
  });

  if (Object.keys(rotation).length === 0) {
    notes.push("Rotación: la tabla no contiene adaptadores Incarnon Genesis.");
  }

  return rotation;
}

/** Parsea la página /w/Incarnon: checklist de armas + mapa de rotación de The Circuit. */
export function parseIndex(html: string): ParsedIndex {
  const $ = load(html);
  const reviewNotes: string[] = [];

  const weapons = parseChecklist($, reviewNotes);
  const rotation = parseRotation($, reviewNotes);

  return { weapons, rotation, reviewNotes };
}
