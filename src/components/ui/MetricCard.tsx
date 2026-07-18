"use client";

/**
 * Tarjeta de métrica de la pantalla Inicio. Muestra una cifra
 * grande con `tabular-nums` (columnas estables) y, opcionalmente, un total
 * "de N".
 */
import { useT } from "../../lib/i18n";

export function MetricCard({
  label,
  value,
  total,
  hint,
}: {
  label: string;
  value: number;
  total?: number;
  hint?: string;
}) {
  const t = useT();
  return (
    <div className="angular-panel extreme-panel reflow-chain p-5">
      <p className="reflow-text text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </p>
      <p className="reflow-text mt-2 font-display text-3xl tabular-nums text-accent-strong">
        {value}
        {typeof total === "number" ? (
          <span className="ml-1 text-base font-normal text-fg-muted">
            {t.common.of} {total}
          </span>
        ) : null}
      </p>
      {hint ? <p className="reflow-text mt-1 text-[0.8125rem] text-fg-muted">{hint}</p> : null}
    </div>
  );
}
