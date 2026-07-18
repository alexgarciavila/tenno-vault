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
import {
  resolveCatalogText,
  resolveCatalogValue,
  type ResolvedCatalogText,
  type ResolvedCatalogValue,
} from "../../lib/catalog-i18n";
import { useLanguage, useT } from "../../lib/i18n";
import { toRoman } from "./roman";

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
  const language = useLanguage();
  const radioName = useId();
  const fixedPerk = tier.perks[0];
  const fixedName = fixedPerk ? resolveCatalogText(fixedPerk.name, language) : null;
  const condition = tier.unlockCondition
    ? resolveCatalogText(tier.unlockCondition, language)
    : null;

  return (
    <article
      className={`extreme-tier reflow-chain relative rounded-sm border p-4 ${completed ? "border-success-fg bg-success-bg/25" : "border-border bg-surface"}`}
    >
      <header className="extreme-stack extreme-gap reflow-chain mb-3 flex flex-wrap items-center gap-3 border-b border-border-subtle pb-3">
        <span
          aria-hidden="true"
          className={`extreme-marker wf-hex inline-grid size-9 shrink-0 place-items-center font-display text-[0.75rem] ${
            completed
              ? "bg-accent text-bg shadow-[0_0_12px_rgb(111_217_231/0.5)]"
              : "bg-surface-alt text-accent"
          }`}
        >
          <span>{toRoman(tier.tier)}</span>
        </span>
        <h4 className="reflow-text flex-1 font-semibold uppercase tracking-[0.1em] text-fg-strong">
          {t.evolutions.tier} {toRoman(tier.tier)}
          {!tier.selectable && fixedName ? (
            <span className="font-normal normal-case tracking-normal text-fg-muted">
              {" · "}
              <CatalogText value={fixedName} />
            </span>
          ) : null}
        </h4>
        <span
          data-active={completed ? "true" : undefined}
          className={`wf-cut wf-cut-sm reflow-text px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] ${completed ? "text-accent-strong" : "text-fg-muted"}`}
        >
          {completed ? t.evolutions.completed : t.evolutions.pending}
        </span>
        <p className="reflow-text w-full rounded-sm border-l-2 border-gold bg-gold-surface/40 px-3 py-2 text-[0.8125rem] text-fg-muted max-[240px]:px-1">
          {condition ? (
            <>
              {t.evolutions.challenge}: <CatalogText value={condition} />
            </>
          ) : (
            t.evolutions.unlockOnInstall
          )}
        </p>
      </header>

      {tier.selectable ? (
        <fieldset className="reflow-chain mt-3">
          <legend className="wf-section-label reflow-text mb-2.5">{t.evolutions.choosePerk}</legend>
          <div className="reflow-chain flex flex-col gap-1">
            {tier.perks.map((perk) => {
              const name = resolveCatalogText(perk.name, language);
              const description = resolveCatalogText(perk.description, language);
              const rawValues = perk.variantValues?.[variantId];
              const values = rawValues ? resolveCatalogValue(rawValues, language) : null;
              const notes = perk.notes ? resolveCatalogText(perk.notes, language) : null;
              return (
                <label
                  key={perk.id}
                  className="extreme-perk-option reflow-chain flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border border-transparent px-3 py-2 hover:border-border hover:bg-surface-alt has-[:checked]:border-accent has-[:checked]:bg-accent-surface"
                >
                  <input
                    type="radio"
                    name={radioName}
                    checked={selectedPerkId === perk.id}
                    onChange={() => onSelectPerk(perk.id)}
                    className="mt-1 size-5 shrink-0 accent-[#6fd9e7]"
                  />
                  <span className="reflow-text flex-1">
                    <span className="reflow-text block font-semibold uppercase tracking-[0.08em] text-fg-strong">
                      <CatalogText value={name} />
                    </span>
                    <span className="reflow-text block text-[0.8125rem] text-fg-muted">
                      <CatalogText value={description} />
                    </span>
                    {values ? (
                      <span className="reflow-text mt-0.5 block text-[0.8125rem] tabular-nums text-accent">
                        <CatalogValue value={values} />
                      </span>
                    ) : null}
                    {notes ? (
                      <span className="reflow-text mt-0.5 block text-[0.75rem] italic text-fg-muted">
                        <CatalogText value={notes} />
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : fixedPerk ? (
        <p className="reflow-text mt-2 text-[0.8125rem] text-fg-muted">
          <CatalogText value={resolveCatalogText(fixedPerk.description, language)} />
        </p>
      ) : null}

      <label className="extreme-perk-option reflow-chain mt-4 flex min-h-11 cursor-pointer items-center gap-3 border-t border-border-subtle pt-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => onToggleCompleted(event.target.checked)}
          className="size-5 shrink-0 accent-[#8de5ad]"
        />
        <span className="reflow-text flex-1 font-semibold uppercase tracking-[0.08em] text-fg">
          {t.evolutions.completed}
        </span>
      </label>
    </article>
  );
}

function CatalogText({ value }: { value: ResolvedCatalogText }) {
  return <span lang={value.isFallback ? value.effectiveLanguage : undefined}>{value.text}</span>;
}

function CatalogValue({ value }: { value: ResolvedCatalogValue }) {
  return (
    <span lang={!value.languageNeutral && value.isFallback ? value.effectiveLanguage : undefined}>
      {value.text}
    </span>
  );
}
