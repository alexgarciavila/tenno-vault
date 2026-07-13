import type { z } from "zod";

import {
  incarnonCatalogSchema,
  type DataStatus,
  type IncarnonCatalog,
  type IncarnonWeapon,
} from "../../src/data/catalog-schema";

export type CatalogValidationResult =
  { success: true; catalog: IncarnonCatalog } | { success: false; error: z.ZodError };

/** Valida el catálogo completo con el esquema Zod compartido con la app. */
export function validateCatalog(data: unknown): CatalogValidationResult {
  const result = incarnonCatalogSchema.safeParse(data);
  if (result.success) return { success: true, catalog: result.data };
  return { success: false, error: result.error };
}

/** Resumen legible de los errores de validación (para consola/informe). */
export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `- ${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
    .join("\n");
}

const EXPECTED_TIERS: Record<IncarnonWeapon["kind"], number> = { genesis: 4, innate: 5 };

/**
 * Decide el `dataStatus` de un arma ya parseada y normalizada:
 * - `review-required` si hay notas de revisión o la estructura no cuadra con lo esperado.
 * - `incomplete` si falta contenido menor (algún tier sin condición más allá del tier 1).
 * - `complete` en caso contrario.
 */
export function decideDataStatus(
  weapon: Pick<IncarnonWeapon, "kind" | "variants" | "evolutions" | "reviewNotes">,
): DataStatus {
  if (weapon.reviewNotes.length > 0) return "review-required";
  if (weapon.variants.length === 0) return "review-required";

  const expected = EXPECTED_TIERS[weapon.kind];
  if (weapon.evolutions.length !== expected) return "review-required";
  if (weapon.evolutions.some((tier) => tier.perks.length === 0)) return "review-required";

  const missingCondition = weapon.evolutions.some(
    (tier) => tier.tier > 1 && tier.unlockCondition === null,
  );
  if (missingCondition) return "incomplete";

  return "complete";
}
