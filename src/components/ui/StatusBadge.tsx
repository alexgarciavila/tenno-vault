"use client";

/**
 * Badge de estado de dominio. Guardrail no negociable: el estado SIEMPRE se
 * comunica con texto; el punto de color es decorativo y nunca aparece solo.
 * `hasIncompleteData` NO sustituye al estado: se apila como badge adicional
 * (bandera independiente del estado).
 *
 * Fidelidad al prototipo: el estado se muestra como punto + texto en mayúsculas
 * (sin píldora redondeada); "Datos incompletos" es un chip angular de aviso.
 */
import type { IncarnonStatus } from "../../lib/inventory";
import { useT } from "../../lib/i18n";
import { IconWarning } from "../icons";

const STATUS_STYLE: Record<IncarnonStatus, { dot: string; text: string }> = {
  "not-owned": { dot: "bg-fg-subtle", text: "text-fg-muted" },
  available: { dot: "bg-accent", text: "text-accent-strong" },
  "partially-installed": { dot: "bg-warning-fg", text: "text-warning-fg" },
  covered: { dot: "bg-success-fg", text: "text-success-fg" },
  completed: { dot: "bg-success-fg", text: "text-success-fg" },
};

export function StatusBadge({
  status,
  hasIncompleteData = false,
}: {
  status: IncarnonStatus;
  hasIncompleteData?: boolean;
}) {
  const t = useT();
  const { dot, text } = STATUS_STYLE[status];
  return (
    <span className="reflow-chain inline-flex flex-wrap items-center gap-2.5">
      <span
        className={`reflow-text inline-flex items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[0.12em] ${text}`}
      >
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dot}`} />
        {t.status[status]}
      </span>
      {hasIncompleteData ? (
        <span className="wf-cut wf-cut-sm reflow-text inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-warning-fg">
          <IconWarning className="size-3.5 shrink-0" />
          {t.status.incompleteData}
        </span>
      ) : null}
    </span>
  );
}
