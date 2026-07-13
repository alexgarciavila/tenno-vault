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
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[0.8125rem] font-medium text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">
        {value}
        {typeof total === "number" ? (
          <span className="ml-1 text-base font-normal text-fg-muted">
            {t.common.of} {total}
          </span>
        ) : null}
      </p>
      {hint ? <p className="mt-1 text-[0.8125rem] text-fg-muted">{hint}</p> : null}
    </div>
  );
}
