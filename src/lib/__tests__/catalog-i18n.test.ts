import { describe, expect, it } from "vitest";
import catalogJson from "../../data/incarnon-catalog.json";
import { incarnonCatalogSchema, type LocalizedText } from "../../data/catalog-schema";
import { resolveCatalogText, resolveCatalogValue } from "../catalog-i18n";

describe("resolución de textos de catálogo", () => {
  it("usa ES disponible y EN canónico en modo inglés", () => {
    const value = { en: "Challenge", es: "Desafío" };
    expect(resolveCatalogText(value, "es")).toMatchObject({
      text: "Desafío",
      effectiveLanguage: "es",
      isFallback: false,
    });
    expect(resolveCatalogText(value, "en")).toMatchObject({
      text: "Challenge",
      effectiveLanguage: "en",
      isFallback: false,
    });
  });

  it("hace fallback ES→EN por campo e identifica el idioma efectivo", () => {
    expect(resolveCatalogText({ en: "English only" }, "es")).toEqual({
      text: "English only",
      requestedLanguage: "es",
      effectiveLanguage: "en",
      isFallback: true,
      languageNeutral: false,
    });
  });

  it("mantiene neutrales los valores mecánicos compartidos", () => {
    expect(resolveCatalogValue({ kind: "shared", value: "X = 28%" }, "es")).toMatchObject({
      text: "X = 28%",
      effectiveLanguage: "es",
      languageNeutral: true,
      isFallback: false,
    });
  });

  it("resuelve en ES los 1594 campos localizables actuales sin fallback y conserva EN", () => {
    const catalog = incarnonCatalogSchema.parse(catalogJson);
    const localized: LocalizedText[] = [];
    for (const weapon of catalog.weapons) {
      localized.push(weapon.name, weapon.weaponName);
      for (const variant of weapon.variants) localized.push(variant.name);
      for (const tier of weapon.evolutions) {
        if (tier.unlockCondition) localized.push(tier.unlockCondition);
        for (const perk of tier.perks) {
          localized.push(perk.name, perk.description);
          if (perk.notes) localized.push(perk.notes);
          for (const value of Object.values(perk.variantValues ?? {})) {
            if (value.kind === "localized") localized.push(value.text);
          }
        }
      }
    }

    expect(localized).toHaveLength(1594);
    for (const value of localized) {
      expect(resolveCatalogText(value, "es")).toMatchObject({
        text: value.es,
        effectiveLanguage: "es",
        isFallback: false,
      });
      expect(resolveCatalogText(value, "en")).toMatchObject({
        text: value.en,
        effectiveLanguage: "en",
        isFallback: false,
      });
    }
  });
});
