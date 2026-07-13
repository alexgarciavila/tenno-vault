/**
 * Store del progreso del usuario (copias, instalaciones, evoluciones y perks),
 * persistido en localStorage con `persist` versionado. Las acciones mantienen
 * el estado consistente con el catálogo:
 * inicializan los tiers reales del arma, validan que un perk pertenece a su
 * tier y aplican guard clauses ante armas/variantes inexistentes.
 *
 * Cualquier cambio de forma del estado persistido exige un bump de
 * `USER_STATE_SCHEMA_VERSION` en `user-types.ts` y una nueva rama en
 * `migrateProgress`.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getWeapon } from "../data/catalog";
import {
  USER_STATE_SCHEMA_VERSION,
  type IncarnonInstallation,
  type ProgressRecord,
  type UserEvolutionProgress,
  type UserIncarnonProgress,
} from "../lib/user-types";

export interface PersistedProgress {
  progress: ProgressRecord;
}

export interface ProgressState extends PersistedProgress {
  /** Fija las copias sin instalar (n ≥ 0; valores negativos se recortan a 0). */
  setUninstalledCopies: (weaponId: string, n: number) => void;
  /**
   * Instala una variante creando su instalación con los tiers reales del arma
   * (completed false, selectedPerkId null). Idempotente: si ya está instalada,
   * no la duplica. Ignora armas/variantes inexistentes en el catálogo.
   */
  installVariant: (weaponId: string, variantId: string) => void;
  /** Desinstala una variante (elimina su instalación). */
  uninstallVariant: (weaponId: string, variantId: string) => void;
  /** Marca/desmarca un tier como completado en una instalación. */
  setTierCompleted: (weaponId: string, variantId: string, tier: number, completed: boolean) => void;
  /**
   * Selecciona (o limpia con null) el perk de un tier. Rechaza en silencio un
   * perkId que no pertenezca a ese tier según el catálogo.
   */
  selectPerk: (weaponId: string, variantId: string, tier: number, perkId: string | null) => void;
  /** Borra todo el progreso. */
  resetAll: () => void;
  /** Reemplazo completo del progreso (validación a cargo del llamador). */
  importProgress: (record: ProgressRecord) => void;
}

/** Progreso vacío por defecto para un arma. */
function emptyProgress(weaponId: string): UserIncarnonProgress {
  return { weaponId, uninstalledCopies: 0, installations: [] };
}

/** Instalación nueva con un tier por evolución del catálogo. */
function buildInstallation(weaponId: string, variantId: string): IncarnonInstallation | undefined {
  const weapon = getWeapon(weaponId);
  if (!weapon) return undefined;
  const variantExists = weapon.variants.some((v) => v.id === variantId);
  if (!variantExists) return undefined;
  const evolutionProgress: UserEvolutionProgress[] = weapon.evolutions.map((evo) => ({
    tier: evo.tier,
    completed: false,
    selectedPerkId: null,
  }));
  return { variantId, evolutionProgress };
}

/**
 * Migración del estado persistido del progreso. Hoy identidad (v0 → v1 sin
 * cambios estructurales). Para añadir una migración futura, introducir un `case`
 * por versión de origen y transformar `state.progress` antes de caer en
 * `default`, p. ej.:
 *
 *   case 1:
 *     state.progress = renombrarCampo(state.progress); // fallthrough
 */
export function migrateProgress(persistedState: unknown, version: number): PersistedProgress {
  const state = (persistedState ?? {}) as Partial<PersistedProgress>;
  switch (version) {
    case 0:
    default:
      return { progress: state.progress ?? {} };
  }
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      progress: {},

      setUninstalledCopies: (weaponId, n) =>
        set((state) => {
          const safe = Math.max(0, Math.floor(n));
          const current = state.progress[weaponId] ?? emptyProgress(weaponId);
          return {
            progress: {
              ...state.progress,
              [weaponId]: { ...current, uninstalledCopies: safe },
            },
          };
        }),

      installVariant: (weaponId, variantId) =>
        set((state) => {
          const installation = buildInstallation(weaponId, variantId);
          if (!installation) return state;
          const current = state.progress[weaponId] ?? emptyProgress(weaponId);
          const alreadyInstalled = current.installations.some(
            (inst) => inst.variantId === variantId,
          );
          if (alreadyInstalled) return state;
          return {
            progress: {
              ...state.progress,
              [weaponId]: {
                ...current,
                installations: [...current.installations, installation],
              },
            },
          };
        }),

      uninstallVariant: (weaponId, variantId) =>
        set((state) => {
          const current = state.progress[weaponId];
          if (!current) return state;
          const installations = current.installations.filter(
            (inst) => inst.variantId !== variantId,
          );
          const next: ProgressRecord = { ...state.progress };
          if (installations.length === 0 && current.uninstalledCopies === 0) {
            delete next[weaponId];
          } else {
            next[weaponId] = { ...current, installations };
          }
          return { progress: next };
        }),

      setTierCompleted: (weaponId, variantId, tier, completed) =>
        set((state) => {
          const current = state.progress[weaponId];
          if (!current) return state;
          const installations = current.installations.map((inst) =>
            inst.variantId === variantId
              ? {
                  ...inst,
                  evolutionProgress: inst.evolutionProgress.map((ep) =>
                    ep.tier === tier ? { ...ep, completed } : ep,
                  ),
                }
              : inst,
          );
          return {
            progress: {
              ...state.progress,
              [weaponId]: { ...current, installations },
            },
          };
        }),

      selectPerk: (weaponId, variantId, tier, perkId) =>
        set((state) => {
          if (perkId !== null) {
            const weapon = getWeapon(weaponId);
            const tierEntry = weapon?.evolutions.find((evo) => evo.tier === tier);
            const perkBelongs = tierEntry?.perks.some((p) => p.id === perkId);
            if (!perkBelongs) return state;
          }
          const current = state.progress[weaponId];
          if (!current) return state;
          const installations = current.installations.map((inst) =>
            inst.variantId === variantId
              ? {
                  ...inst,
                  evolutionProgress: inst.evolutionProgress.map((ep) =>
                    ep.tier === tier ? { ...ep, selectedPerkId: perkId } : ep,
                  ),
                }
              : inst,
          );
          return {
            progress: {
              ...state.progress,
              [weaponId]: { ...current, installations },
            },
          };
        }),

      resetAll: () => set({ progress: {} }),

      importProgress: (record) => set({ progress: record }),
    }),
    {
      name: "tenno-vault-progress",
      version: USER_STATE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ progress: state.progress }),
      migrate: migrateProgress,
    },
  ),
);
