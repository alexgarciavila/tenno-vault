"use client";

/**
 * Tarjeta de arma. Muestra estado (badge con texto), resumen
 * instalado·disponible·pendiente, stepper de copias (oculto en innatas),
 * checklist de variantes y enlaces. Al desinstalar una variante CON progreso
 * abre `ConfirmDialog`; sin progreso, se quita al instante.
 *
 * Toda cifra proviene de `buildWeaponViewModel` (funciones puras de dominio).
 */
import { useState } from "react";
import Link from "next/link";
import type { IncarnonWeapon } from "../../data/catalog-schema";
import { useT } from "../../lib/i18n";
import type { UserIncarnonProgress } from "../../lib/user-types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CopyStepper } from "../ui/CopyStepper";
import { ExternalLink } from "../ui/ExternalLink";
import { StatusBadge } from "../ui/StatusBadge";
import { VariantChecklist } from "./VariantChecklist";
import { WeaponImage } from "./WeaponImage";
import { buildWeaponViewModel } from "./weapon-view-model";

export function WeaponCard({
  weapon,
  progress,
  onInstallVariant,
  onUninstallVariant,
  onSetUninstalledCopies,
}: {
  weapon: IncarnonWeapon;
  progress?: UserIncarnonProgress;
  onInstallVariant: (variantId: string) => void;
  onUninstallVariant: (variantId: string) => void;
  onSetUninstalledCopies: (n: number) => void;
}) {
  const t = useT();
  const vm = buildWeaponViewModel(weapon, progress);
  const isInnate = weapon.kind === "innate";
  const [pendingUninstall, setPendingUninstall] = useState<string | null>(null);

  function onToggleVariant(variantId: string, install: boolean) {
    if (install) {
      onInstallVariant(variantId);
      return;
    }
    if (vm.variantsWithProgress.has(variantId)) {
      setPendingUninstall(variantId);
      return;
    }
    onUninstallVariant(variantId);
  }

  const hasInstallations = vm.evolutions.byInstallation.length > 0;
  const evolutionsTotal = hasInstallations ? vm.evolutions.totalTiers : weapon.evolutions.length;
  const evolutionsCompleted = hasInstallations ? vm.evolutions.completedTiers : 0;

  const pendingVariant = weapon.variants.find((v) => v.id === pendingUninstall);
  const pendingSummary = pendingUninstall
    ? vm.evolutions.byInstallation.find((s) => s.variantId === pendingUninstall)
    : undefined;

  return (
    <article className="angular-panel angular-panel--hover extreme-panel reflow-chain flex flex-col gap-4 p-5">
      <header className="weapon-card__header reflow-chain gap-2">
        <h2 className="weapon-card__name font-display text-base uppercase tracking-[0.12em] text-fg-strong">
          {weapon.name.en}
        </h2>
        <span className="wf-cut wf-cut-sm weapon-card__category px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-accent">
          {t.category[weapon.category]}
        </span>
      </header>

      <WeaponImage key={weapon.image?.localPath ?? "missing"} image={weapon.image} />

      <p className="wf-diamond text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-gold">
        {weapon.rotation
          ? `${t.incarnon.weekShort} ${weapon.rotation.week} (${weapon.rotation.letter})`
          : t.kind.innate}
      </p>

      <StatusBadge isCompleted={vm.isCompleted} hasIncompleteData={vm.hasIncompleteData} />
      <dl className="grid gap-2 text-[0.8125rem] tabular-nums text-fg sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold text-fg-muted">{t.incarnon.copies}: </dt>
          <dd className="inline">
            {vm.copies.owned} / {vm.copies.required}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-fg-muted">{t.incarnon.installed}: </dt>
          <dd className="inline">{vm.copies.installed}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-fg-muted">{t.incarnon.inInventory}: </dt>
          <dd className="inline">{vm.copies.inventory}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-fg-muted">{t.incarnon.toAcquire}: </dt>
          <dd className="inline">{vm.copies.missing}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="inline font-semibold text-fg-muted">{t.incarnon.colEvolutions}: </dt>
          <dd className="inline">
            {evolutionsCompleted} / {evolutionsTotal}
          </dd>
          {vm.copies.owned > vm.copies.required ? (
            <span className="ml-2 text-fg-muted">
              {t.incarnon.surplus
                .replace("{count}", String(vm.copies.owned - vm.copies.required))
                .replace(
                  "{copies}",
                  vm.copies.owned - vm.copies.required === 1
                    ? t.incarnon.copy
                    : t.incarnon.copiesPlural,
                )}
            </span>
          ) : null}
        </div>
      </dl>

      {!isInnate ? (
        <div className="reflow-chain border-y border-border-subtle py-3">
          <CopyStepper
            value={vm.copies.inventory}
            label={t.incarnon.uninstalledCopies}
            onIncrement={() => onSetUninstalledCopies(vm.copies.inventory + 1)}
            onDecrement={() => onSetUninstalledCopies(Math.max(0, vm.copies.inventory - 1))}
          />
        </div>
      ) : null}

      <div className="reflow-chain">
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">
          {isInnate ? t.incarnon.variant : t.incarnon.installedVariants}
        </p>
        <VariantChecklist
          variants={weapon.variants}
          installedVariantIds={vm.installedVariantIds}
          onToggle={onToggleVariant}
        />
      </div>

      <footer className="extreme-actions reflow-chain flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3 max-[420px]:items-stretch max-[420px]:[&>*]:w-full">
        <Link
          href={`/evoluciones#arma-${weapon.id}`}
          className="wf-cut reflow-text inline-flex min-h-11 items-center justify-center px-4 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-accent-strong"
        >
          {t.incarnon.viewEvolutions}
        </Link>
        <ExternalLink
          href={weapon.sourceUrl}
          label={t.incarnon.viewWiki}
          className="text-[0.75rem] font-semibold uppercase tracking-[0.1em]"
        />
      </footer>

      <ConfirmDialog
        open={pendingUninstall !== null}
        danger
        title={`${t.confirm.uninstallTitle} (${pendingVariant?.name.en ?? ""})`}
        description={
          pendingSummary ? (
            <p>
              {t.confirm.uninstallBody
                .replace("{completed}", String(pendingSummary.completedTiers))
                .replace("{total}", String(pendingSummary.totalTiers))}
            </p>
          ) : (
            <p>{t.confirm.uninstallBodyGeneric}</p>
          )
        }
        confirmLabel={t.confirm.uninstallConfirm}
        cancelLabel={t.confirm.cancel}
        onConfirm={() => {
          if (pendingUninstall) onUninstallVariant(pendingUninstall);
          setPendingUninstall(null);
        }}
        onCancel={() => setPendingUninstall(null)}
      />
    </article>
  );
}
