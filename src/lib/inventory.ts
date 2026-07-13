/**
 * Lógica de dominio pura del inventario de Incarnon. Sin React, sin store, sin
 * acceso a localStorage: solo funciones deterministas y testeables que reciben
 * el catálogo (solo lectura) y el progreso del usuario y devuelven cálculos
 * derivados.
 *
 * Reglas de copias:
 *   necesarias  = variants.length
 *   existentes  = instalaciones + copias sin instalar
 *   pendientes  = max(0, necesarias − existentes)
 *   adicionales = max(0, existentes − necesarias)
 *
 * Guard clause transversal: una instalación cuyo `variantId` no exista en el
 * catálogo del arma (dato huérfano, p. ej. tras un cambio de catálogo) se ignora
 * en todos los cálculos. `findOrphanInstallations` la expone para la importación
 * de backups (F6).
 */

import type { IncarnonWeapon } from "../data/catalog-schema";
import type { IncarnonInstallation, ProgressRecord, UserIncarnonProgress } from "./user-types";

export type IncarnonStatus =
  "not-owned" | "available" | "partially-installed" | "covered" | "completed";

export interface CopyCounts {
  /** Nº de variantes del catálogo del arma. */
  needed: number;
  /** Instalaciones válidas + copias sin instalar. */
  existing: number;
  /** Instalaciones válidas (variantId presente en el catálogo). */
  installed: number;
  /** Copias del adaptador sin instalar. */
  uninstalled: number;
  /** Copias que faltan para cubrir todas las variantes: max(0, needed − existing). */
  missing: number;
  /** Copias sobrantes: max(0, existing − needed). */
  extra: number;
}

export interface StatusResult {
  status: IncarnonStatus;
  /** Bandera adicional independiente del estado: el catálogo del arma no está completo. */
  hasIncompleteData: boolean;
}

export interface InstallationEvolutionSummary {
  variantId: string;
  completedTiers: number;
  totalTiers: number;
}

export interface EvolutionSummary {
  /** Suma de tiers completados en TODAS las instalaciones existentes. */
  completedTiers: number;
  /**
   * Suma de tiers de TODAS las instalaciones existentes. El total escala con el
   * número de instalaciones: un arma de N tiers con M instalaciones tiene
   * totalTiers = N × M. Las copias sin instalar no contribuyen al total.
   */
  totalTiers: number;
  byInstallation: InstallationEvolutionSummary[];
}

export interface GlobalSummary {
  /** Armas con al menos una copia (existing ≥ 1). */
  adaptersObtained: number;
  /** Armas con al menos una instalación válida. */
  installed: number;
  /** Σ de copias sin instalar. */
  availableCopies: number;
  /** Σ de copias pendientes (missing). */
  pendingCopies: number;
  /** Armas con todas sus variantes cubiertas (missing === 0). */
  fullyCoveredFamilies: number;
  /** Σ de tiers completados sobre las instalaciones existentes. */
  evolutionsCompleted: number;
  /** Σ de tiers totales sobre las instalaciones existentes. */
  evolutionsTotal: number;
}

/**
 * Instalaciones del progreso cuyo `variantId` existe en el catálogo del arma.
 * Aísla la guard clause de datos huérfanos en un único punto.
 */
function getValidInstallations(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): IncarnonInstallation[] {
  if (!progress) return [];
  const variantIds = new Set(weapon.variants.map((v) => v.id));
  return progress.installations.filter((inst) => variantIds.has(inst.variantId));
}

/**
 * Instalaciones huérfanas: su `variantId` no existe en el catálogo actual del
 * arma. Las usará la importación de backups (F6) para avisar al usuario.
 */
export function findOrphanInstallations(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): IncarnonInstallation[] {
  if (!progress) return [];
  const variantIds = new Set(weapon.variants.map((v) => v.id));
  return progress.installations.filter((inst) => !variantIds.has(inst.variantId));
}

/**
 * Cálculo de copias de un arma. `progress` undefined = arma sin registrar
 * (existing 0). Las instalaciones huérfanas no cuentan.
 */
export function computeCopies(weapon: IncarnonWeapon, progress?: UserIncarnonProgress): CopyCounts {
  const needed = weapon.variants.length;
  const installed = getValidInstallations(weapon, progress).length;
  const uninstalled = progress ? progress.uninstalledCopies : 0;
  const existing = installed + uninstalled;
  const missing = Math.max(0, needed - existing);
  const extra = Math.max(0, existing - needed);
  return { needed, existing, installed, uninstalled, missing, extra };
}

/**
 * Estado derivado del arma en su orden de evaluación, más la bandera
 * independiente `hasIncompleteData` (datos de catálogo incompletos).
 *
 * Orden: not-owned → completed → covered → partially-installed → available.
 */
export function computeStatus(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): StatusResult {
  const hasIncompleteData = weapon.dataStatus !== "complete";
  const { existing, installed, missing } = computeCopies(weapon, progress);

  const status = ((): IncarnonStatus => {
    if (existing === 0) return "not-owned";

    const validInstallations = getValidInstallations(weapon, progress);
    const installedVariantIds = new Set(validInstallations.map((inst) => inst.variantId));
    const allVariantsInstalled = weapon.variants.every((v) => installedVariantIds.has(v.id));
    const allTiersCompleted =
      validInstallations.length > 0 &&
      validInstallations.every((inst) => inst.evolutionProgress.every((ep) => ep.completed));

    if (allVariantsInstalled && allTiersCompleted) return "completed";
    if (missing === 0) return "covered";
    if (installed >= 1 && missing > 0) return "partially-installed";
    // installed === 0 y existing ≥ 1 ⇒ uninstalled ≥ 1 ⇒ "available".
    return "available";
  })();

  return { status, hasIncompleteData };
}

/**
 * Resumen de evoluciones agregado sobre las instalaciones existentes (válidas),
 * más el desglose por instalación. Ver semántica del total en `EvolutionSummary`.
 */
export function computeEvolutionSummary(
  weapon: IncarnonWeapon,
  progress?: UserIncarnonProgress,
): EvolutionSummary {
  const validInstallations = getValidInstallations(weapon, progress);
  const byInstallation: InstallationEvolutionSummary[] = validInstallations.map((inst) => ({
    variantId: inst.variantId,
    completedTiers: inst.evolutionProgress.filter((ep) => ep.completed).length,
    totalTiers: inst.evolutionProgress.length,
  }));
  const completedTiers = byInstallation.reduce((acc, s) => acc + s.completedTiers, 0);
  const totalTiers = byInstallation.reduce((acc, s) => acc + s.totalTiers, 0);
  return { completedTiers, totalTiers, byInstallation };
}

/**
 * Métricas globales para la pantalla de inicio, agregando todo el catálogo con
 * el progreso del usuario.
 */
export function computeGlobalSummary(
  weapons: IncarnonWeapon[],
  progressRecord: ProgressRecord,
): GlobalSummary {
  const summary: GlobalSummary = {
    adaptersObtained: 0,
    installed: 0,
    availableCopies: 0,
    pendingCopies: 0,
    fullyCoveredFamilies: 0,
    evolutionsCompleted: 0,
    evolutionsTotal: 0,
  };

  for (const weapon of weapons) {
    const progress = progressRecord[weapon.id];
    const copies = computeCopies(weapon, progress);
    const evolutions = computeEvolutionSummary(weapon, progress);

    if (copies.existing >= 1) summary.adaptersObtained += 1;
    if (copies.installed >= 1) summary.installed += 1;
    if (copies.missing === 0) summary.fullyCoveredFamilies += 1;
    summary.availableCopies += copies.uninstalled;
    summary.pendingCopies += copies.missing;
    summary.evolutionsCompleted += evolutions.completedTiers;
    summary.evolutionsTotal += evolutions.totalTiers;
  }

  return summary;
}
