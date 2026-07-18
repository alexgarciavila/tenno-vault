import { describe, expect, it } from "vitest";
import { getCatalog, getWeapon } from "../../../data/catalog";
import type { ProgressRecord } from "../../../lib/user-types";
import { bratonExampleA, lexExampleB } from "../../../test-support/progress-fixtures";
import { EMPTY_FILTERS, countActiveFilters, filterWeapons, type FilterState } from "../filters";

const weapons = getCatalog().weapons;

function withFilters(patch: Partial<FilterState>): FilterState {
  return { ...EMPTY_FILTERS, ...patch };
}

describe("filterWeapons", () => {
  it("sin filtros devuelve todas las armas", () => {
    const result = filterWeapons(weapons, {}, EMPTY_FILTERS);
    expect(result).toHaveLength(weapons.length);
  });

  it("busca por nombre (contenido en inglés) ignorando mayúsculas", () => {
    const result = filterWeapons(weapons, {}, withFilters({ search: "braton" }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((w) => /braton/i.test(w.name.en))).toBe(true);
  });

  it("filtra por categoría", () => {
    const result = filterWeapons(weapons, {}, withFilters({ categories: ["melee"] }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((w) => w.category === "melee")).toBe(true);
  });

  it("filtra por tipo innata", () => {
    const result = filterWeapons(weapons, {}, withFilters({ kinds: ["innate"] }));
    expect(result.length).toBe(8);
    expect(result.every((w) => w.kind === "innate")).toBe(true);
  });

  it("filtra por semana de rotación", () => {
    const braton = getWeapon("braton");
    const week = braton?.rotation?.week ?? 1;
    const result = filterWeapons(weapons, {}, withFilters({ week }));
    expect(result.every((w) => w.rotation?.week === week)).toBe(true);
    expect(result.some((w) => w.id === "braton")).toBe(true);
  });

  it("filtra por estado usando computeStatus (partially-installed en ejemplo A)", () => {
    const progress: ProgressRecord = { braton: bratonExampleA() };
    const result = filterWeapons(
      weapons,
      progress,
      withFilters({ statuses: ["partially-installed"] }),
    );
    expect(result.map((w) => w.id)).toContain("braton");
    expect(result.every((w) => w.id === "braton")).toBe(true);
  });

  it("toggle 'solo pendientes' descarta armas ya cubiertas (ejemplo B, Lex)", () => {
    const progress: ProgressRecord = { lex: lexExampleB() };
    const result = filterWeapons(weapons, progress, withFilters({ onlyPending: true }));
    expect(result.some((w) => w.id === "lex")).toBe(false);
  });

  it("toggle 'evoluciones incompletas' requiere instalación con tiers a medias", () => {
    const progress: ProgressRecord = {
      braton: bratonExampleA(), // instalada, ningún tier completado
      lex: lexExampleB(), // instalada y completa
    };
    const result = filterWeapons(
      weapons,
      progress,
      withFilters({ onlyIncompleteEvolutions: true }),
    );
    const ids = result.map((w) => w.id);
    expect(ids).toContain("braton");
    expect(ids).not.toContain("lex");
  });

  it("combina filtros con AND (categoría + tipo sin coincidencias => vacío)", () => {
    // Innatas no tienen semana de rotación: kind innata + week => vacío.
    const result = filterWeapons(weapons, {}, withFilters({ kinds: ["innate"], week: 3 }));
    expect(result).toHaveLength(0);
  });
});

describe("countActiveFilters", () => {
  it("cuenta 0 con filtros vacíos", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it("cuenta cada dimensión activa una vez", () => {
    const filters = withFilters({
      search: "lex",
      categories: ["primary"],
      onlyPending: true,
      week: 2,
    });
    expect(countActiveFilters(filters)).toBe(4);
  });
});
