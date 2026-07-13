/**
 * Estructura de datos de la navegación: lista simple de destinos.
 * Añadir una futura herramienta es añadir una entrada, sin rediseño. `primary`
 * marca los destinos del bucle principal (barra inferior móvil); el resto vive
 * en la hoja "Más".
 */
import type { Strings } from "../../lib/i18n";
import { IconEvolutions, IconHome, IconInfo, IconSettings, IconTarget } from "../icons";

export interface NavItem {
  href: string;
  /** Clave dentro de `nav` del diccionario i18n; se resuelve al renderizar. */
  labelKey: keyof Strings["nav"];
  Icon: (props: { className?: string }) => React.ReactNode;
  primary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "home", Icon: IconHome, primary: true },
  { href: "/incarnon", labelKey: "incarnon", Icon: IconTarget, primary: true },
  {
    href: "/evoluciones",
    labelKey: "evolutions",
    Icon: IconEvolutions,
    primary: true,
  },
  {
    href: "/configuracion",
    labelKey: "settings",
    Icon: IconSettings,
    primary: false,
  },
  { href: "/acerca-de", labelKey: "about", Icon: IconInfo, primary: false },
];

/**
 * Coincidencia de ruta activa: exacta para "/", prefijo para el resto.
 * Con `trailingSlash: true` (next.config.ts) las rutas exportadas terminan en
 * "/" y `usePathname()` puede devolver "/incarnon/", así que normalizamos la
 * barra final antes de comparar para no perder el resaltado activo.
 */
export function isActivePath(href: string, pathname: string): boolean {
  const normalized = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (href === "/") return normalized === "/";
  return normalized === href || normalized.startsWith(`${href}/`);
}
