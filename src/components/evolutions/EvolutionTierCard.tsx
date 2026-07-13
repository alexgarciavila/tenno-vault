"use client";

/**
 * Tarjeta de un tier de evolución. Tier 1 (`selectable: false`):
 * perk fijo como texto + checkbox "Completado". Tiers 2–N: `fieldset`/`legend`
 * con radios nativos (navegación con flechas gratis) — un perk por tier — más el
 * checkbox de completado. Los placeholders X/Y se sustituyen por
 * `variantValues[variantId]` cuando existen. Cambiar de perk no pide
 * confirmación (no es destructivo).
 */
import { useId } from "react";
import type { EvolutionTier } from "../../data/catalog-schema";
import { useT } from "../../lib/i18n";

export function EvolutionTierCard({
  tier,
  variantId,
  selectedPerkId,
  completed,
  onSelectPerk,
  onToggleCompleted,
}: {
  tier: EvolutionTier;
  variantId: string;
  selectedPerkId: string | null;
  completed: boolean;
  onSelectPerk: (perkId: string) => void;
  onToggleCompleted: (completed: boolean) => void;
}) {
  const t = useT();
  const radioName = useId();
  const fixedPerk = tier.perks[0];

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <header className="mb-1">
        <h4 className="font-semibold text-fg">
          {t.evolutions.tier} {tier.tier}
          {!tier.selectable && fixedPerk ? (
            <span className="ml-2 font-normal text-fg-muted">· {fixedPerk.name}</span>
          ) : null}
        </h4>
        <p className="text-[0.8125rem] text-fg-muted">
          {tier.unlockCondition
            ? `${t.evolutions.challenge}: ${tier.unlockCondition}`
            : t.evolutions.unlockOnInstall}
        </p>
      </header>

      {tier.selectable ? (
        <fieldset className="mt-3">
          <legend className="mb-2 text-[0.8125rem] font-medium text-fg-muted">
            {t.evolutions.choosePerk}
          </legend>
          <div className="flex flex-col gap-1">
            {tier.perks.map((perk) => {
              const values = perk.variantValues?.[variantId];
              return (
                <label
                  key={perk.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface-alt"
                >
                  <input
                    type="radio"
                    name={radioName}
                    checked={selectedPerkId === perk.id}
                    onChange={() => onSelectPerk(perk.id)}
                    className="mt-1 size-5 shrink-0 accent-[#38bdf8]"
                  />
                  <span>
                    <span className="font-medium text-fg">{perk.name}</span>
                    <span className="block text-[0.8125rem] text-fg-muted">{perk.description}</span>
                    {values ? (
                      <span className="mt-0.5 block text-[0.8125rem] tabular-nums text-accent">
                        {values}
                      </span>
                    ) : null}
                    {perk.notes ? (
                      <span className="mt-0.5 block text-[0.75rem] italic text-fg-muted">
                        {perk.notes}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : fixedPerk?.description ? (
        <p className="mt-2 text-[0.8125rem] text-fg-muted">{fixedPerk.description}</p>
      ) : null}

      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => onToggleCompleted(event.target.checked)}
          className="size-5 shrink-0 accent-[#86efac]"
        />
        <span className="font-medium text-fg">{t.evolutions.completed}</span>
      </label>
    </article>
  );
}
