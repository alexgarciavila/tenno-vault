/**
 * Registro puro de diccionarios y resolución por idioma. Sin React ni acceso al
 * store: `index.ts` (provider/hook) y los tests consumen `getStrings` desde
 * aquí. `es` es el fallback ante un idioma desconocido.
 */
import { es, type Language, type Strings } from "./es";
import { en } from "./en";

export const dictionaries: Record<Language, Strings> = { es, en };

/** Diccionario para un idioma concreto, con `es` como fallback. */
export function getStrings(language: string): Strings {
  return dictionaries[language as Language] ?? es;
}

export type { Language, Strings };
