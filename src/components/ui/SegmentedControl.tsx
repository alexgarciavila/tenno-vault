/**
 * Control segmentado accesible (`role="radiogroup"` con `role="radio"`). Usado
 * para el idioma y como base de `ViewSwitch`. Navegación
 * por teclado con flechas entre opciones.
 */
import { useId } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const groupId = useId();

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + options.length) % options.length;
    const option = options[next];
    if (option) onChange(option.value);
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="reflow-chain inline-flex flex-wrap gap-1.5"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            id={`${groupId}-${option.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`wf-cut reflow-text min-h-11 px-4 py-1 text-[0.8125rem] font-bold uppercase tracking-[0.14em] ${
              selected ? "text-accent-strong" : "text-fg-muted hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
