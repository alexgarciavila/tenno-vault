"use client";

/**
 * Pantalla Evoluciones. Lista todas las instalaciones existentes
 * agrupadas por arma (h2) → variante (h3) → tarjetas de tier en orden 1→N.
 * Deep-link desde Incarnon vía ancla `#arma-<id>`. EmptyState con CTA si no hay
 * ninguna instalación. Guardia de hidratación para leer el store persistido.
 */
import { getCatalog } from "../../data/catalog";
import { useT } from "../../lib/i18n";
import { useHydrated } from "../../lib/use-hydrated";
import { useProgressStore } from "../../store/progress-store";
import { EmptyState } from "../ui/EmptyState";
import { ExternalLink } from "../ui/ExternalLink";
import { ProgressMiniBar } from "../ui/ProgressMiniBar";
import { EvolutionTierCard } from "./EvolutionTierCard";
import { useRouter } from "next/navigation";
import { EditorialPageHeader } from "../ui/EditorialPageHeader";

export function EvolutionsView() {
  const t = useT();
  const hydrated = useHydrated();
  const router = useRouter();
  const catalog = getCatalog();
  const progress = useProgressStore((state) => state.progress);
  const setTierCompleted = useProgressStore((state) => state.setTierCompleted);
  const selectPerk = useProgressStore((state) => state.selectPerk);

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

  return (
    <div className="reflow-chain space-y-8">
      <EditorialPageHeader title={t.evolutions.title} subtitle={t.evolutions.subtitle} />

      {groups.map(({ weapon, installations }) => (
        <section
          key={weapon.id}
          id={`arma-${weapon.id}`}
          aria-labelledby={`titulo-${weapon.id}`}
          className="angular-panel extreme-panel reflow-chain scroll-mt-6 space-y-6 p-4 sm:p-5 lg:p-6 target:[&::before]:border-accent target:[&::before]:shadow-[0_0_18px_rgb(112_220_235/.12)]"
        >
          <div className="extreme-stack extreme-gap reflow-chain flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <h2
              id={`titulo-${weapon.id}`}
              className="reflow-text font-bold tracking-[0.04em] text-fg"
            >
              {weapon.name}
            </h2>
            <ExternalLink href={weapon.sourceUrl} label={t.evolutions.viewWiki} />
          </div>

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
                  <h3 className="reflow-text text-lg font-semibold text-gold">
                    {variant?.name ?? installation.variantId}
                  </h3>
                  <ProgressMiniBar
                    completed={completedTiers}
                    total={installation.evolutionProgress.length}
                  />
                </div>

                <div className="reflow-chain grid grid-cols-[repeat(auto-fit,minmax(min(100%,22.5rem),1fr))] gap-4 max-[240px]:grid-cols-[minmax(0,1fr)]">
                  {[...weapon.evolutions]
                    .sort((a, b) => a.tier - b.tier)
                    .map((tier) => {
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
        </section>
      ))}
    </div>
  );
}
