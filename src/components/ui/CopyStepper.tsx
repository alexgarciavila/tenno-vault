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
    "inline-flex size-11 items-center justify-center rounded-sm border border-border bg-surface-alt text-fg enabled:hover:border-accent enabled:hover:bg-surface-elevated disabled:cursor-not-allowed disabled:text-fg-subtle";
  return (
    <div
      className={`copy-stepper flex flex-wrap items-center gap-3 ${label ? "justify-between" : "justify-end"}`}
    >
      {label ? (
        <span className="copy-stepper__label text-[0.8125rem] text-fg-muted">{label}</span>
      ) : null}
      <div className="copy-stepper__controls flex items-center gap-2">
        <button
          type="button"
          className={`${btn} copy-stepper__decrement`}
          onClick={onDecrement}
          disabled={value <= min}
          aria-label={t.incarnon.decrement}
        >
          <IconMinus className="size-5" />
        </button>
        <span
          aria-live="polite"
          className="copy-stepper__value min-w-6 text-center text-base font-semibold tabular-nums"
        >
          {value}
        </span>
        <button
          type="button"
          className={`${btn} copy-stepper__increment`}
          onClick={onIncrement}
          aria-label={t.incarnon.increment}
        >
          <IconPlus className="size-5" />
        </button>
      </div>
    </div>
  );
}
