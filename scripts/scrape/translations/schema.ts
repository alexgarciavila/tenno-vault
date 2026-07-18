import { z } from "zod";

import { nonBlankTextSchema } from "../../../src/data/catalog-schema";

const perkTranslationSchema = z
  .object({
    name: nonBlankTextSchema.optional(),
    description: nonBlankTextSchema.optional(),
    notes: nonBlankTextSchema.optional(),
    variantValues: z.record(z.string(), nonBlankTextSchema).optional(),
  })
  .strict();
const evolutionTranslationSchema = z
  .object({
    unlockCondition: nonBlankTextSchema.optional(),
    perks: z.record(z.string(), perkTranslationSchema).optional(),
  })
  .strict();
const weaponTranslationSchema = z
  .object({
    name: nonBlankTextSchema.optional(),
    weaponName: nonBlankTextSchema.optional(),
    variants: z
      .record(z.string(), z.object({ name: nonBlankTextSchema.optional() }).strict())
      .optional(),
    evolutions: z.record(z.string(), evolutionTranslationSchema).optional(),
  })
  .strict();

export const spanishTranslationSidecarSchema = z
  .object({
    schemaVersion: z.literal(1),
    language: z.literal("es"),
    updatedAt: z.string().datetime(),
    responsibility: nonBlankTextSchema,
    changes: nonBlankTextSchema,
    weapons: z.record(z.string(), weaponTranslationSchema),
  })
  .strict();

export type SpanishTranslationSidecar = z.infer<typeof spanishTranslationSidecarSchema>;

export function loadSpanishTranslationSidecar(data: unknown): SpanishTranslationSidecar {
  return spanishTranslationSidecarSchema.parse(data);
}
