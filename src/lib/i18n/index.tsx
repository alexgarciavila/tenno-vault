"use client";

/**
 * Sistema de i18n de la app. `I18nProvider` (montado sobre `AppShell` en el
 * layout) lee el idioma activo del `settings-store` con guardia de hidratación
 * (`useHydrated`) y lo expone por contexto; `useT()` devuelve el diccionario del
 * idioma activo. Cambiar el idioma en Configuración re-renderiza toda la UI al
 * vuelo (todos los consumidores de `useT()`).
 *
 * Guardia de hidratación: durante el prerender del export estático y el primer
 * render en cliente se usa "es" (idioma por defecto, igual que el SSR) para no
 * provocar mismatch; tras montar, se aplica el idioma persistido. El provider
 * también sincroniza el atributo `lang` de `<html>` con el idioma activo.
 */
import { createContext, useContext, useEffect } from "react";
import { useHydrated } from "../use-hydrated";
import { useSettingsStore } from "../../store/settings-store";
import { getStrings } from "./dictionaries";
import { es, type Language, type Strings } from "./es";

interface I18nContextValue {
  language: Language;
  strings: Strings;
}

const I18nContext = createContext<I18nContextValue>({ language: "es", strings: es });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const language = useSettingsStore((state) => state.language);
  const active: Language = hydrated ? language : "es";
  const strings = getStrings(active);

  useEffect(() => {
    document.documentElement.lang = active;
  }, [active]);

  return (
    <I18nContext.Provider value={{ language: active, strings }}>{children}</I18nContext.Provider>
  );
}

/** Textos de UI del idioma activo. Fallback al español fuera del provider. */
export function useT(): Strings {
  return useContext(I18nContext).strings;
}

export function useLanguage(): Language {
  return useContext(I18nContext).language;
}

export { getStrings } from "./dictionaries";
export type { Language, Strings };
