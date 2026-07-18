"use client";

/**
 * Nota de fecha del catálogo. "Catálogo actualizado el
 * {fecha} · Ver atribución" con enlace a Acerca de.
 */
import Link from "next/link";
import { useT } from "../../lib/i18n";
import { formatCatalogDate } from "../../lib/format";

export function CatalogDateNote({ generatedAt }: { generatedAt: string }) {
  const t = useT();
  return (
    <p className="border-l-2 border-[rgb(111_217_231/0.14)] pl-3 text-[0.6875rem] uppercase tracking-[0.1em] text-fg-subtle">
      {t.common.catalogUpdated} {formatCatalogDate(generatedAt)} ·{" "}
      <Link href="/acerca-de" className="font-semibold text-accent hover:underline">
        {t.common.viewAttribution}
      </Link>
    </p>
  );
}
