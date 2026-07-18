import type {
  IncarnonCatalog,
  IncarnonWeapon,
  LocalizedText,
} from "../../../src/data/catalog-schema";

export const TRANSLATION_COVERAGE_FIELDS = [
  "name",
  "weaponName",
  "variantName",
  "unlockCondition",
  "perkName",
  "perkDescription",
  "perkNotes",
  "variantValue",
] as const;

export type TranslationCoverageField = (typeof TRANSLATION_COVERAGE_FIELDS)[number];

export interface TranslationCoverageStats {
  translated: number;
  missing: number;
  notApplicable: number;
  percentage: number;
}

export interface TranslationWeaponCoverage extends TranslationCoverageStats {
  byField: Record<TranslationCoverageField, TranslationCoverageStats>;
}

export interface TranslationCoverage extends TranslationCoverageStats {
  byField: Record<TranslationCoverageField, TranslationCoverageStats>;
  byWeapon: Record<string, TranslationWeaponCoverage>;
}

type CoverageStatus = "translated" | "missing" | "notApplicable";

interface CoverageObservation {
  weaponId: string;
  field: TranslationCoverageField;
  status: CoverageStatus;
}

function aggregate(items: CoverageObservation[]): TranslationCoverageStats {
  const totals = { translated: 0, missing: 0, notApplicable: 0 };
  for (const item of items) totals[item.status]++;
  const totalApplicable = totals.translated + totals.missing;
  return {
    ...totals,
    percentage:
      totalApplicable === 0 ? 100 : Math.round((totals.translated / totalApplicable) * 10000) / 100,
  };
}

function aggregateByField(
  items: CoverageObservation[],
): Record<TranslationCoverageField, TranslationCoverageStats> {
  return Object.fromEntries(
    TRANSLATION_COVERAGE_FIELDS.map((field) => [
      field,
      aggregate(items.filter((item) => item.field === field)),
    ]),
  ) as Record<TranslationCoverageField, TranslationCoverageStats>;
}

/** Mide la cobertura ES únicamente desde el catálogo candidato, sin consultar el sidecar. */
export function measureLocalizedCatalogCoverage(catalog: IncarnonCatalog): TranslationCoverage {
  const observations: CoverageObservation[] = [];

  function observe(
    weaponId: string,
    field: TranslationCoverageField,
    value: LocalizedText | null | undefined,
  ): void {
    observations.push({
      weaponId,
      field,
      status:
        value === null || value === undefined
          ? "notApplicable"
          : value.es
            ? "translated"
            : "missing",
    });
  }

  function observeWeapon(weapon: IncarnonWeapon): void {
    observe(weapon.id, "name", weapon.name);
    observe(weapon.id, "weaponName", weapon.weaponName);
    for (const variant of weapon.variants) observe(weapon.id, "variantName", variant.name);
    for (const tier of weapon.evolutions) {
      observe(weapon.id, "unlockCondition", tier.unlockCondition);
      for (const perk of tier.perks) {
        observe(weapon.id, "perkName", perk.name);
        observe(weapon.id, "perkDescription", perk.description);
        observe(weapon.id, "perkNotes", perk.notes);
        for (const value of Object.values(perk.variantValues ?? {})) {
          observe(weapon.id, "variantValue", value.kind === "localized" ? value.text : null);
        }
      }
    }
  }

  catalog.weapons.forEach(observeWeapon);
  const byWeapon: TranslationCoverage["byWeapon"] = {};
  for (const weapon of catalog.weapons) {
    const weaponItems = observations.filter((item) => item.weaponId === weapon.id);
    byWeapon[weapon.id] = {
      ...aggregate(weaponItems),
      byField: aggregateByField(weaponItems),
    };
  }

  return {
    ...aggregate(observations),
    byField: aggregateByField(observations),
    byWeapon,
  };
}
