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

  const pendingVariant = weapon.variants.find((v) => v.id === pendingUninstall);
  const pendingSummary = pendingUninstall
    ? vm.evolutions.byInstallation.find((s) => s.variantId === pendingUninstall)
    : undefined;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-fg">{weapon.name}</h3>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.75rem] text-fg-muted">
          {t.category[weapon.category]}
        </span>
      </header>

      <p className="text-[0.8125rem] text-fg-muted">
        {weapon.rotation
          ? `${t.incarnon.weekShort} ${weapon.rotation.week} · ${weapon.rotation.letter}`
          : t.kind.innate}
      </p>

      <StatusBadge status={vm.status.status} hasIncompleteData={vm.status.hasIncompleteData} />

      <p className="text-[0.8125rem] tabular-nums text-fg">
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
        <CopyStepper
          value={vm.copies.uninstalled}
          label={t.incarnon.uninstalledCopies}
          onIncrement={() => onSetUninstalledCopies(vm.copies.uninstalled + 1)}
          onDecrement={() => onSetUninstalledCopies(Math.max(0, vm.copies.uninstalled - 1))}
        />
      ) : null}

      <div>
        <p className="mb-1 text-[0.8125rem] font-medium text-fg-muted">
          {isInnate ? t.incarnon.variant : t.incarnon.installedVariants}
        </p>
        <VariantChecklist
          variants={weapon.variants}
          installedVariantIds={vm.installedVariantIds}
          onToggle={onToggleVariant}
        />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Link
          href={`/evoluciones#arma-${weapon.id}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-alt px-3 text-[0.8125rem] font-medium text-fg hover:border-accent"
        >
          {t.incarnon.viewEvolutions}
        </Link>
        <ExternalLink href={weapon.sourceUrl} label={t.incarnon.viewWiki} />
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
