import { z } from "zod";

import {
  catalogAttributionSchema,
  incarnonCatalogSchema,
  incarnonWeaponBaseSchema,
  type IncarnonCatalog,
} from "../../src/data/catalog-schema";

export const incarnonWeaponV1Schema = incarnonWeaponBaseSchema.omit({ image: true });
export const incarnonCatalogV1Schema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  attribution: catalogAttributionSchema,
  weapons: z.array(incarnonWeaponV1Schema),
});

export type IncarnonCatalogV1 = z.infer<typeof incarnonCatalogV1Schema>;

export function readCatalogForGeneration(data: unknown): IncarnonCatalog {
  if (typeof data !== "object" || data === null || !("schemaVersion" in data)) {
    throw new Error("El catálogo existente no declara schemaVersion.");
  }

  const version = (data as { schemaVersion: unknown }).schemaVersion;
  if (version === 2) return incarnonCatalogSchema.parse(data);
  if (version !== 1) {
    throw new Error(`schemaVersion incompatible: ${String(version)}. Solo se aceptan 1 y 2.`);
  }

  const legacy = incarnonCatalogV1Schema.parse(data);
  return incarnonCatalogSchema.parse({
    ...legacy,
    schemaVersion: 2,
    weapons: legacy.weapons.map((weapon) => ({ ...weapon, image: null })),
  });
}
