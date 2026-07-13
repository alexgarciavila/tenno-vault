import { describe, expect, it } from "vitest";
import { es } from "../es";
import { en } from "../en";
import { getStrings } from "../dictionaries";

/** Rutas de todas las claves hoja (recursivas) de un diccionario, ordenadas. */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  const entries = Object.entries(obj as Record<string, unknown>);
  return entries
    .flatMap(([key, value]) => keyPaths(value, prefix ? `${prefix}.${key}` : key))
    .sort();
}

describe("i18n — paridad de claves es/en", () => {
  it("es y en tienen exactamente el mismo conjunto de claves", () => {
    expect(keyPaths(en)).toEqual(keyPaths(es));
  });

  it("ninguna clave hoja del diccionario en está vacía", () => {
    const empty = keyPaths(en).filter((path) => {
      const value = path
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], en);
      return typeof value === "string" && value.trim() === "";
    });
    expect(empty).toEqual([]);
  });
});

describe("i18n — getStrings", () => {
  it("devuelve el diccionario inglés para 'en'", () => {
    expect(getStrings("en")).toBe(en);
    expect(getStrings("en").nav.home).toBe("Home");
  });

  it("devuelve el diccionario español para 'es'", () => {
    expect(getStrings("es")).toBe(es);
    expect(getStrings("es").nav.home).toBe("Inicio");
  });

  it("cae al español ante un idioma desconocido", () => {
    expect(getStrings("fr")).toBe(es);
  });
});
