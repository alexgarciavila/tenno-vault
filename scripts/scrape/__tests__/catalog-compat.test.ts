// @vitest-environment node
import { describe, expect, it } from "vitest";

import catalogV2 from "../../../src/data/incarnon-catalog.json";
import { readCatalogForGeneration } from "../catalog-compat";

describe("readCatalogForGeneration", () => {
  it("acepta v2 y migra v1 añadiendo image null sin perder atribución", () => {
    const current = readCatalogForGeneration(catalogV2);
    const legacy = {
      ...catalogV2,
      schemaVersion: 1,
      weapons: catalogV2.weapons.map((weapon) =>
        Object.fromEntries(Object.entries(weapon).filter(([key]) => key !== "image")),
      ),
    };
    const migrated = readCatalogForGeneration(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.attribution).toEqual(current.attribution);
    expect(migrated.weapons.every((weapon) => weapon.image === null)).toBe(true);
  });

  it("rechaza explícitamente versiones desconocidas", () => {
    expect(() => readCatalogForGeneration({ ...catalogV2, schemaVersion: 99 })).toThrow(
      "schemaVersion incompatible",
    );
  });
});
