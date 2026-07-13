"use client";

/**
 * Pantalla Acerca de. Atribución a la Warframe Wiki, enlace a la fuente,
 * licencia CC BY-NC-SA 3.0, aviso de uso personal no comercial y descargo sobre
 * Digital Extremes. `generatedAt` y las URLs de atribución salen directamente
 * del catálogo (no eliminar la atribución ni sourceUrl).
 * Client component para reflejar el idioma activo (i18n) al vuelo.
 */
import { getCatalog } from "../../data/catalog";
import { useT } from "../../lib/i18n";
import { formatCatalogDate } from "../../lib/format";
import { ExternalLink } from "../ui/ExternalLink";

export function AboutView() {
  const t = useT();
  const { attribution, generatedAt } = getCatalog();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-[1.75rem] font-bold text-fg">{t.about.title}</h1>

      <section className="space-y-1">
        <h2 className="text-xl font-semibold text-fg">{t.about.appHeading}</h2>
        <p className="text-fg-muted">{t.about.appBody}</p>
      </section>

      <section className="space-y-1">
        <h2 className="text-xl font-semibold text-fg">{t.about.sourceHeading}</h2>
        <p className="text-fg-muted">
          {t.about.sourceBody} {formatCatalogDate(generatedAt)}.
        </p>
        <ExternalLink href={attribution.sourceUrl} label={t.about.sourceLink} />
      </section>

      <section className="space-y-1">
        <h2 className="text-xl font-semibold text-fg">{t.about.licenseHeading}</h2>
        <p className="text-fg-muted">{t.about.licenseBody}</p>
        <ExternalLink href={attribution.licenseUrl} label={t.about.licenseLink} />
      </section>

      <section className="space-y-1">
        <h2 className="text-xl font-semibold text-fg">{t.about.noticeHeading}</h2>
        <p className="text-fg-muted">{t.about.noticeBody}</p>
      </section>
    </div>
  );
}
