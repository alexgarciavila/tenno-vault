/** Cálculos puros y defensivos del progreso Incarnon. */
import type { IncarnonWeapon } from "../data/catalog-schema";
import type { IncarnonInstallation, ProgressRecord, UserIncarnonProgress } from "./user-types";

export interface InstallationEvolutionSummary {
  variantId: string;
  completedTiers: number;
  totalTiers: number;
}

export interface EvolutionSummary {
  completedTiers: number;
  totalTiers: number;
  byInstallation: InstallationEvolutionSummary[];
}

export interface InventorySummary {
  copies: {
    required: number;
    installed: number;
    inventory: number;
    owned: number;
    missing: number;
  };
  evolutions: EvolutionSummary;
  isCompleted: boolean;
  hasIncompleteData: boolean;
  installedVariantIds: string[];
  variantsWithProgress: Set<string>;
}

export interface GlobalSummary {
  weaponsWithCopies: number;
  weaponsWithInstallations: number;
  inventoryCopies: number;
  missingCopies: number;
  completedWeapons: number;
  evolutionsCompleted: number;
  evolutionsTotal: number;
}

function normalizedInventory(progress?: UserIncarnonProgress): number {
  const value = progress?.uninstalledCopies;
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : 0;
}

/** Mantiene la primera instalación válida de cada variante en el orden persistido. */
function normalizedInstallations(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): IncarnonInstallation[] {
  const validIds = new Set(weapon.variants.map((variant) => variant.id));
  const seen = new Set<string>();
  return (progress?.installations ?? []).filter((installation) => {
    if (!validIds.has(installation.variantId) || seen.has(installation.variantId)) return false;
    seen.add(installation.variantId);
    return true;
  });
}

/** Instalaciones cuyo identificador ya no pertenece al arma catalogada. */
export function findOrphanInstallations(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): IncarnonInstallation[] {
  const validIds = new Set(weapon.variants.map((variant) => variant.id));
  return (progress?.installations ?? []).filter(
    (installation) => !validIds.has(installation.variantId),
  );
}

/** Única fuente pública del resumen factual de una familia Incarnon. */
export function computeInventorySummary(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): InventorySummary {
  const installations = normalizedInstallations(weapon, progress);
  const installedVariantIds = installations.map((installation) => installation.variantId);
  const catalogTiers = new Set(weapon.evolutions.map((evolution) => evolution.tier));
  const variantsWithProgress = new Set<string>();
  const byInstallation = installations.map((installation) => {
    const completedTiers = new Set<number>();
    for (const entry of installation.evolutionProgress) {
      if (entry.completed && catalogTiers.has(entry.tier)) completedTiers.add(entry.tier);
      if (entry.completed || entry.selectedPerkId !== null)
        variantsWithProgress.add(installation.variantId);
    }
    return {
      variantId: installation.variantId,
      completedTiers: completedTiers.size,
      totalTiers: catalogTiers.size,
    };
  });
  const evolutions = {
    completedTiers: byInstallation.reduce((total, item) => total + item.completedTiers, 0),
    totalTiers: byInstallation.reduce((total, item) => total + item.totalTiers, 0),
    byInstallation,
  };
  const required = weapon.variants.length;
  const installed = installations.length;
  const inventory = normalizedInventory(progress);
  const owned = installed + inventory;
  const missing = Math.max(0, required - owned);
  const allInstalledTiersCompleted = installations.every(
    (_, index) => byInstallation[index]!.completedTiers === byInstallation[index]!.totalTiers,
  );
  return {
    copies: { required, installed, inventory, owned, missing },
    evolutions,
    isCompleted: required > 0 && installed === required && allInstalledTiersCompleted,
    hasIncompleteData: weapon.dataStatus !== "complete",
    installedVariantIds,
    variantsWithProgress,
  };
}

export function computeGlobalSummary(
  weapons: IncarnonWeapon[],
  progressRecord: ProgressRecord,
): GlobalSummary {
  const summary: GlobalSummary = {
    weaponsWithCopies: 0,
    weaponsWithInstallations: 0,
    inventoryCopies: 0,
    missingCopies: 0,
    completedWeapons: 0,
    evolutionsCompleted: 0,
    evolutionsTotal: 0,
  };
  for (const weapon of weapons) {
    const item = computeInventorySummary(weapon, progressRecord[weapon.id]);
    if (item.copies.owned > 0) summary.weaponsWithCopies += 1;
    if (item.copies.installed > 0) summary.weaponsWithInstallations += 1;
    if (item.isCompleted) summary.completedWeapons += 1;
    summary.inventoryCopies += item.copies.inventory;
    summary.missingCopies += item.copies.missing;
    summary.evolutionsCompleted += item.evolutions.completedTiers;
    summary.evolutionsTotal += item.evolutions.totalTiers;
  }
  return summary;
}
