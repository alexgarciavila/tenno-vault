"use client";

/**
 * Vista tabla compacta de Incarnon. Contenedor con scroll
 * horizontal accesible (`role="region"`, `aria-label`, `tabindex=0`) para no
 * recortar columnas en móvil: la vista "tabla" es una preferencia global
 * persistida, no solo de escritorio. Cada fila muestra las mismas cifras que la
 * tarjeta (mismo view-model) y un stepper compacto de copias.
 */
import type { IncarnonWeapon } from "../../data/catalog-schema";
import { useT } from "../../lib/i18n";
import type { ProgressRecord } from "../../lib/user-types";
import { CopyStepper } from "../ui/CopyStepper";
import { ExternalLink } from "../ui/ExternalLink";
import { ProgressMiniBar } from "../ui/ProgressMiniBar";
import { StatusBadge } from "../ui/StatusBadge";
import { buildWeaponViewModel } from "./weapon-view-model";

export function WeaponTable({
  weapons,
  progressRecord,
  onSetUninstalledCopies,
}: {
  weapons: IncarnonWeapon[];
  progressRecord: ProgressRecord;
  onSetUninstalledCopies: (weaponId: string, n: number) => void;
}) {
  const t = useT();
  const th = "px-3 py-2 text-left font-medium text-fg-muted whitespace-nowrap";
  const td = "px-3 py-2 align-middle whitespace-nowrap";

  return (
    <div className="space-y-2">
      <p className="text-[0.8125rem] text-fg-muted lg:sr-only">{t.incarnon.tableScrollHint}</p>
      <div
        role="region"
        aria-label={t.incarnon.tableRegionLabel}
        tabIndex={0}
        className="overflow-x-auto rounded-sm border border-border bg-surface shadow-[inset_-18px_0_18px_-22px_var(--color-accent)]"
      >
        <table className="min-w-[57.5rem] w-full border-collapse text-[0.8125rem]">
          <thead className="bg-surface-alt">
            <tr>
              <th scope="col" className={th}>
                {t.incarnon.colName}
              </th>
              <th scope="col" className={th}>
                {t.incarnon.colCategory}
              </th>
              <th scope="col" className={th}>
                {t.incarnon.colWeek}
              </th>
              <th scope="col" className={th}>
                {t.incarnon.colStatus}
              </th>
              <th scope="col" className={th}>
                {t.incarnon.colCopies}
              </th>
              <th scope="col" className={th}>
                {t.incarnon.colEvolutions}
              </th>
              <th scope="col" className={th}>
                {t.incarnon.colActions}
              </th>
            </tr>
          </thead>
          <tbody>
            {weapons.map((weapon) => {
              const progress = progressRecord[weapon.id];
              const vm = buildWeaponViewModel(weapon, progress);
              const isInnate = weapon.kind === "innate";
              return (
                <tr
                  key={weapon.id}
                  className="border-t border-border-subtle bg-surface hover:bg-surface-alt"
                >
                  <th scope="row" className={`${td} font-medium text-fg`}>
                    {weapon.name}
                  </th>
                  <td className={`${td} text-fg-muted`}>{t.category[weapon.category]}</td>
                  <td className={`${td} tabular-nums text-fg-muted`}>
                    {weapon.rotation ? `${weapon.rotation.week} · ${weapon.rotation.letter}` : "—"}
                  </td>
                  <td className={td}>
                    <StatusBadge
                      status={vm.status.status}
                      hasIncompleteData={vm.status.hasIncompleteData}
                    />
                  </td>
                  <td className={`${td} tabular-nums text-fg`}>
                    {vm.copies.installed} / {vm.copies.uninstalled} / {vm.copies.missing}
                  </td>
                  <td className={td}>
                    <ProgressMiniBar
                      completed={vm.evolutions.completedTiers}
                      total={vm.evolutions.totalTiers}
                    />
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      {!isInnate ? (
                        <CopyStepper
                          value={vm.copies.uninstalled}
                          onIncrement={() =>
                            onSetUninstalledCopies(weapon.id, vm.copies.uninstalled + 1)
                          }
                          onDecrement={() =>
                            onSetUninstalledCopies(
                              weapon.id,
                              Math.max(0, vm.copies.uninstalled - 1),
                            )
                          }
                        />
                      ) : null}
                      <ExternalLink href={weapon.sourceUrl} label={t.incarnon.viewWiki} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
