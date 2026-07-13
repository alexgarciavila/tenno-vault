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
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-[0.8125rem] font-medium ${
        checked
          ? "border-accent bg-[#0c3b4a] text-[#7dd3fc]"
          : "border-border bg-surface-alt text-fg-muted hover:text-fg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-3 rounded-full ${checked ? "bg-accent" : "bg-border"}`}
      />
      {label}
    </button>
  );
}
