/**
 * Chip conmutable tipo switch, SIEMPRE con texto visible (no icon-only).
 * Usa `aria-pressed` para exponer el estado a lectores. El recorte angular y el
 * borde de acento viven en una capa decorativa (`.wf-cut`), por lo que el
 * elemento real queda rectangular y el anillo de foco nunca se recorta.
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
      className={`wf-cut reflow-text inline-flex min-h-11 max-w-full items-center gap-2.5 px-4 py-1.5 text-left text-[0.8125rem] font-semibold uppercase leading-snug tracking-[0.09em] ${
        checked ? "text-accent-strong" : "text-fg-muted hover:text-fg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-2 shrink-0 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] ${
          checked ? "bg-accent" : "bg-fg-subtle"
        }`}
      />
      {label}
    </button>
  );
}
