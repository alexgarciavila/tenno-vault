/**
 * Chip conmutable tipo switch, SIEMPRE con texto visible (no icon-only).
 * Usa `aria-pressed` para exponer el estado a lectores.
 */
export function ToggleChip({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`reflow-text inline-flex min-h-11 max-w-full items-center gap-2 rounded-sm border px-3 py-1.5 text-left text-[0.8125rem] font-medium leading-snug ${
        checked
          ? "border-accent bg-accent-surface text-accent-strong"
          : "border-border bg-surface-alt text-fg-muted hover:border-accent hover:text-fg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-grid size-3 shrink-0 rotate-45 place-items-center border ${checked ? "border-accent bg-accent" : "border-fg-muted bg-transparent"}`}
      />
      {label}
    </button>
  );
}
