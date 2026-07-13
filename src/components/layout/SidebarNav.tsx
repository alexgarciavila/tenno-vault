"use client";

/**
 * Sidebar de escritorio. Riel colapsado (solo iconos) por defecto en `md`,
 * expandido (icono + etiqueta) en `lg+`. Botón de contraer/expandir con
 * `aria-expanded`. Ítem activo con `aria-current="page"` + acento lateral (no
 * solo color). El estado de colapso es de sesión, no se persiste.
 */
import Link from "next/link";
import { useT } from "../../lib/i18n";
import { IconChevronLeft } from "../icons";
import { NAV_ITEMS, isActivePath } from "./nav-items";

export function SidebarNav({
  pathname,
  collapsed,
  onToggleCollapse,
}: {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const t = useT();
  return (
    <nav
      aria-label={t.nav.primary}
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface-alt py-3 md:flex ${
        collapsed ? "w-16 px-2" : "w-60 px-3"
      }`}
    >
      <div className={`mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <span className="px-2 font-semibold tracking-tight text-fg">{t.app.name}</span>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t.nav.expand : t.nav.collapse}
          title={collapsed ? t.nav.expand : t.nav.collapse}
          className="inline-flex size-11 items-center justify-center rounded-lg text-fg-muted hover:text-fg"
        >
          <IconChevronLeft
            className={`size-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(item.href, pathname);
          const { Icon } = item;
          const label = t.nav[item.labelKey];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? label : undefined}
                title={collapsed ? label : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "border-l-2 border-accent bg-surface pl-2.5 font-medium text-fg"
                    : "text-fg-muted hover:bg-surface hover:text-fg"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed ? <span>{label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
