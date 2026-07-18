// @vitest-environment node
import { describe, expect, it } from "vitest";
import catalogJson from "../../../src/data/incarnon-catalog.json";
import spanishJson from "../translations/es.json";
import { readCatalogForGeneration } from "../catalog-compat";
import { catalogIdentityFingerprint } from "../identity";
import { applySpanishTranslations } from "../translations/apply";
import { spanishTranslationSidecarSchema } from "../translations/schema";
import { resolveCatalogText } from "../../../src/lib/catalog-i18n";

describe("sidecar editorial ES", () => {
  const editorialBatchOneIds = [
    "ack-and-brunt",
    "angstrum",
    "anku",
    "atomos",
    "ballistica",
    "bo",
    "boar",
    "boltor",
    "braton",
  ] as const;
  const editorialBatchTwoIds = [
    "bronco",
    "burston",
    "ceramic-dagger",
    "cestra",
    "dera",
    "despair",
    "destreza",
    "dread",
    "dual-ichor",
  ] as const;
  const editorialBatchThreeIds = [
    "dual-toxocyst",
    "felarx",
    "furax",
    "furis",
    "gammacor",
    "gorgon",
    "hate",
    "innodem",
    "kunai",
  ] as const;
  const editorialBatchFourIds = [
    "laetum",
    "lato",
    "latron",
    "lex",
    "magistar",
    "miter",
    "nami-solo",
    "obex",
    "okina",
  ] as const;
  const editorialBatchFiveIds = [
    "onos",
    "paris",
    "phenmor",
    "praedos",
    "ruvox",
    "sibear",
    "skana",
    "soma",
    "strun",
  ] as const;
  const editorialBatchSixIds = [
    "sicarus",
    "stug",
    "sybaris",
    "thalys",
    "torid",
    "vasto",
    "vectis",
    "zylok",
  ] as const;

  it("valida, conserva la identidad y cubre íntegramente Phenmor/Furis", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);
    expect(result.issues).toEqual([]);
    expect(catalogIdentityFingerprint(result.catalog)).toEqual(
      catalogIdentityFingerprint(canonical),
    );
    expect(result.coverage.byWeapon.phenmor?.missing).toBe(0);
    expect(result.coverage.byWeapon.furis?.missing).toBe(0);
    expect(result.catalog.attribution.translations).toHaveLength(1);
  });

  it("cubre íntegramente las nueve armas del lote editorial 1/6", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);

    expect(result.issues).toEqual([]);
    for (const weaponId of editorialBatchOneIds) {
      expect(result.coverage.byWeapon[weaponId], weaponId).toMatchObject({
        missing: 0,
        percentage: 100,
      });
    }
  });

  it("cubre íntegramente las nueve armas del lote editorial 2/6 por IDs fijos", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);

    expect(result.issues).toEqual([]);
    for (const weaponId of editorialBatchTwoIds) {
      expect(result.coverage.byWeapon[weaponId], weaponId).toMatchObject({
        missing: 0,
        percentage: 100,
      });
    }
  });

  it("cubre íntegramente las nueve armas del lote editorial 3/6 por IDs fijos", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);

    expect(result.issues).toEqual([]);
    for (const weaponId of editorialBatchThreeIds) {
      expect(result.coverage.byWeapon[weaponId], weaponId).toMatchObject({
        missing: 0,
        percentage: 100,
      });
    }
  });

  it("cubre íntegramente las nueve armas del lote editorial 4/6 por IDs fijos", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);

    expect(result.issues).toEqual([]);
    for (const weaponId of editorialBatchFourIds) {
      expect(result.coverage.byWeapon[weaponId], weaponId).toMatchObject({
        missing: 0,
        percentage: 100,
      });
    }
  });

  it("cubre íntegramente las nueve armas del lote editorial 5/6 por IDs fijos", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);

    expect(result.issues).toEqual([]);
    for (const weaponId of editorialBatchFiveIds) {
      expect(result.coverage.byWeapon[weaponId], weaponId).toMatchObject({
        missing: 0,
        percentage: 100,
      });
    }
  });

  it("cubre íntegramente las ocho armas del lote editorial final 6/6 por IDs fijos", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);

    expect(result.issues).toEqual([]);
    for (const weaponId of editorialBatchSixIds) {
      expect(result.coverage.byWeapon[weaponId], weaponId).toMatchObject({
        missing: 0,
        percentage: 100,
      });
    }
  });

  it("demuestra cobertura editorial global completa sobre el catálogo fuente", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const result = applySpanishTranslations(canonical, sidecar);
    const totalsByWeapon = Object.values(result.coverage.byWeapon).reduce(
      (totals, weapon) => ({
        translated: totals.translated + weapon.translated,
        missing: totals.missing + weapon.missing,
        notApplicable: totals.notApplicable + weapon.notApplicable,
      }),
      { translated: 0, missing: 0, notApplicable: 0 },
    );

    expect(result.coverage).toMatchObject({ translated: 1594, missing: 0, percentage: 100 });
    expect(Object.keys(result.coverage.byWeapon)).toHaveLength(53);
    expect(
      Object.values(result.coverage.byWeapon).every(
        (weapon) => weapon.missing === 0 && weapon.percentage === 100,
      ),
    ).toBe(true);
    expect(totalsByWeapon).toEqual({
      translated: result.coverage.translated,
      missing: result.coverage.missing,
      notApplicable: result.coverage.notApplicable,
    });

    const totalsByField = Object.values(result.coverage.byField).reduce(
      (totals, field) => ({
        translated: totals.translated + field.translated,
        missing: totals.missing + field.missing,
        notApplicable: totals.notApplicable + field.notApplicable,
      }),
      { translated: 0, missing: 0, notApplicable: 0 },
    );
    expect(totalsByField).toEqual(totalsByWeapon);
    expect(result.coverage.notApplicable).toBe(631);
    expect(result.coverage.byField.variantValue.notApplicable).toBe(275);

    for (const weapon of Object.values(result.coverage.byWeapon)) {
      const weaponFields = Object.values(weapon.byField).reduce(
        (totals, field) => ({
          translated: totals.translated + field.translated,
          missing: totals.missing + field.missing,
          notApplicable: totals.notApplicable + field.notApplicable,
        }),
        { translated: 0, missing: 0, notApplicable: 0 },
      );
      expect(weaponFields).toEqual({
        translated: weapon.translated,
        missing: weapon.missing,
        notApplicable: weapon.notApplicable,
      });
    }
  });

  it("retira ES antiguo de un catálogo v3 cuando el sidecar omite ese campo", () => {
    const previousV3 = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(structuredClone(spanishJson));
    const baseline = applySpanishTranslations(previousV3, sidecar).coverage;
    delete sidecar.weapons.phenmor!.name;

    expect(previousV3.weapons.find((weapon) => weapon.id === "phenmor")!.name.es).toBeDefined();

    const result = applySpanishTranslations(previousV3, sidecar);
    const name = result.catalog.weapons.find((weapon) => weapon.id === "phenmor")!.name;

    expect(name.es).toBeUndefined();
    expect(resolveCatalogText(name, "es")).toMatchObject({
      text: name.en,
      effectiveLanguage: "en",
      isFallback: true,
    });
    expect(result.coverage.byWeapon.phenmor).toMatchObject({ translated: 43, missing: 1 });
    expect(result.coverage).toMatchObject({
      translated: baseline.translated - 1,
      missing: baseline.missing + 1,
    });
  });

  it("limpia también ES anidado de registros v3 conservados si el sidecar queda vacío", () => {
    const previousV3 = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse({
      ...structuredClone(spanishJson),
      weapons: {},
    });

    const result = applySpanishTranslations(previousV3, sidecar);

    expect(
      previousV3.weapons.find((weapon) => weapon.id === "furis")!.evolutions[1]!.perks[0]!
        .description.es,
    ).toBeDefined();
    expect(result.catalog.attribution.translations).toEqual([]);
    expect(result.coverage).toMatchObject({ translated: 0, missing: 1594 });
    for (const weapon of result.catalog.weapons) {
      expect(weapon.name.es).toBeUndefined();
      expect(weapon.weaponName.es).toBeUndefined();
      expect(weapon.variants.every((variant) => variant.name.es === undefined)).toBe(true);
      for (const tier of weapon.evolutions) {
        expect(tier.unlockCondition?.es).toBeUndefined();
        for (const perk of tier.perks) {
          expect(perk.name.es).toBeUndefined();
          expect(perk.description.es).toBeUndefined();
          expect(perk.notes?.es).toBeUndefined();
          expect(
            Object.values(perk.variantValues ?? {}).every(
              (value) => value.kind === "shared" || value.text.es === undefined,
            ),
          ).toBe(true);
        }
      }
    }
  });

  it("rechaza textos vacíos en el sidecar antes de aplicar el overlay", () => {
    expect(
      spanishTranslationSidecarSchema.safeParse({
        ...spanishJson,
        weapons: { phenmor: { name: "   " } },
      }).success,
    ).toBe(false);
  });

  it("reporta referencias huérfanas y discrepancias mecánicas", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    sidecar.weapons.unknown = { name: "Desconocida" };
    sidecar.weapons.furis!.evolutions![2]!.perks!["furis-e2-haven-foray"]!.description =
      "Aumenta el daño en +99 sin placeholder.";
    const result = applySpanishTranslations(canonical, sidecar);
    expect(result.issues.map((issue) => issue.kind)).toEqual(
      expect.arrayContaining(["orphan", "placeholder-mismatch", "mechanic-mismatch"]),
    );
  });
});
