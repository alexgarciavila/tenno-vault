"use client";

/**
 * Pantalla Inicio. Grid de 6 métricas mapeadas 1:1 a
 * `computeGlobalSummary`, bloque de bienvenida si no hay progreso, nota de fecha
 * del catálogo y accesos rápidos. Guardia de hidratación para leer el store.
 */
import Link from "next/link";
import { getCatalog } from "../../data/catalog";
import { useT } from "../../lib/i18n";
import { computeGlobalSummary } from "../../lib/inventory";
import { useHydrated } from "../../lib/use-hydrated";
import { useProgressStore } from "../../store/progress-store";
import { CatalogDateNote } from "../ui/CatalogDateNote";
import { MetricCard } from "../ui/MetricCard";
import { EditorialPageHeader } from "../ui/EditorialPageHeader";

export function HomeView() {
  const t = useT();
  const hydrated = useHydrated();
  const catalog = getCatalog();
  const progress = useProgressStore((state) => state.progress);

  const total = catalog.weapons.length;
  const summary = computeGlobalSummary(catalog.weapons, hydrated ? progress : {});
  const isEmpty = hydrated && summary.weaponsWithCopies === 0;

  const quickLink =
    "wf-cut inline-flex min-h-11 items-center px-4 text-[0.8125rem] font-semibold uppercase tracking-[0.09em] text-fg-muted hover:text-fg";

  return (
    <div className="space-y-6">
      <EditorialPageHeader title={t.home.title} />

      {isEmpty ? (
        <div className="angular-panel p-5">
          <p className="font-medium text-fg">{t.home.welcomeTitle}</p>
          <p className="mt-1 text-fg-muted">{t.home.welcomeBody}</p>
          <Link
            href="/incarnon"
            className="mt-4 inline-flex min-h-11 items-center rounded-sm bg-accent px-4 font-bold uppercase tracking-[0.1em] text-bg hover:bg-accent-strong"
          >
            {t.home.goToIncarnon}
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label={t.home.metrics.withCopies}
          value={summary.weaponsWithCopies}
          total={total}
        />
        <MetricCard
          label={t.home.metrics.withInstallations}
          value={summary.weaponsWithInstallations}
          total={total}
        />
        <MetricCard label={t.home.metrics.inventory} value={summary.inventoryCopies} />
        <MetricCard label={t.home.metrics.missing} value={summary.missingCopies} />
        <MetricCard
          label={t.home.metrics.completed}
          value={summary.completedWeapons}
          total={total}
        />
        <MetricCard
          label={t.home.metrics.evolutions}
          value={summary.evolutionsCompleted}
          total={summary.evolutionsTotal}
        />
      </div>

      <CatalogDateNote generatedAt={catalog.generatedAt} />

      <section aria-labelledby="accesos-rapidos" className="angular-panel space-y-3 p-5">
        <h2
          id="accesos-rapidos"
          className="text-base font-semibold uppercase tracking-[0.14em] text-fg-strong"
        >
          {t.home.quickAccessTitle}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/incarnon" className={quickLink}>
            {t.home.viewIncarnon}
          </Link>
          <Link href="/incarnon?pendientes=1" className={quickLink}>
            {t.home.viewPending}
          </Link>
          <Link href="/evoluciones" className={quickLink}>
            {t.home.viewEvolutions}
          </Link>
        </div>
      </section>
    </div>
  );
}
