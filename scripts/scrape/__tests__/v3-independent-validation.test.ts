// @vitest-environment node
import { describe, expect, it } from "vitest";

import catalogJson from "../../../src/data/incarnon-catalog.json";
import { incarnonCatalogSchema, type LocalizedText } from "../../../src/data/catalog-schema";
import { resolveCatalogText } from "../../../src/lib/catalog-i18n";
import { readCatalogForGeneration } from "../catalog-compat";
import {
  assertCompleteTranslationCoverage,
  conversionReport,
  convertCatalogToV3,
} from "../convert-catalog-v3";
import { catalogIdentityFingerprint } from "../identity";
import reportJson from "../report/last-run.json";
import { applySpanishTranslations } from "../translations/apply";
import spanishJson from "../translations/es.json";
import { spanishTranslationSidecarSchema } from "../translations/schema";

type LocalizedField = Readonly<{
  path: string;
  kind: "name" | "content";
  value: LocalizedText;
}>;

function localizedFields(raw: unknown = catalogJson): LocalizedField[] {
  const catalog = incarnonCatalogSchema.parse(raw);
  const fields: LocalizedField[] = [];
  for (const weapon of catalog.weapons) {
    fields.push({ path: `${weapon.id}.name`, kind: "name", value: weapon.name });
    fields.push({ path: `${weapon.id}.weaponName`, kind: "name", value: weapon.weaponName });
    for (const variant of weapon.variants) {
      fields.push({
        path: `${weapon.id}.variants.${variant.id}.name`,
        kind: "name",
        value: variant.name,
      });
    }
    for (const tier of weapon.evolutions) {
      if (tier.unlockCondition) {
        fields.push({
          path: `${weapon.id}.e${tier.tier}.unlockCondition`,
          kind: "content",
          value: tier.unlockCondition,
        });
      }
      for (const perk of tier.perks) {
        fields.push({ path: `${perk.id}.name`, kind: "name", value: perk.name });
        fields.push({ path: `${perk.id}.description`, kind: "content", value: perk.description });
        if (perk.notes)
          fields.push({ path: `${perk.id}.notes`, kind: "content", value: perk.notes });
        for (const [variantId, value] of Object.entries(perk.variantValues ?? {})) {
          if (value.kind === "localized") {
            fields.push({
              path: `${perk.id}.variantValues.${variantId}`,
              kind: "content",
              value: value.text,
            });
          }
        }
      }
    }
  }
  return fields;
}

function tokens(value: string, pattern: RegExp): string[] {
  return (value.match(pattern) ?? []).map((token) => token.replaceAll(",", ".")).sort();
}

describe("validación técnica independiente del candidato v3", () => {
  it("recalcula desde EN + sidecar y coincide exactamente con catálogo e informe publicados", () => {
    const canonical = readCatalogForGeneration(catalogJson);
    const canonicalEnglish = localizedFields(canonical).map(({ path, value }) => ({
      path,
      en: value.en,
    }));
    const sidecar = spanishTranslationSidecarSchema.parse(spanishJson);
    const recalculated = applySpanishTranslations(canonical, sidecar);

    expect(recalculated.issues).toEqual([]);
    expect(recalculated.catalog).toEqual(incarnonCatalogSchema.parse(catalogJson));
    expect(recalculated.coverage).toEqual(reportJson.coverage);
    expect(
      conversionReport(
        reportJson.startedAt,
        reportJson.finishedAt,
        recalculated.coverage,
        recalculated.catalog.weapons.length,
      ),
    ).toEqual(reportJson);
    expect(recalculated.coverage).toMatchObject({
      translated: 1594,
      missing: 0,
      notApplicable: 631,
      percentage: 100,
    });
    expect(Object.keys(recalculated.coverage.byWeapon)).toHaveLength(53);
    for (const [weaponId, weapon] of Object.entries(recalculated.coverage.byWeapon)) {
      expect(weapon.missing, weaponId).toBe(0);
      expect(weapon.percentage, weaponId).toBe(100);
      for (const [field, coverage] of Object.entries(weapon.byField)) {
        expect(coverage.missing, `${weaponId}.${field}`).toBe(0);
        expect(coverage.percentage, `${weaponId}.${field}`).toBe(100);
      }
    }
    for (const [field, coverage] of Object.entries(recalculated.coverage.byField)) {
      expect(coverage.missing, field).toBe(0);
      expect(coverage.percentage, field).toBe(100);
    }
    expect(catalogIdentityFingerprint(recalculated.catalog)).toEqual(
      catalogIdentityFingerprint(canonical),
    );
    expect(
      localizedFields(recalculated.catalog).map(({ path, value }) => ({ path, en: value.en })),
    ).toEqual(canonicalEnglish);
  });

  it("recorre los 1594 campos: ES no cae a EN y EN permanece canónico", () => {
    const fields = localizedFields();
    expect(fields).toHaveLength(1594);
    for (const field of fields) {
      const es = resolveCatalogText(field.value, "es");
      const en = resolveCatalogText(field.value, "en");
      expect(es.isFallback, field.path).toBe(false);
      expect(es.effectiveLanguage, field.path).toBe("es");
      expect(es.text, field.path).toBe(field.value.es);
      expect(en.isFallback, field.path).toBe(false);
      expect(en.effectiveLanguage, field.path).toBe("en");
      expect(en.text, field.path).toBe(field.value.en);
    }
  });

  it("rechaza campo único, arma completa ausente y global parcial antes de publicar", () => {
    const missingField = spanishTranslationSidecarSchema.parse(structuredClone(spanishJson));
    delete missingField.weapons.phenmor!.name;
    expect(() => convertCatalogToV3(catalogJson, missingField)).toThrow(/cobertura ES incompleta/);

    const missingWeapon = spanishTranslationSidecarSchema.parse(structuredClone(spanishJson));
    delete missingWeapon.weapons.phenmor;
    expect(() => convertCatalogToV3(catalogJson, missingWeapon)).toThrow(/phenmor/);

    const partialGlobal = structuredClone(convertCatalogToV3(catalogJson).coverage);
    partialGlobal.translated--;
    partialGlobal.missing++;
    partialGlobal.percentage = 99.94;
    expect(() => assertCompleteTranslationCoverage(partialGlobal)).toThrow(/global/);
  });

  it("preserva mecánica textual y no contiene prosa EN copiada literalmente", () => {
    const numberPattern = /[+-]?\d+(?:[.,]\d+)?%?/g;
    const placeholderPattern = /\b[XYZ]\b/g;
    const ratioPattern = /\b[XYZ]\s*\/\s*[XYZ]\b/g;
    const templatePattern = /\{\{?[^{}]+\}?\}|%[a-z]|\$\{[^}]+\}/gi;
    const htmlPattern = /<\/?[a-z][^>]*>/gi;

    const fields = localizedFields();
    const identicalNames = fields.filter(
      (field) => field.kind === "name" && field.value.es === field.value.en,
    );
    // Nombres propios/canónicos neutralizados mediante valor ES explícito (CA-19).
    expect(identicalNames).toHaveLength(160);

    for (const field of fields) {
      const es = field.value.es!;
      expect(es.trim().length, field.path).toBeGreaterThan(0);
      expect(tokens(es, numberPattern), `${field.path}: cifras/porcentajes`).toEqual(
        tokens(field.value.en, numberPattern),
      );
      expect(tokens(es, placeholderPattern), `${field.path}: placeholders X/Y/Z`).toEqual(
        tokens(field.value.en, placeholderPattern),
      );
      expect(tokens(es, ratioPattern), `${field.path}: relaciones X/Y`).toEqual(
        tokens(field.value.en, ratioPattern),
      );
      expect(tokens(es, templatePattern), `${field.path}: placeholders de plantilla`).toEqual(
        tokens(field.value.en, templatePattern),
      );
      expect(tokens(es, htmlPattern), `${field.path}: etiquetas HTML`).toEqual(
        tokens(field.value.en, htmlPattern),
      );
      if (field.kind === "content")
        expect(es, `${field.path}: prosa EN copiada`).not.toBe(field.value.en);
    }
  });

  it("preserva las tres ideas de la transmutación al volver de Forma Incarnon", () => {
    const catalog = incarnonCatalogSchema.parse(catalogJson);
    const descriptions = catalog.weapons.flatMap((weapon) =>
      weapon.evolutions.flatMap((evolution) =>
        evolution.perks
          .filter((perk) => perk.description.en.includes("Switching back will expend"))
          .map((perk) => ({ weaponId: weapon.id, perkId: perk.id, description: perk.description })),
      ),
    );

    expect(descriptions).toHaveLength(32);
    expect(descriptions.map(({ weaponId }) => weaponId)).toEqual(
      expect.arrayContaining(["dread", "bronco"]),
    );

    for (const { perkId, description } of descriptions) {
      const es = description.es!.toLocaleLowerCase("es");
      const expectedChargeSource = description.en.startsWith("Weakpoint")
        ? /puntos? débiles?/
        : description.en.startsWith("Direct shots")
          ? /disparos? directos?/
          : /impactos? directos?/;

      expect(es, `${perkId}: origen de la carga`).toMatch(expectedChargeSource);
      expect(es, `${perkId}: carga de transmutación`).toMatch(
        /carg\w*[^.;]*transmutación incarnon/,
      );
      expect(es, `${perkId}: disparo alternativo`).toMatch(/disparo alternativo[^.;]*transmut\w*/);
      expect(es, `${perkId}: consumo al volver`).toMatch(
        /volver[^.;]*consum\w*[^.;]*carga restante/,
      );
    }

    expect(descriptions.find(({ weaponId }) => weaponId === "dread")?.description.es).toBe(
      "Los impactos en puntos débiles cargan la transmutación Incarnon; el disparo alternativo transmuta el arma. Volver a la forma anterior consume toda la carga restante. Sacrifica el silencio a cambio de un mayor tamaño de proyectil y daño de Calor.",
    );
    expect(descriptions.find(({ weaponId }) => weaponId === "bronco")?.description.es).toBe(
      "Los impactos en puntos débiles cargan la transmutación Incarnon; el disparo alternativo transmuta el arma. Volver a la forma anterior consume toda la carga restante. Aumenta el alcance y permite que los proyectiles reboten.",
    );
  });
});
