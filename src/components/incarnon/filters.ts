/**
 * Lógica pura de filtrado de la lista de Incarnon. Sin React ni store: recibe
 * catálogo (solo lectura) + progreso y devuelve las armas que
 * pasan TODOS los filtros combinados (AND). Testeable de forma aislada.
 */
import type { IncarnonWeapon, WeaponCategory, WeaponKind } from "../../data/catalog-schema";
import { computeInventorySummary } from "../../lib/inventory";
import type { ProgressRecord } from "../../lib/user-types";

export interface FilterState {
  /** Texto de búsqueda sobre `name`/`weaponName` (contenido en inglés). */
  search: string;
  hasInventory: boolean;
  hasMissingCopies: boolean;
  hasPendingInstallations: boolean;
  isCompleted: boolean;
  /** Bandera independiente: solo armas con datos de catálogo incompletos. */
  incompleteData: boolean;
  /** Categorías seleccionadas; vacío = todas. */
  categories: WeaponCategory[];
  /** Semana de rotación 1–9; null = cualquiera. */
  week: number | null;
  /** Tipos seleccionados; vacío = todos. */
  kinds: WeaponKind[];
  hasIncompleteEvolutions: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  hasInventory: false,
  hasMissingCopies: false,
  hasPendingInstallations: false,
  isCompleted: false,
  incompleteData: false,
  categories: [],
  week: null,
  kinds: [],
  hasIncompleteEvolutions: false,
};

/** Nº de filtros activos (para el contador del botón "Filtros" en móvil). */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search.trim() !== "") count += 1;
  if (filters.hasInventory) count += 1;
  if (filters.hasMissingCopies) count += 1;
  if (filters.hasPendingInstallations) count += 1;
  if (filters.isCompleted) count += 1;
  if (filters.incompleteData) count += 1;
  if (filters.categories.length > 0) count += 1;
  if (filters.week !== null) count += 1;
  if (filters.kinds.length > 0) count += 1;
  if (filters.hasIncompleteEvolutions) count += 1;
  return count;
}

function matches(
  weapon: IncarnonWeapon,
  progressRecord: ProgressRecord,
  filters: FilterState,
): boolean {
  const progress = progressRecord[weapon.id];

  const search = filters.search.trim().toLowerCase();
  if (search !== "") {
    const haystack = `${weapon.name.en} ${weapon.weaponName.en}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  if (filters.categories.length > 0 && !filters.categories.includes(weapon.category)) {
    return false;
  }

  if (filters.kinds.length > 0 && !filters.kinds.includes(weapon.kind)) {
    return false;
  }

  if (filters.week !== null && weapon.rotation?.week !== filters.week) {
    return false;
  }

  if (filters.incompleteData && weapon.dataStatus === "complete") {
    return false;
  }

  const summary = computeInventorySummary(weapon, progress);
  if (filters.hasInventory && summary.copies.inventory <= 0) return false;
  if (filters.hasMissingCopies && summary.copies.missing <= 0) return false;
  if (
    filters.hasPendingInstallations &&
    !(summary.copies.required > 0 && summary.copies.installed < summary.copies.required)
  )
    return false;
  if (filters.isCompleted && !summary.isCompleted) return false;
  if (
    filters.hasIncompleteEvolutions &&
    !(
      summary.evolutions.byInstallation.length > 0 &&
      summary.evolutions.completedTiers < summary.evolutions.totalTiers
    )
  )
    return false;

  return true;
}

/** Armas que pasan todos los filtros, en el orden del catálogo. */
export function filterWeapons(
  weapons: IncarnonWeapon[],
  progressRecord: ProgressRecord,
  filters: FilterState,
): IncarnonWeapon[] {
  return weapons.filter((weapon) => matches(weapon, progressRecord, filters));
}
