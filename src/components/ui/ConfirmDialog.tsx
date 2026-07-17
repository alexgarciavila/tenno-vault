"use client";

/**
 * Diálogo de confirmación accesible propio (NO `window.confirm`):
 *  - `role="dialog"` modal con `aria-labelledby`/`aria-describedby`.
 *  - Foco inicial en la acción segura ("Cancelar").
 *  - Focus trap mientras está abierto y retorno de foco al cerrar.
 *  - Cierre con Esc y con clic fuera (equivalentes a Cancelar).
 *  - Variante `danger` y `requireCheckbox` (reset): el botón destructivo queda
 *    deshabilitado hasta marcar la casilla de confirmación explícita.
 */
import { useEffect, useId, useRef, useState } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  requireCheckbox = false,
  checkboxLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  requireCheckbox?: boolean;
  checkboxLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
      return;
    }
    previousFocus.current = document.activeElement as HTMLElement | null;
    // Foco inicial en la acción segura.
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
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
  }, [open, onCancel]);

  if (!open) return null;

  const confirmDisabled = requireCheckbox && !acknowledged;

  return (
    <div
      className="extreme-modal-gutter fixed inset-0 z-50 flex min-w-0 items-center justify-center bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="extreme-modal-panel reflow-chain relative max-h-[min(90dvh,44rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-[0_16px_40px_rgb(0_0_0/.32)] before:absolute before:left-0 before:top-0 before:h-1 before:max-w-full before:w-24 before:bg-accent"
      >
        <h2 id={titleId} className="reflow-text text-lg font-semibold text-fg">
          {title}
        </h2>
        <div id={descId} className="reflow-text mt-2 space-y-2 text-fg-muted">
          {description}
        </div>

        {requireCheckbox ? (
          <label className="extreme-perk-option reflow-chain mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-danger-bg bg-danger-bg/30 p-2 text-[0.8125rem] text-fg">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[#fda4af]"
            />
            <span className="reflow-text flex-1">{checkboxLabel}</span>
          </label>
        ) : null}

        <div className="extreme-actions reflow-chain mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="reflow-text min-h-11 rounded-lg border border-border bg-surface-alt px-4 font-medium text-fg hover:border-accent"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`reflow-text min-h-11 rounded-lg px-4 font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              danger
                ? "bg-danger-bg text-danger-fg hover:brightness-125"
                : "bg-accent text-bg hover:bg-accent-strong"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
