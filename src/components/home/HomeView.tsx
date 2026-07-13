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

export function HomeView() {
  const t = useT();
  const hydrated = useHydrated();
  const catalog = getCatalog();
  const progress = useProgressStore((state) => state.progress);

  const total = catalog.weapons.length;
  const summary = computeGlobalSummary(catalog.weapons, hydrated ? progress : {});
  const isEmpty = hydrated && summary.adaptersObtained === 0;

  const quickLink =
    "inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-alt px-4 font-medium text-fg hover:border-accent";

  return (
    <div className="space-y-5">
      <h1 className="text-[1.75rem] font-bold text-fg">{t.home.title}</h1>

      {isEmpty ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-medium text-fg">{t.home.welcomeTitle}</p>
          <p className="mt-1 text-fg-muted">{t.home.welcomeBody}</p>
          <Link
            href="/incarnon"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 font-medium text-bg hover:bg-accent-strong"
          >
            {t.home.goToIncarnon}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label={t.home.metrics.obtained}
          value={summary.adaptersObtained}
          total={total}
        />
        <MetricCard label={t.home.metrics.installed} value={summary.installed} total={total} />
        <MetricCard label={t.home.metrics.available} value={summary.availableCopies} />
        <MetricCard label={t.home.metrics.pending} value={summary.pendingCopies} />
        <MetricCard
          label={t.home.metrics.covered}
          value={summary.fullyCoveredFamilies}
          total={total}
        />
        <MetricCard
          label={t.home.metrics.evolutions}
          value={summary.evolutionsCompleted}
          total={summary.evolutionsTotal}
        />
      </div>

      <CatalogDateNote generatedAt={catalog.generatedAt} />

      <section aria-labelledby="accesos-rapidos" className="space-y-3">
        <h2 id="accesos-rapidos" className="text-xl font-semibold text-fg">
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
