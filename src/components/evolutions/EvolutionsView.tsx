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
        <h1 className="text-[1.75rem] font-bold text-fg">{t.evolutions.title}</h1>
        <p className="text-fg-muted">{t.app.loading}</p>
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
        <h1 className="text-[1.75rem] font-bold text-fg">{t.evolutions.title}</h1>
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
    <div className="space-y-8">
      <h1 className="text-[1.75rem] font-bold text-fg">{t.evolutions.title}</h1>

      {groups.map(({ weapon, installations }) => (
        <section
          key={weapon.id}
          id={`arma-${weapon.id}`}
          aria-labelledby={`titulo-${weapon.id}`}
          className="scroll-mt-4 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <h2 id={`titulo-${weapon.id}`} className="text-xl font-semibold text-fg">
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
              <div key={installation.variantId} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium text-fg">
                    {variant?.name ?? installation.variantId}
                  </h3>
                  <ProgressMiniBar
                    completed={completedTiers}
                    total={installation.evolutionProgress.length}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {[...weapon.evolutions]
                    .sort((a, b) => a.tier - b.tier)
                    .map((tier) => {
                      const ep = installation.evolutionProgress.find(
                        (item) => item.tier === tier.tier,
                      );
                      return (
                        <EvolutionTierCard
                          key={tier.tier}
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
