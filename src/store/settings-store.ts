/**
 * Store de ajustes de la app (idioma y vista por defecto), persistido en
 * localStorage con `persist` versionado. Defaults: idioma "es", vista "cards".
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { USER_STATE_SCHEMA_VERSION, type UserSettings } from "../lib/user-types";

export interface SettingsState extends UserSettings {
  setLanguage: (language: UserSettings["language"]) => void;
  setView: (view: UserSettings["view"]) => void;
}

/**
 * Migración del estado persistido de ajustes. Hoy identidad. Para añadir una
 * migración futura, introducir un `case` por versión de origen antes de caer en
 * `default`.
 */
export function migrateSettings(persistedState: unknown, version: number): Partial<UserSettings> {
  const state = (persistedState ?? {}) as Partial<UserSettings>;
  switch (version) {
    case 0:
    default:
      return state;
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "es",
      view: "cards",
      setLanguage: (language) => set({ language }),
      setView: (view) => set({ view }),
    }),
    {
      name: "tenno-vault-settings",
      version: USER_STATE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language, view: state.view }),
      migrate: migrateSettings,
    },
  ),
);
