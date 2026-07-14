/**
 * Utilidades de normalización de texto, slugs y URLs para el scraper.
 * Funciones puras, sin dependencias de cheerio.
 */

export const WIKI_BASE_URL = "https://wiki.warframe.com";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
};

/** Decodifica entidades HTML habituales (`&amp;` → `&`), incluidas numéricas. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

/** Colapsa cualquier secuencia de espacios (incluido NBSP) a un espacio y recorta extremos. */
export function collapseWhitespace(text: string): string {
  return text.replace(/[\s ]+/g, " ").trim();
}

/** Limpieza estándar de texto extraído del HTML: decode + colapso de espacios. */
export function cleanText(text: string): string {
  return collapseWhitespace(decodeEntities(text));
}

/**
 * Slug kebab-case: "Ack & Brunt" → "ack-and-brunt", "Braton Prime" → "braton-prime",
 * "Void's Guidance" → "voids-guidance".
 */
export function slugify(name: string): string {
  return cleanText(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Braton Incarnon Genesis" → "Braton"; "Phenmor" → "Phenmor". */
export function stripGenesisSuffix(name: string): string {
  return cleanText(name).replace(/\s+Incarnon\s+Genesis$/i, "");
}

/** Id del arma a partir del nombre canónico: "Ack & Brunt Incarnon Genesis" → "ack-and-brunt". */
export function weaponIdFromName(name: string): string {
  return slugify(stripGenesisSuffix(name));
}

/** Id estable de perk: `<weaponId>-e<tier>-<perk-slug>`. */
export function perkId(weaponId: string, tier: number, perkName: string): string {
  return `${weaponId}-e${tier}-${slugify(perkName)}`;
}

function hasExplicitPort(value: string): boolean {
  const authority = value.match(/^(?:https:)?\/\/([^/?#]*)/i)?.[1];
  if (!authority) return false;
  const host = authority.slice(authority.lastIndexOf("@") + 1);
  return /:\d+$/.test(host);
}

/** Valida una página canónica de la wiki antes de cualquier petición HTML. */
export function assertAllowedWikiPageUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value, WIKI_BASE_URL);
  } catch {
    throw new Error(`URL de página no permitida: ${value}`);
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "wiki.warframe.com" ||
    url.port !== "" ||
    hasExplicitPort(value) ||
    url.username !== "" ||
    url.password !== "" ||
    !/^\/w\/[^/]+$/.test(url.pathname) ||
    /%(?:00|2f|5c)/i.test(url.pathname) ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error(`URL de página no permitida: ${value}`);
  }
  return url;
}

/** Convierte un href permitido de la wiki en URL absoluta. */
export function absoluteWikiUrl(href: string): string {
  return assertAllowedWikiPageUrl(href).href;
}

/**
 * Normaliza el valor de una celda de variante partido en líneas (separadas por `<br>`):
 * ["X = 24", "Y = 30"] → "X = 24 · Y = 30".
 */
export function joinValueLines(lines: string[]): string {
  return lines
    .map((line) => collapseWhitespace(line))
    .filter((line) => line.length > 0)
    .join(" · ");
}
