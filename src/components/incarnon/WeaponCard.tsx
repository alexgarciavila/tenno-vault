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

  // Pie "EVOLUCIONES · n/m": n = tiers completados en las instalaciones; m = total
  // de tiers de esas instalaciones. Cuando NO hay ninguna instalación, se muestra
  // el total de tiers del ARMA (weapon.evolutions.length) con n = 0, para reflejar
  // el objetivo del arma (p. ej. "0/5") en lugar de un "0/0" sin contexto.
  const hasInstallations = vm.evolutions.byInstallation.length > 0;
  const evolutionsTotal = hasInstallations
    ? vm.evolutions.totalTiers
    : weapon.evolutions.length;
  const evolutionsCompleted = hasInstallations ? vm.evolutions.completedTiers : 0;

  const pendingVariant = weapon.variants.find((v) => v.id === pendingUninstall);
  const pendingSummary = pendingUninstall
    ? vm.evolutions.byInstallation.find((s) => s.variantId === pendingUninstall)
    : undefined;

  return (
    <article className="angular-panel angular-panel--hover extreme-panel reflow-chain flex flex-col gap-4 p-5">
      <header className="weapon-card__header reflow-chain gap-2">
        <h2 className="weapon-card__name font-display text-base uppercase tracking-[0.12em] text-fg-strong">
          {weapon.name}
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

      <StatusBadge status={vm.status.status} hasIncompleteData={vm.status.hasIncompleteData} />

      <p className="reflow-text flex flex-wrap gap-x-1 text-[0.8125rem] tabular-nums text-fg">
        {vm.copies.installed} {t.incarnon.summaryInstalled} · {vm.copies.uninstalled}{" "}
        {t.incarnon.summaryAvailable} · {vm.copies.missing} {t.incarnon.summaryPending}
        {vm.copies.extra > 0 ? (
          <span className="text-fg-muted">
            {" · "}
            {vm.copies.extra}{" "}
            {vm.copies.extra === 1 ? t.incarnon.extraCopies : t.incarnon.extraCopiesPlural}
          </span>
        ) : null}
      </p>

      {!isInnate ? (
        <div className="reflow-chain border-y border-border-subtle py-3">
          <CopyStepper
            value={vm.copies.uninstalled}
            label={t.incarnon.uninstalledCopies}
            onIncrement={() => onSetUninstalledCopies(vm.copies.uninstalled + 1)}
            onDecrement={() => onSetUninstalledCopies(Math.max(0, vm.copies.uninstalled - 1))}
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

      <div className="reflow-chain mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-3 text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">
        <span className="reflow-text tabular-nums text-fg-muted">
          {t.incarnon.colEvolutions} · {evolutionsCompleted}/{evolutionsTotal}
        </span>
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
        title={`${t.confirm.uninstallTitle} (${pendingVariant?.name ?? ""})`}
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
