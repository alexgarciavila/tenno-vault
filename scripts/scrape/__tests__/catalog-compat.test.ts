// @vitest-environment node
import { describe, expect, it } from "vitest";

import catalogV3 from "../../../src/data/incarnon-catalog.json";
import { readCatalogForGeneration } from "../catalog-compat";
import { catalogIdentityFingerprint } from "../identity";

const typedCatalog = readCatalogForGeneration(catalogV3);

function legacyCatalog(version: 1 | 2) {
  return {
    ...typedCatalog,
    schemaVersion: version,
    attribution: {
      source: typedCatalog.attribution.source,
      sourceUrl: typedCatalog.attribution.sourceUrl,
      license: typedCatalog.attribution.license,
      licenseUrl: typedCatalog.attribution.licenseUrl,
    },
    weapons: typedCatalog.weapons.map((weapon) => {
      const legacy = {
        ...weapon,
        name: weapon.name.en,
        weaponName: weapon.weaponName.en,
        variants: weapon.variants.map((variant) => ({ ...variant, name: variant.name.en })),
        evolutions: weapon.evolutions.map((tier) => ({
          ...tier,
          unlockCondition: tier.unlockCondition?.en ?? null,
          perks: tier.perks.map((perk) => ({
            ...perk,
            name: perk.name.en,
            description: perk.description.en,
            notes: perk.notes?.en,
            variantValues:
              perk.variantValues === undefined
                ? undefined
                : Object.fromEntries(
                    Object.entries(perk.variantValues).map(([id, value]) => [
                      id,
                      value.kind === "shared" ? value.value : value.text.en,
                    ]),
                  ),
          })),
        })),
      };
      if (version === 2) return legacy;
      return Object.fromEntries(Object.entries(legacy).filter(([key]) => key !== "image"));
    }),
  };
}

describe("readCatalogForGeneration", () => {
  it("acepta v3 y migra v1/v2 en memoria conservando IDs y atribución canónica", () => {
    const current = readCatalogForGeneration(catalogV3);
    const migratedV2 = readCatalogForGeneration(legacyCatalog(2));
    const migratedV1 = readCatalogForGeneration(legacyCatalog(1));
    expect(migratedV2.schemaVersion).toBe(3);
    expect(migratedV2.attribution).toMatchObject({
      source: current.attribution.source,
      license: current.attribution.license,
      canonicalLanguage: "en",
      translations: [],
    });
    expect(catalogIdentityFingerprint(migratedV2)).toEqual(catalogIdentityFingerprint(current));
    expect(catalogIdentityFingerprint(migratedV1)).toEqual(catalogIdentityFingerprint(current));
    expect(migratedV1.weapons.every((weapon) => weapon.image === null)).toBe(true);
  });

  it("rechaza explícitamente versiones desconocidas", () => {
    expect(() => readCatalogForGeneration({ ...catalogV3, schemaVersion: 99 })).toThrow(
      "schemaVersion incompatible",
    );
  });
});
