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
import { useT } from "../../lib/i18n";
import { IconWarning } from "../icons";

export function StatusBadge({
  isCompleted = false,
  hasIncompleteData = false,
}: {
  isCompleted?: boolean;
  hasIncompleteData?: boolean;
}) {
  const t = useT();
  if (!isCompleted && !hasIncompleteData) return null;
  return (
    <span className="reflow-chain inline-flex flex-wrap items-center gap-2.5">
      {isCompleted ? (
        <span className="reflow-text inline-flex items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-success-fg">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-success-fg" />
          {t.status.completed}
        </span>
      ) : null}
      {hasIncompleteData ? (
        <span className="wf-cut wf-cut-sm reflow-text inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-warning-fg">
          <IconWarning className="size-3.5 shrink-0" />
          {t.status.incompleteData}
        </span>
      ) : null}
    </span>
  );
}
