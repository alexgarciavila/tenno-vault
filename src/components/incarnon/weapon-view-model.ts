/**
 * Modelo de vista derivado de un arma + su progreso, compartido por `WeaponCard`
 * y `WeaponTableRow` para que ambas presentaciones muestren exactamente las
 * mismas cifras y estado (una sola fuente de cálculo). Todo sale de las funciones
 * puras de `inventory.ts`.
 */
import type { IncarnonWeapon } from "../../data/catalog-schema";
import {
  computeCopies,
  computeEvolutionSummary,
  computeStatus,
  type CopyCounts,
  type EvolutionSummary,
  type StatusResult,
} from "../../lib/inventory";
import type { UserIncarnonProgress } from "../../lib/user-types";

export interface WeaponViewModel {
  copies: CopyCounts;
  status: StatusResult;
  evolutions: EvolutionSummary;
  installedVariantIds: string[];
  /** Variantes cuya instalación tiene algún progreso (tier completo o perk elegido). */
  variantsWithProgress: Set<string>;
}

export function buildWeaponViewModel(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): WeaponViewModel {
  const copies = computeCopies(weapon, progress);
  const status = computeStatus(weapon, progress);
  const evolutions = computeEvolutionSummary(weapon, progress);

  const variantIds = new Set(weapon.variants.map((v) => v.id));
  const validInstallations =
    progress?.installations.filter((inst) => variantIds.has(inst.variantId)) ?? [];

  const installedVariantIds = validInstallations.map((inst) => inst.variantId);
  const variantsWithProgress = new Set(
    validInstallations
      .filter((inst) =>
        inst.evolutionProgress.some((ep) => ep.completed || ep.selectedPerkId !== null),
      )
      .map((inst) => inst.variantId),
  );

  return { copies, status, evolutions, installedVariantIds, variantsWithProgress };
}
