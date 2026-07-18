/**
 * Mini-barra de progreso de evoluciones. SIEMPRE acompañada del texto "X / Y"
 * adyacente (nunca solo la barra) — mismo principio de accesibilidad que los
 * badges. La barra es decorativa (`aria-hidden`); el texto
 * es la fuente de verdad.
 */
export function ProgressMiniBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <span className="reflow-chain inline-flex flex-wrap items-center gap-2">
      <span
        aria-hidden="true"
        className="h-1.5 w-16 max-w-full flex-[1_1_2rem] overflow-hidden bg-surface-elevated"
      >
        <span className="block h-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="reflow-text text-[0.8125rem] tabular-nums text-fg-muted">
        {completed} / {total}
      </span>
    </span>
  );
}
