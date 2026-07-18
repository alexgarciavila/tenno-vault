"use client";

/**
 * Pantalla Evoluciones. Lista todas las instalaciones existentes agrupadas por
 * arma. Cada arma es un panel angular plegable (acordeón):
 *
 *  - Plegado (estado inicial): cabecera con nombre (Michroma) + badge de
 *    categoría + contador agregado n/m, y debajo una lista compacta de tiers
 *    (numeral romano, nombre del perk elegido o "Evolución N", condición de
 *    desbloqueo y chip de estado). Solo lectura.
 *  - Desplegado: la vista detallada por instalación (h3 variante → tarjetas de
 *    tier con radiogroup de perks y checkbox de completado).
 *
 * Semántica de contadores:
 *  - Cabecera de arma (n/m): `computeEvolutionSummary` — n = tiers completados
 *    en TODAS las instalaciones existentes; m = total de tiers de esas
 *    instalaciones (escala con el nº de instalaciones).
 *  - Lista compacta: un tier se marca COMPLETADO si está completado en TODAS las
 *    instalaciones del arma (AND); si no, PENDIENTE.
 *  - Subtítulo global: "PROGRESO POR ARMA · N/M COMPLETADAS" donde N/M es la
 *    suma de tiers completados y totales de todas las armas mostradas.
 *
 * Deep-link `#arma-<id>` (desde "Ver evoluciones" de las tarjetas): despliega el
 * arma correspondiente y la desplaza a la vista. El estado de expansión vive en
 * memoria (no se persiste). Guardia de hidratación para leer el store.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCatalog } from "../../data/catalog";
import { useT } from "../../lib/i18n";
import { computeEvolutionSummary } from "../../lib/inventory";
import { useHydrated } from "../../lib/use-hydrated";
import { useProgressStore } from "../../store/progress-store";
import { EditorialPageHeader } from "../ui/EditorialPageHeader";
import { EmptyState } from "../ui/EmptyState";
import { ExternalLink } from "../ui/ExternalLink";
import { ProgressMiniBar } from "../ui/ProgressMiniBar";
import { IconChevronLeft } from "../icons";
import { EvolutionTierCard } from "./EvolutionTierCard";
import { toRoman } from "./roman";

const WIKI_LINK_CLASS = "text-[0.75rem] font-semibold uppercase tracking-[0.1em]";

export function EvolutionsView() {
  const t = useT();
  const hydrated = useHydrated();
  const router = useRouter();
  const catalog = getCatalog();
  const progress = useProgressStore((state) => state.progress);
  const setTierCompleted = useProgressStore((state) => state.setTierCompleted);
  const selectPerk = useProgressStore((state) => state.selectPerk);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Deep-link `#arma-<id>`: despliega y desplaza el arma indicada al montar.
  useEffect(() => {
    const match = window.location.hash.match(/^#arma-(.+)$/);
    if (!match || !match[1]) return;
    const id = decodeURIComponent(match[1]);
    setExpanded((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      document.getElementById(`arma-${id}`)?.scrollIntoView({ block: "start" });
    });
  }, []);

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <EditorialPageHeader title={t.evolutions.title} subtitle={t.evolutions.subtitle} />
        <p aria-live="polite" className="text-fg-muted">
          {t.app.loading}
        </p>
      </div>
    );
  }

  // Armas con al menos una instalación válida (variantId presente en catálogo).
  const groups = catalog.weapons
    .map((weapon) => {
      const variantIds = new Set(weapon.variants.map((v) => v.id));
      const installations =
        progress[weapon.id]?.installations.filter((inst) => variantIds.has(inst.variantId)) ?? [];
      return { weapon, installations };
    })
    .filter((group) => group.installations.length > 0);

  if (groups.length === 0) {
    return (
      <div className="space-y-5">
        <EditorialPageHeader title={t.evolutions.title} subtitle={t.evolutions.subtitle} />
        <EmptyState
          title={t.evolutions.emptyTitle}
          description={t.evolutions.emptyBody}
          ctaLabel={t.evolutions.goToIncarnon}
          onCta={() => router.push("/incarnon")}
        />
      </div>
    );
  }

  const totalDone = groups.reduce(
    (acc, group) =>
      acc +
      group.installations.reduce(
        (sum, inst) => sum + inst.evolutionProgress.filter((ep) => ep.completed).length,
        0,
      ),
    0,
  );
  const totalAll = groups.reduce(
    (acc, group) =>
      acc + group.installations.reduce((sum, inst) => sum + inst.evolutionProgress.length, 0),
    0,
  );
  const subtitle = `${t.evolutions.subtitlePrefix.toUpperCase()} · ${totalDone}/${totalAll} ${t.evolutions.completedCountLabel.toUpperCase()}`;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="reflow-chain space-y-6">
      <EditorialPageHeader title={t.evolutions.title} subtitle={subtitle} />

      <div className="reflow-chain flex flex-col gap-4">
        {groups.map(({ weapon, installations }) => {
          const isOpen = expanded.has(weapon.id);
          const summary = computeEvolutionSummary(weapon, progress[weapon.id]);
          const sortedTiers = [...weapon.evolutions].sort((a, b) => a.tier - b.tier);
          const titleId = `titulo-${weapon.id}`;
          const panelId = `evo-panel-${weapon.id}`;

          return (
            <section
              key={weapon.id}
              id={`arma-${weapon.id}`}
              aria-labelledby={titleId}
              className="angular-panel angular-panel--target extreme-panel reflow-chain scroll-mt-6 p-4 sm:p-5 lg:p-6"
            >
              <h2 className="reflow-chain m-0">
                {/* Cabecera consistente en TODAS las armas (igual que las cards):
                    chevron a la izquierda; a su lado una columna con el nombre
                    arriba (ancho completo, envuelve por palabras) y el badge de
                    categoría SIEMPRE debajo del título, pegado a la izquierda; el
                    contador n/m queda a la derecha de la cabecera. */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(weapon.id)}
                  className="extreme-stack extreme-gap reflow-chain flex w-full flex-nowrap items-start gap-3 text-left"
                >
                  <IconChevronLeft
                    aria-hidden="true"
                    className={`mt-1 size-5 shrink-0 text-accent transition-transform ${
                      isOpen ? "-rotate-90" : "rotate-180"
                    }`}
                  />
                  <span className="flex flex-1 flex-col gap-2">
                    <span
                      id={titleId}
                      className="display-title font-display text-[1.0625rem] uppercase tracking-[0.12em] text-fg-strong"
                    >
                      {weapon.name}
                    </span>
                    <span className="wf-cut wf-cut-sm self-start px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-accent">
                      {t.category[weapon.category]}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.75rem] font-bold uppercase tracking-[0.12em] tabular-nums text-accent">
                    {summary.completedTiers} / {summary.totalTiers}
                  </span>
                </button>
              </h2>

              {isOpen ? (
                <div id={panelId} className="reflow-chain mt-5 space-y-6">
                  {installations.map((installation) => {
                    const variant = weapon.variants.find((v) => v.id === installation.variantId);
                    const completedTiers = installation.evolutionProgress.filter(
                      (ep) => ep.completed,
                    ).length;
                    return (
                      <div
                        key={installation.variantId}
                        className="extreme-variant reflow-chain space-y-4 rounded-sm border border-border-subtle bg-bg-deep/50 p-3 sm:p-4"
                      >
                        <div className="extreme-stack extreme-gap reflow-chain flex flex-wrap items-center justify-between gap-2">
                          <h3 className="reflow-text text-base font-semibold uppercase tracking-[0.1em] text-gold">
                            {variant?.name ?? installation.variantId}
                          </h3>
                          <ProgressMiniBar
                            completed={completedTiers}
                            total={installation.evolutionProgress.length}
                          />
                        </div>

                        <div className="reflow-chain grid grid-cols-[repeat(auto-fit,minmax(min(100%,22.5rem),1fr))] gap-4 max-[240px]:grid-cols-[minmax(0,1fr)]">
                          {sortedTiers.map((tier) => {
                            const ep = installation.evolutionProgress.find(
                              (item) => item.tier === tier.tier,
                            );
                            return (
                              <div key={tier.tier} className="reflow-chain">
                                <EvolutionTierCard
                                  tier={tier}
                                  variantId={installation.variantId}
                                  selectedPerkId={ep?.selectedPerkId ?? null}
                                  completed={ep?.completed ?? false}
                                  onSelectPerk={(perkId) =>
                                    selectPerk(weapon.id, installation.variantId, tier.tier, perkId)
                                  }
                                  onToggleCompleted={(completed) =>
                                    setTierCompleted(
                                      weapon.id,
                                      installation.variantId,
                                      tier.tier,
                                      completed,
                                    )
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <ExternalLink
                    href={weapon.sourceUrl}
                    label={t.evolutions.viewWiki}
                    className={WIKI_LINK_CLASS}
                  />
                </div>
              ) : (
                <ul className="reflow-chain mt-4 flex flex-col gap-1.5">
                  {sortedTiers.map((tier) => {
                    const fixedPerk = tier.perks[0];
                    const perInstall = installations.map((inst) =>
                      inst.evolutionProgress.find((ep) => ep.tier === tier.tier),
                    );
                    const completedAll =
                      perInstall.length > 0 && perInstall.every((ep) => ep?.completed);

                    let primary: string;
                    if (!tier.selectable && fixedPerk) {
                      primary = fixedPerk.name;
                    } else {
                      const selectedIds = [
                        ...new Set(
                          perInstall
                            .map((ep) => ep?.selectedPerkId)
                            .filter((id): id is string => Boolean(id)),
                        ),
                      ];
                      const chosen =
                        selectedIds.length === 1
                          ? tier.perks.find((p) => p.id === selectedIds[0])
                          : undefined;
                      primary = chosen?.name ?? `${t.evolutions.tier} ${toRoman(tier.tier)}`;
                    }

                    const condition = tier.unlockCondition
                      ? `${t.evolutions.challenge}: ${tier.unlockCondition}`
                      : t.evolutions.unlockOnInstall;

                    return (
                      <li
                        key={tier.tier}
                        className="extreme-perk-option reflow-chain flex items-center gap-4 rounded-sm border border-border-subtle bg-bg-deep/40 px-3 py-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className={`wf-hex inline-grid size-8 shrink-0 place-items-center font-display text-[0.6875rem] ${
                            completedAll ? "bg-accent text-bg" : "bg-surface-alt text-accent"
                          }`}
                        >
                          {toRoman(tier.tier)}
                        </span>
                        <span className="reflow-text min-w-0 flex-1">
                          <span className="reflow-text block text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-fg-strong">
                            {primary}
                          </span>
                          <span className="reflow-text block text-[0.75rem] text-fg-subtle">
                            {condition}
                          </span>
                        </span>
                        <span
                          data-active={completedAll ? "true" : undefined}
                          className={`wf-cut wf-cut-sm reflow-text shrink-0 px-3 py-1 text-[0.625rem] font-bold uppercase tracking-[0.14em] ${
                            completedAll ? "text-accent-strong" : "text-fg-muted"
                          }`}
                        >
                          {completedAll ? t.evolutions.completed : t.evolutions.pending}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
