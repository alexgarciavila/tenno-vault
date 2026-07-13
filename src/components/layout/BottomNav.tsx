"use client";

/**
 * Barra de navegación inferior móvil. 3 destinos de uso
 * frecuente + "Más" (abre la hoja). Fija, con safe-area para el notch. Cada
 * ítem ≥44px de alto. Ítem activo con `aria-current="page"` + acento.
 */
import Link from "next/link";
import { useT } from "../../lib/i18n";
import { IconMore } from "../icons";
import { NAV_ITEMS, isActivePath } from "./nav-items";

export function BottomNav({
  pathname,
  moreActive,
  onOpenMore,
}: {
  pathname: string;
  moreActive: boolean;
  onOpenMore: () => void;
}) {
  const t = useT();
  const primary = NAV_ITEMS.filter((item) => item.primary);
  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[0.6875rem]";

  return (
    <nav
      aria-label={t.nav.primary}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface-alt pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {primary.map((item) => {
        const active = isActivePath(item.href, pathname);
        const { Icon } = item;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${itemClass} min-h-14 ${active ? "text-accent" : "text-fg-muted"}`}
          >
            <Icon className="size-6" />
            <span>{t.nav[item.labelKey]}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        aria-haspopup="dialog"
        className={`${itemClass} min-h-14 ${moreActive ? "text-accent" : "text-fg-muted"}`}
      >
        <IconMore className="size-6" />
        <span>{t.nav.more}</span>
      </button>
    </nav>
  );
}
