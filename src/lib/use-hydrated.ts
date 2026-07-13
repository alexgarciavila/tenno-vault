"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `true` solo tras el primer montaje en el cliente. Patrón necesario
 * para leer stores de Zustand con `persist` en un export estático sin provocar
 * mismatch de hidratación: durante el prerender y el primer render el estado es
 * el valor por defecto; los componentes muestran un skeleton hasta que este
 * hook pasa a `true` y ya puede leerse el estado persistido de localStorage.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
