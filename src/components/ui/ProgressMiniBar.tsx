/**
 * Mini-barra de progreso de evoluciones. SIEMPRE acompañada del texto "X/Y"
 * adyacente (nunca solo la barra) — mismo principio de accesibilidad que los
 * badges. La barra es decorativa (`aria-hidden`); el texto
 * es la fuente de verdad.
 */
export function ProgressMiniBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-alt">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[0.8125rem] tabular-nums text-fg-muted">
        {completed}/{total}
      </span>
    </span>
  );
}
