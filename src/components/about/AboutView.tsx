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
import { EditorialPageHeader } from "../ui/EditorialPageHeader";

export function AboutView() {
  const t = useT();
  const { attribution, generatedAt } = getCatalog();

  return (
    <div className="legal-copy max-w-[68ch] space-y-6">
      <EditorialPageHeader title={t.about.title} />

      <section className="angular-panel space-y-2 p-5">
        <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-fg-strong">
          {t.about.appHeading}
        </h2>
        <p className="text-fg-muted">{t.about.appBody}</p>
      </section>

      <section className="angular-panel space-y-2 p-5">
        <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-fg-strong">
          {t.about.sourceHeading}
        </h2>
        <p className="text-fg-muted">
          {t.about.sourceBody} {formatCatalogDate(generatedAt)}.
        </p>
        <ExternalLink href={attribution.sourceUrl} label={t.about.sourceLink} />
      </section>

      <section className="angular-panel space-y-2 p-5">
        <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-fg-strong">
          {t.about.licenseHeading}
        </h2>
        <p className="text-fg-muted">{t.about.licenseBody}</p>
        <ExternalLink href={attribution.licenseUrl} label={t.about.licenseLink} />
      </section>

      <section className="angular-panel space-y-2 p-5">
        <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-fg-strong">
          {t.about.noticeHeading}
        </h2>
        <p className="text-fg-muted">{t.about.noticeBody}</p>
      </section>
    </div>
  );
}
