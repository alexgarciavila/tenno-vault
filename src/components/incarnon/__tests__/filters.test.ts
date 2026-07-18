import { describe, expect, it } from "vitest";
import { getCatalog } from "../../../data/catalog";
import type { ProgressRecord } from "../../../lib/user-types";
import { lexExampleB } from "../../../test-support/progress-fixtures";
import { EMPTY_FILTERS, countActiveFilters, filterWeapons, type FilterState } from "../filters";

const weapons = getCatalog().weapons;
const withFilters = (patch: Partial<FilterState>) => ({ ...EMPTY_FILTERS, ...patch });

describe("filterWeapons", () => {
  it("aplica condiciones factuales", () => {
    const progress: ProgressRecord = {
      braton: { weaponId: "braton", uninstalledCopies: 1, installations: [] },
      lex: lexExampleB(),
    };
    expect(
      filterWeapons(weapons, progress, withFilters({ hasInventory: true })).map((item) => item.id),
    ).toContain("braton");
    expect(
      filterWeapons(weapons, progress, withFilters({ isCompleted: true })).map((item) => item.id),
    ).toContain("lex");
    expect(
      filterWeapons(
        weapons,
        progress,
        withFilters({ hasMissingCopies: true, hasInventory: true }),
      ).map((item) => item.id),
    ).toEqual(["braton"]);
  });
  it("requiere instalaciones válidas con tiers pendientes", () => {
    const progress: ProgressRecord = {
      braton: {
        weaponId: "braton",
        uninstalledCopies: 0,
        installations: [{ variantId: "braton", evolutionProgress: [] }],
      },
    };
    expect(
      filterWeapons(weapons, progress, withFilters({ hasIncompleteEvolutions: true })).map(
        (item) => item.id,
      ),
    ).toContain("braton");
  });
});
describe("countActiveFilters", () => {
  it("cuenta cada condición activa", () =>
    expect(
      countActiveFilters(
        withFilters({ hasInventory: true, hasMissingCopies: true, isCompleted: true }),
      ),
    ).toBe(3));
});
