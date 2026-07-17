"use client";

/**
 * Hoja modal desde abajo (bottom sheet), patrón compartido por "Más" del layout
 * y por los filtros en móvil. Focus trap, cierre con Esc / clic fuera / botón
 * "Cerrar", y retorno de foco al cerrar.
 */
import { useEffect, useId, useRef } from "react";
import { useT } from "../../lib/i18n";
import { IconClose } from "../icons";

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="extreme-modal-gutter fixed inset-0 z-50 flex min-w-0 items-end justify-center bg-black/75 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="extreme-modal-panel reflow-chain relative max-h-[min(85dvh,44rem)] w-full max-w-lg overflow-y-auto rounded-t-xl border border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_16px_40px_rgb(0_0_0/.32)] before:absolute before:left-0 before:top-0 before:h-1 before:max-w-full before:w-24 before:bg-accent sm:rounded-xl"
      >
        <div className="extreme-gap reflow-chain mb-3 flex items-center justify-between">
          <h2 id={titleId} className="reflow-text text-lg font-semibold text-fg">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.nav.close}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-transparent text-fg-muted hover:border-border hover:bg-surface-elevated hover:text-fg"
          >
            <IconClose className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
