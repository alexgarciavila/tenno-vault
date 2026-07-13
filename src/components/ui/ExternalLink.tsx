"use client";

/**
 * Enlace externo (a la wiki, licencia, etc.). Icono + texto, nunca solo icono.
 * `target="_blank"` con `rel="noopener noreferrer"` y un
 * `aria-label` que avisa de la apertura en pestaña nueva.
 */
import { useT } from "../../lib/i18n";
import { IconExternal } from "../icons";

export function ExternalLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const t = useT();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${t.common.opensInNewTab}`}
      className={`inline-flex items-center gap-1.5 text-accent hover:text-accent-strong hover:underline ${className}`}
    >
      <span>{label}</span>
      <IconExternal className="size-4 shrink-0" />
    </a>
  );
}
