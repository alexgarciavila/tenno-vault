import { z } from "zod";

import {
  CATALOG_SCHEMA_VERSION,
  incarnonCatalogSchema,
  type IncarnonCatalog,
  type LocalizedVariantValue,
} from "../../src/data/catalog-schema";

const legacyAttributionSchema = z.object({
  source: z.literal("Warframe Wiki"),
  sourceUrl: z.literal("https://wiki.warframe.com/w/Incarnon"),
  license: z.literal("CC BY-NC-SA 3.0"),
  licenseUrl: z.string().url(),
});
const legacyImageSchema = z.object({
  localPath: z.string(),
  sourceUrl: z.string().url(),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  sha256: z.string(),
});
const legacyPerkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  variantValues: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
});
const legacyTierSchema = z.object({
  tier: z.number().int().min(1).max(5),
  selectable: z.boolean(),
  unlockCondition: z.string().nullable(),
  perks: z.array(legacyPerkSchema).min(1),
});
const legacyVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  wikiUrl: z.string().url(),
});
const legacyWeaponFields = {
  id: z.string().min(1),
  name: z.string().min(1),
  weaponName: z.string().min(1),
  kind: z.enum(["genesis", "innate"]),
  category: z.enum(["primary", "secondary", "melee"]),
  rotation: z.object({ week: z.number().int().min(1), letter: z.string().min(1) }).nullable(),
  variants: z.array(legacyVariantSchema),
  evolutions: z.array(legacyTierSchema),
  sourceUrl: z.string().url(),
  scrapedAt: z.string(),
  dataStatus: z.enum(["complete", "incomplete", "review-required"]),
  reviewNotes: z.array(z.string()),
};

export const incarnonWeaponV1Schema = z.object(legacyWeaponFields);
export const incarnonCatalogV1Schema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  attribution: legacyAttributionSchema,
  weapons: z.array(incarnonWeaponV1Schema),
});
export const incarnonWeaponV2Schema = z.object({
  ...legacyWeaponFields,
  image: legacyImageSchema.nullable(),
});
export const incarnonCatalogV2Schema = z.object({
  schemaVersion: z.literal(2),
  generatedAt: z.string(),
  attribution: legacyAttributionSchema,
  weapons: z.array(incarnonWeaponV2Schema),
});

export type IncarnonCatalogV1 = z.infer<typeof incarnonCatalogV1Schema>;
export type IncarnonCatalogV2 = z.infer<typeof incarnonCatalogV2Schema>;

const TRANSLATION_ATTRIBUTION = {
  canonicalLanguage: "en" as const,
  translations: [],
};

/** Solo números, placeholders y puntuación se comparten entre idiomas. */
export function classifyLegacyVariantValue(value: string): LocalizedVariantValue {
  const withoutPlaceholders = value.replace(/\b(?:X|Y|Z)\b/g, "");
  const hasNaturalLanguage = /[A-Wa-w]/.test(withoutPlaceholders);
  return hasNaturalLanguage
    ? { kind: "localized", text: { en: value } }
    : { kind: "shared", value };
}

function migrateLegacy(legacy: IncarnonCatalogV1 | IncarnonCatalogV2): IncarnonCatalog {
  return incarnonCatalogSchema.parse({
    ...legacy,
    schemaVersion: CATALOG_SCHEMA_VERSION,
    attribution: { ...legacy.attribution, ...TRANSLATION_ATTRIBUTION },
    weapons: legacy.weapons.map((weapon) => ({
      ...weapon,
      name: { en: weapon.name },
      weaponName: { en: weapon.weaponName },
      image: "image" in weapon ? weapon.image : null,
      variants: weapon.variants.map((variant) => ({ ...variant, name: { en: variant.name } })),
      evolutions: weapon.evolutions.map((tier) => ({
        ...tier,
        unlockCondition: tier.unlockCondition === null ? null : { en: tier.unlockCondition },
        perks: tier.perks.map((perk) => ({
          ...perk,
          name: { en: perk.name },
          description: { en: perk.description },
          notes: perk.notes === undefined ? undefined : { en: perk.notes },
          variantValues:
            perk.variantValues === undefined
              ? undefined
              : Object.fromEntries(
                  Object.entries(perk.variantValues).map(([id, value]) => [
                    id,
                    classifyLegacyVariantValue(value),
                  ]),
                ),
        })),
      })),
    })),
  });
}

export function readCatalogForGeneration(data: unknown): IncarnonCatalog {
  if (typeof data !== "object" || data === null || !("schemaVersion" in data)) {
    throw new Error("El catálogo existente no declara schemaVersion.");
  }
  const version = (data as { schemaVersion: unknown }).schemaVersion;
  if (version === CATALOG_SCHEMA_VERSION) return incarnonCatalogSchema.parse(data);
  if (version === 2) return migrateLegacy(incarnonCatalogV2Schema.parse(data));
  if (version === 1) return migrateLegacy(incarnonCatalogV1Schema.parse(data));
  throw new Error(`schemaVersion incompatible: ${String(version)}. Solo se aceptan 1, 2 y 3.`);
}
