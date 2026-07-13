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
    bg: "bg-[#262b33]",
    fg: "text-[#b7bfc9]",
    Icon: IconStatusNotOwned,
  },
  available: {
    bg: "bg-[#0c3b4a]",
    fg: "text-[#7dd3fc]",
    Icon: IconStatusAvailable,
  },
  "partially-installed": {
    bg: "bg-[#4a3308]",
    fg: "text-[#fbbf24]",
    Icon: IconStatusPartial,
  },
  covered: {
    bg: "bg-[#072e2b]",
    fg: "text-[#5eead4]",
    Icon: IconStatusCovered,
  },
  completed: {
    bg: "bg-[#0c3d1e]",
    fg: "text-[#86efac]",
    Icon: IconStatusCompleted,
  },
};

const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium";

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
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`${badgeBase} ${bg} ${fg}`}>
        <Icon className="size-4 shrink-0" />
        {t.status[status]}
      </span>
      {hasIncompleteData ? (
        <span className={`${badgeBase} bg-[#2e1065] text-[#c4b5fd]`}>
          <IconWarning className="size-4 shrink-0" />
          {t.status.incompleteData}
        </span>
      ) : null}
    </span>
  );
}
