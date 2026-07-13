"use client";

/**
 * Stepper de copias sin instalar. Botones ≥44×44px (objetivo
 * táctil móvil). El valor se anuncia con `aria-live` y los botones llevan
 * `aria-label` explícito. Oculto en armas innatas (lo decide el llamador).
 */
import { IconMinus, IconPlus } from "../icons";
import { useT } from "../../lib/i18n";

export function CopyStepper({
  value,
  label,
  min = 0,
  onIncrement,
  onDecrement,
}: {
  value: number;
  label?: string;
  min?: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const t = useT();
  const btn =
    "inline-flex size-11 items-center justify-center rounded-lg border border-border bg-surface-alt text-fg enabled:hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className={`flex items-center gap-3 ${label ? "justify-between" : "justify-end"}`}>
      {label ? <span className="text-[0.8125rem] text-fg-muted">{label}</span> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={onDecrement}
          disabled={value <= min}
          aria-label={t.incarnon.decrement}
        >
          <IconMinus className="size-5" />
        </button>
        <span
          aria-live="polite"
          className="min-w-6 text-center text-base font-semibold tabular-nums"
        >
          {value}
        </span>
        <button
          type="button"
          className={btn}
          onClick={onIncrement}
          aria-label={t.incarnon.increment}
        >
          <IconPlus className="size-5" />
        </button>
      </div>
    </div>
  );
}
