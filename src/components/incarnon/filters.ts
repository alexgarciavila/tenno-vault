/**
 * Lógica pura de filtrado de la lista de Incarnon. Sin React ni store: recibe
 * catálogo (solo lectura) + progreso y devuelve las armas que
 * pasan TODOS los filtros combinados (AND). Testeable de forma aislada.
 */
import type { IncarnonWeapon, WeaponCategory, WeaponKind } from "../../data/catalog-schema";
import {
  computeCopies,
  computeEvolutionSummary,
  computeStatus,
  type IncarnonStatus,
} from "../../lib/inventory";
import type { ProgressRecord } from "../../lib/user-types";

export interface FilterState {
  /** Texto de búsqueda sobre `name`/`weaponName` (contenido en inglés). */
  search: string;
  /** Estados seleccionados; vacío = todos. */
  statuses: IncarnonStatus[];
  /** Bandera independiente: solo armas con datos de catálogo incompletos. */
  incompleteData: boolean;
  /** Categorías seleccionadas; vacío = todas. */
  categories: WeaponCategory[];
  /** Semana de rotación 1–9; null = cualquiera. */
  week: number | null;
  /** Tipos seleccionados; vacío = todos. */
  kinds: WeaponKind[];
  /** Solo armas con copias pendientes (missing > 0). */
  onlyPending: boolean;
  /** Solo armas con instalaciones cuyas evoluciones no están completas. */
  onlyIncompleteEvolutions: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  statuses: [],
  incompleteData: false,
  categories: [],
  week: null,
  kinds: [],
  onlyPending: false,
  onlyIncompleteEvolutions: false,
};

/** Nº de filtros activos (para el contador del botón "Filtros" en móvil). */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search.trim() !== "") count += 1;
  if (filters.statuses.length > 0) count += 1;
  if (filters.incompleteData) count += 1;
  if (filters.categories.length > 0) count += 1;
  if (filters.week !== null) count += 1;
  if (filters.kinds.length > 0) count += 1;
  if (filters.onlyPending) count += 1;
  if (filters.onlyIncompleteEvolutions) count += 1;
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
    const haystack = `${weapon.name} ${weapon.weaponName}`.toLowerCase();
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

  const { status } = computeStatus(weapon, progress);
  if (filters.statuses.length > 0 && !filters.statuses.includes(status)) {
    return false;
  }

  if (filters.onlyPending) {
    const { missing } = computeCopies(weapon, progress);
    if (missing <= 0) return false;
  }

  if (filters.onlyIncompleteEvolutions) {
    const summary = computeEvolutionSummary(weapon, progress);
    const hasInstallations = summary.byInstallation.length > 0;
    if (!hasInstallations || summary.completedTiers >= summary.totalTiers) {
      return false;
    }
  }

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
