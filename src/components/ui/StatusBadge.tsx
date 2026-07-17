"use client";

/**
 * Badge de estado de dominio. Guardrail no negociable: el estado SIEMPRE se
 * comunica con texto; el icono es decorativo y nunca aparece solo.
 * `hasIncompleteData` NO sustituye al estado: se apila como badge adicional
 * (bandera independiente del estado).
 */
import type { IncarnonStatus } from "../../lib/inventory";
import { useT } from "../../lib/i18n";
import {
  IconStatusAvailable,
  IconStatusCompleted,
  IconStatusCovered,
  IconStatusNotOwned,
  IconStatusPartial,
  IconWarning,
} from "../icons";

type IconComponent = (props: { className?: string }) => React.ReactNode;

const STATUS_STYLE: Record<IncarnonStatus, { bg: string; fg: string; Icon: IconComponent }> = {
  "not-owned": {
    bg: "bg-surface-elevated",
    fg: "text-fg-muted",
    Icon: IconStatusNotOwned,
  },
  available: {
    bg: "bg-accent-surface",
    fg: "text-accent-strong",
    Icon: IconStatusAvailable,
  },
  "partially-installed": {
    bg: "bg-warning-bg",
    fg: "text-warning-fg",
    Icon: IconStatusPartial,
  },
  covered: {
    bg: "bg-success-bg",
    fg: "text-success-fg",
    Icon: IconStatusCovered,
  },
  completed: {
    bg: "bg-success-bg",
    fg: "text-success-fg",
    Icon: IconStatusCompleted,
  },
};

const badgeBase =
  "reflow-text inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium";

export function StatusBadge({
  status,
  hasIncompleteData = false,
}: {
  status: IncarnonStatus;
  hasIncompleteData?: boolean;
}) {
  const t = useT();
  const { bg, fg, Icon } = STATUS_STYLE[status];
  return (
    <span className="reflow-chain inline-flex flex-wrap items-center gap-1.5">
      <span className={`${badgeBase} ${bg} ${fg}`}>
        <Icon className="size-4 shrink-0" />
        {t.status[status]}
      </span>
      {hasIncompleteData ? (
        <span className={`${badgeBase} bg-warning-bg text-warning-fg`}>
          <IconWarning className="size-4 shrink-0" />
          {t.status.incompleteData}
        </span>
      ) : null}
    </span>
  );
}
