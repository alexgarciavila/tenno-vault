import type { IncarnonCatalog, LocalizedText } from "../../../src/data/catalog-schema";
import type { SpanishTranslationSidecar } from "./schema";

import { measureLocalizedCatalogCoverage } from "./coverage";
export {
  TRANSLATION_COVERAGE_FIELDS,
  type TranslationCoverage,
  type TranslationCoverageField,
  type TranslationCoverageStats,
  type TranslationWeaponCoverage,
} from "./coverage";
import type { TranslationCoverage } from "./coverage";

export type TranslationIssue = Readonly<{
  kind: "orphan" | "blank" | "placeholder-mismatch" | "mechanic-mismatch";
  path: string;
  reason: string;
}>;
export interface TranslationApplication {
  catalog: IncarnonCatalog;
  issues: TranslationIssue[];
  coverage: TranslationCoverage;
}

const PLACEHOLDER_PATTERN = /\b[XYZ]\b/g;
const NUMBER_PATTERN = /[+-]?\d+(?:[.,]\d+)?%?/g;
function tokens(value: string, pattern: RegExp): string[] {
  return (value.match(pattern) ?? []).map((token) => token.replace(",", ".")).sort();
}
function validateMechanics(en: string, es: string, path: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];
  if (tokens(en, PLACEHOLDER_PATTERN).join("|") !== tokens(es, PLACEHOLDER_PATTERN).join("|")) {
    issues.push({ kind: "placeholder-mismatch", path, reason: "Los placeholders EN/ES difieren." });
  }
  if (tokens(en, NUMBER_PATTERN).join("|") !== tokens(es, NUMBER_PATTERN).join("|")) {
    issues.push({
      kind: "mechanic-mismatch",
      path,
      reason: "Las cifras o porcentajes EN/ES difieren.",
    });
  }
  return issues;
}

function cloneCatalog(catalog: IncarnonCatalog): IncarnonCatalog {
  return structuredClone(catalog);
}

/** El sidecar es la única fuente autoritativa de ES en cada generación. */
function removeSpanishTranslations(catalog: IncarnonCatalog): void {
  catalog.attribution.translations = [];
  for (const weapon of catalog.weapons) {
    delete weapon.name.es;
    delete weapon.weaponName.es;
    for (const variant of weapon.variants) delete variant.name.es;
    for (const tier of weapon.evolutions) {
      if (tier.unlockCondition) delete tier.unlockCondition.es;
      for (const perk of tier.perks) {
        delete perk.name.es;
        delete perk.description.es;
        if (perk.notes) delete perk.notes.es;
        for (const value of Object.values(perk.variantValues ?? {})) {
          if (value.kind === "localized") delete value.text.es;
        }
      }
    }
  }
}

export function applySpanishTranslations(
  source: IncarnonCatalog,
  sidecar: SpanishTranslationSidecar,
): TranslationApplication {
  const catalog = cloneCatalog(source);
  removeSpanishTranslations(catalog);
  const issues: TranslationIssue[] = [];
  const touched = new Set<string>();

  function apply(target: LocalizedText, es: string | undefined, path: string): void {
    if (es === undefined) return;
    if (es.trim().length === 0) {
      issues.push({ kind: "blank", path, reason: "La traducción ES está vacía." });
      return;
    }
    issues.push(...validateMechanics(target.en, es, path));
    target.es = es;
    touched.add(path);
  }

  for (const [weaponId, translation] of Object.entries(sidecar.weapons)) {
    const weapon = catalog.weapons.find((item) => item.id === weaponId);
    if (!weapon) {
      issues.push({ kind: "orphan", path: `weapons.${weaponId}`, reason: "Arma inexistente." });
      continue;
    }
    apply(weapon.name, translation.name, `${weaponId}.name`);
    apply(weapon.weaponName, translation.weaponName, `${weaponId}.weaponName`);
    for (const [variantId, variantTranslation] of Object.entries(translation.variants ?? {})) {
      const variant = weapon.variants.find((item) => item.id === variantId);
      if (!variant) {
        issues.push({
          kind: "orphan",
          path: `${weaponId}.variants.${variantId}`,
          reason: "Variante inexistente.",
        });
        continue;
      }
      apply(variant.name, variantTranslation.name, `${weaponId}.variants.${variantId}.name`);
    }
    for (const [tierKey, tierTranslation] of Object.entries(translation.evolutions ?? {})) {
      const tierNumber = Number(tierKey);
      const tier = weapon.evolutions.find((item) => item.tier === tierNumber);
      if (!tier) {
        issues.push({
          kind: "orphan",
          path: `${weaponId}.evolutions.${tierKey}`,
          reason: "Tier inexistente.",
        });
        continue;
      }
      if (tierTranslation.unlockCondition !== undefined) {
        if (!tier.unlockCondition) {
          issues.push({
            kind: "orphan",
            path: `${weaponId}.e${tierKey}.unlockCondition`,
            reason: "EN no tiene condición.",
          });
        } else
          apply(
            tier.unlockCondition,
            tierTranslation.unlockCondition,
            `${weaponId}.e${tierKey}.unlockCondition`,
          );
      }
      for (const [perkId, perkTranslation] of Object.entries(tierTranslation.perks ?? {})) {
        const perk = tier.perks.find((item) => item.id === perkId);
        if (!perk) {
          issues.push({
            kind: "orphan",
            path: `${weaponId}.e${tierKey}.${perkId}`,
            reason: "Perk inexistente.",
          });
          continue;
        }
        apply(perk.name, perkTranslation.name, `${perkId}.name`);
        apply(perk.description, perkTranslation.description, `${perkId}.description`);
        if (perkTranslation.notes !== undefined) {
          if (!perk.notes)
            issues.push({ kind: "orphan", path: `${perkId}.notes`, reason: "EN no tiene notas." });
          else apply(perk.notes, perkTranslation.notes, `${perkId}.notes`);
        }
        for (const [variantId, value] of Object.entries(perkTranslation.variantValues ?? {})) {
          const target = perk.variantValues?.[variantId];
          if (!target || target.kind !== "localized") {
            issues.push({
              kind: "orphan",
              path: `${perkId}.variantValues.${variantId}`,
              reason: "Valor localizado inexistente.",
            });
          } else apply(target.text, value, `${perkId}.variantValues.${variantId}`);
        }
      }
    }
  }

  const coverage = measureLocalizedCatalogCoverage(catalog);
  catalog.attribution.translations =
    touched.size === 0
      ? []
      : [
          {
            id: "tenno-vault-es-from-warframe-wiki-en",
            language: "es",
            kind: "project-translation",
            derivedFrom: "warframe-wiki-en",
            responsibility: sidecar.responsibility,
            license: "CC BY-NC-SA 3.0",
            licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
            updatedAt: sidecar.updatedAt,
            changes: sidecar.changes,
          },
        ];
  return {
    catalog,
    issues,
    coverage,
  };
}
