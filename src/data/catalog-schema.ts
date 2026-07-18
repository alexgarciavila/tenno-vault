import { z } from "zod";

/**
 * Esquema Zod del catálogo de Incarnon (contrato de datos único del proyecto).
 * Compartido entre el scraper (`scripts/scrape/`) y la aplicación.
 * Cualquier cambio estructural exige bump de `schemaVersion`.
 */

export const CATALOG_SCHEMA_VERSION = 3 as const;

export const catalogLanguageSchema = z.enum(["en", "es"]);
export const nonBlankTextSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, "El texto no puede estar vacío.");
export const localizedTextSchema = z
  .object({ en: nonBlankTextSchema, es: nonBlankTextSchema.optional() })
  .strict();
export const localizedVariantValueSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("shared"), value: nonBlankTextSchema }).strict(),
  z.object({ kind: z.literal("localized"), text: localizedTextSchema }).strict(),
]);

export const evolutionPerkSchema = z.object({
  /** Id estable: `<weaponId>-e<tier>-<perk-slug>`, ej. "braton-e2-daring-reverie". */
  id: z.string().min(1),
  name: localizedTextSchema,
  /** Descripción con placeholders X/Y tal como aparece en la wiki. */
  description: localizedTextSchema,
  /** variantId → "X = 24 · Y = 30". Solo presente si algún valor difiere de "-". */
  variantValues: z.record(z.string(), localizedVariantValueSchema).optional(),
  notes: localizedTextSchema.optional(),
});

export const evolutionTierSchema = z.object({
  /** 1–4 en Genesis, 1–5 en innatas. */
  tier: z.number().int().min(1).max(5),
  /** false en tier 1 (perk fijo "Incarnon Form"); true en el resto. */
  selectable: z.boolean(),
  /** null = se desbloquea al instalar (sin desafío previo). */
  unlockCondition: localizedTextSchema.nullable(),
  perks: z.array(evolutionPerkSchema).min(1),
});

export const weaponVariantSchema = z.object({
  /** Slug kebab-case, ej. "braton-prime". */
  id: z.string().min(1),
  /** Nombre completo, ej. "Braton Prime". */
  name: localizedTextSchema,
  wikiUrl: z.url(),
});

export const weaponKindSchema = z.enum(["genesis", "innate"]);
export const weaponCategorySchema = z.enum(["primary", "secondary", "melee"]);
export const dataStatusSchema = z.enum(["complete", "incomplete", "review-required"]);

export const weaponRotationSchema = z.object({
  week: z.number().int().min(1),
  letter: z.string().min(1),
});

export const incarnonImageContentTypeSchema = z.enum(["image/png", "image/jpeg", "image/webp"]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const WEAPON_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const incarnonImageSchema = z
  .object({
    localPath: z.string(),
    sourceUrl: z.url(),
    contentType: incarnonImageContentTypeSchema,
    sha256: z.string().regex(SHA256_PATTERN),
  })
  .superRefine((image, ctx) => {
    const extension =
      image.contentType === "image/png"
        ? "png"
        : image.contentType === "image/jpeg"
          ? "jpg"
          : "webp";
    const pattern = new RegExp(
      `^/generated/incarnon-images/(${WEAPON_ID_PATTERN.source.slice(1, -1)})/${image.sha256}\\.${extension}$`,
    );
    if (!pattern.test(image.localPath)) {
      ctx.addIssue({
        code: "custom",
        path: ["localPath"],
        message: "La ruta local no coincide con el id, hash y tipo de la imagen.",
      });
    }

    const source = new URL(image.sourceUrl);
    if (
      source.protocol !== "https:" ||
      source.hostname !== "wiki.warframe.com" ||
      source.port !== "" ||
      source.username !== "" ||
      source.password !== "" ||
      !source.pathname.startsWith("/images/")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "La URL de imagen debe pertenecer a https://wiki.warframe.com/images/.",
      });
    }
  });

export const incarnonWeaponBaseSchema = z.object({
  /** Slug del arma base: "braton", "ack-and-brunt", "phenmor". */
  id: z.string().min(1),
  /** Nombre canónico de la wiki: "Braton Incarnon Genesis" | "Phenmor". */
  name: localizedTextSchema,
  /** Nombre del arma sin sufijo: "Braton". */
  weaponName: localizedTextSchema,
  kind: weaponKindSchema,
  category: weaponCategorySchema,
  /** Semana de The Circuit; null en armas innatas. */
  rotation: weaponRotationSchema.nullable(),
  /** Innatas: 1 variante (el arma misma). */
  variants: z.array(weaponVariantSchema),
  /** Genesis: 4 tiers · innatas: 5 tiers. */
  evolutions: z.array(evolutionTierSchema),
  /** Recurso local content-addressed; null representa ausencia explícita. */
  image: incarnonImageSchema.nullable(),
  sourceUrl: z.url(),
  scrapedAt: z.string(),
  dataStatus: dataStatusSchema,
  /** Qué falló/faltó, para el informe y el badge "datos incompletos". */
  reviewNotes: z.array(z.string()),
});

export const incarnonWeaponSchema = incarnonWeaponBaseSchema.superRefine((weapon, ctx) => {
  if (
    weapon.image &&
    !weapon.image.localPath.startsWith(`/generated/incarnon-images/${weapon.id}/`)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["image", "localPath"],
      message: "La ruta de imagen debe usar el id de la misma arma.",
    });
  }
});

export const catalogTranslationAttributionSchema = z
  .object({
    id: z.literal("tenno-vault-es-from-warframe-wiki-en"),
    language: z.literal("es"),
    kind: z.literal("project-translation"),
    derivedFrom: z.literal("warframe-wiki-en"),
    responsibility: nonBlankTextSchema,
    license: z.literal("CC BY-NC-SA 3.0"),
    licenseUrl: z.url(),
    updatedAt: z.string().datetime(),
    changes: nonBlankTextSchema,
  })
  .strict();

export const catalogAttributionSchema = z
  .object({
    source: z.literal("Warframe Wiki"),
    sourceUrl: z.literal("https://wiki.warframe.com/w/Incarnon"),
    license: z.literal("CC BY-NC-SA 3.0"),
    licenseUrl: z.url(),
    canonicalLanguage: z.literal("en"),
    translations: z.array(catalogTranslationAttributionSchema).max(1),
  })
  .strict();

export const incarnonCatalogSchema = z
  .object({
    schemaVersion: z.literal(CATALOG_SCHEMA_VERSION),
    /** ISO 8601. */
    generatedAt: z.string(),
    attribution: catalogAttributionSchema,
    weapons: z.array(incarnonWeaponSchema),
  })
  .superRefine((catalog, ctx) => {
    const hasSpanish = catalog.weapons.some(
      (weapon) =>
        weapon.name.es !== undefined ||
        weapon.weaponName.es !== undefined ||
        weapon.variants.some((variant) => variant.name.es !== undefined) ||
        weapon.evolutions.some(
          (tier) =>
            tier.unlockCondition?.es !== undefined ||
            tier.perks.some(
              (perk) =>
                perk.name.es !== undefined ||
                perk.description.es !== undefined ||
                perk.notes?.es !== undefined ||
                Object.values(perk.variantValues ?? {}).some(
                  (value) => value.kind === "localized" && value.text.es !== undefined,
                ),
            ),
        ),
    );
    if (catalog.attribution.translations.length !== (hasSpanish ? 1 : 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["attribution", "translations"],
        message: hasSpanish
          ? "El catálogo con contenido ES exige exactamente una atribución de traducción."
          : "No puede declararse traducción ES si el catálogo no contiene valores ES.",
      });
    }
  });

export type EvolutionPerk = z.infer<typeof evolutionPerkSchema>;
export type CatalogLanguage = z.infer<typeof catalogLanguageSchema>;
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type LocalizedVariantValue = z.infer<typeof localizedVariantValueSchema>;
export type EvolutionTier = z.infer<typeof evolutionTierSchema>;
export type WeaponVariant = z.infer<typeof weaponVariantSchema>;
export type WeaponKind = z.infer<typeof weaponKindSchema>;
export type WeaponCategory = z.infer<typeof weaponCategorySchema>;
export type DataStatus = z.infer<typeof dataStatusSchema>;
export type WeaponRotation = z.infer<typeof weaponRotationSchema>;
export type IncarnonImageContentType = z.infer<typeof incarnonImageContentTypeSchema>;
export type IncarnonImage = z.infer<typeof incarnonImageSchema>;
export type IncarnonWeapon = z.infer<typeof incarnonWeaponSchema>;
export type CatalogAttribution = z.infer<typeof catalogAttributionSchema>;
export type IncarnonCatalog = z.infer<typeof incarnonCatalogSchema>;
