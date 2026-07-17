/**
 * Aviso en línea como texto. Los errores nunca se comunican
 * solo con color/borde: siempre hay mensaje textual e icono decorativo.
 */
import { IconInfo, IconWarning } from "../icons";

type Variant = "info" | "success" | "warning" | "error";

const STYLE: Record<Variant, string> = {
  info: "border-border bg-surface-alt text-fg",
  success: "border-success-fg bg-success-bg text-success-fg",
  warning: "border-warning-fg bg-warning-bg text-warning-fg",
  error: "border-danger-bg bg-danger-bg text-danger-fg",
};

export function InlineAlert({ variant, message }: { variant: Variant; message: string }) {
  const Icon = variant === "error" || variant === "warning" ? IconWarning : IconInfo;
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[0.8125rem] ${STYLE[variant]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
