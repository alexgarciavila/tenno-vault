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
import { BrandMark } from "../ui/BrandMark";

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
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[rgb(111_217_231/0.14)] bg-gradient-to-b from-[#070d12] to-[#050a0e] py-4 transition-[width] md:flex ${
        collapsed ? "w-[4.5rem] px-2" : "w-[14.75rem] px-3"
      }`}
    >
      <div
        className={`mb-4 flex items-center border-b border-[rgb(111_217_231/0.1)] pb-5 ${collapsed ? "flex-col gap-3" : "justify-between"}`}
      >
        <div className="flex min-w-0 items-center gap-3 px-1">
          <BrandMark className="size-9" />
          {!collapsed ? (
            <span className="display-title font-display text-[0.8125rem] uppercase tracking-[0.16em] text-fg-strong">
              {t.app.name}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t.nav.expand : t.nav.collapse}
          title={collapsed ? t.nav.expand : t.nav.collapse}
          className="inline-flex size-11 items-center justify-center rounded-lg border border-transparent text-fg-muted hover:border-border hover:bg-surface-elevated hover:text-fg"
        >
          <IconChevronLeft
            className={`size-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <ul className="flex flex-1 flex-col justify-start gap-1 pt-2">
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
                className={`wf-cut-nav relative flex min-h-12 items-center gap-3 border-l-2 px-3 text-[0.875rem] font-semibold uppercase tracking-[0.12em] ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "border-accent text-accent-strong after:absolute after:right-3 after:size-1.5 after:rotate-45 after:bg-accent"
                    : "border-transparent text-fg-muted hover:bg-surface-elevated hover:text-fg"
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
