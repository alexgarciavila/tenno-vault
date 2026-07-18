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
    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center text-[0.6875rem] font-semibold uppercase leading-tight tracking-[0.06em]";

  return (
    <nav
      aria-label={t.nav.primary}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {primary.map((item) => {
        const active = isActivePath(item.href, pathname);
        const { Icon } = item;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${itemClass} min-h-14 ${active ? "bg-accent-surface text-accent-strong before:absolute before:inset-x-2 before:top-0 before:h-0.5 before:bg-accent" : "text-fg-muted hover:bg-surface hover:text-fg"}`}
          >
            <Icon className="size-6" />
            <span className="reflow-text">{t.nav[item.labelKey]}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        aria-haspopup="dialog"
        className={`${itemClass} min-h-14 ${moreActive ? "bg-accent-surface text-accent-strong before:absolute before:inset-x-2 before:top-0 before:h-0.5 before:bg-accent" : "text-fg-muted hover:bg-surface hover:text-fg"}`}
      >
        <IconMore className="size-6" />
        <span className="reflow-text">{t.nav.more}</span>
      </button>
    </nav>
  );
}
