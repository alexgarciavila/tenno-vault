"use client";

/**
 * Hoja "Más" del layout móvil: destinos de baja frecuencia
 * (Configuración, Acerca de) y hueco para futuras herramientas. Reutiliza el
 * componente `Sheet` (mismo patrón que los filtros).
 */
import Link from "next/link";
import { useT } from "../../lib/i18n";
import { Sheet } from "../ui/Sheet";
import { NAV_ITEMS, isActivePath } from "./nav-items";

export function MoreSheet({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
}) {
  const t = useT();
  const secondary = NAV_ITEMS.filter((item) => !item.primary);
  return (
    <Sheet open={open} title={t.nav.more} onClose={onClose}>
      <ul className="flex flex-col gap-1">
        {secondary.map((item) => {
          const active = isActivePath(item.href, pathname);
          const { Icon } = item;
          return (
            <li key={item.href} className="reflow-chain">
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`reflow-chain flex min-h-12 items-center gap-3 rounded-lg px-3 ${
                  active
                    ? "border-l-[3px] border-accent bg-accent-surface font-semibold text-accent-strong"
                    : "border-l-[3px] border-transparent text-fg-muted hover:bg-surface-elevated hover:text-fg"
                }`}
              >
                <Icon className="size-5" />
                <span className="reflow-text flex-1">{t.nav[item.labelKey]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
