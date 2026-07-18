"use client";

/**
 * Vista tabla responsive de Incarnon con patrón "stacked table". TODA la
 * información de cada fila se muestra SIEMPRE, en cualquier ancho: nunca se
 * ocultan columnas ni se genera scroll horizontal en uso normal — el contenido
 * refluye hacia abajo.
 *
 * - Desde `xl` (≥1280px, ancho seguro para las columnas descontando la
 *   sidebar de escritorio): tabla clásica con todas las columnas en línea.
 * - Por debajo de `xl`: cada fila se convierte en una mini-ficha apilada
 *   (grid de pares etiqueta+valor) con el nombre del arma como cabecera. El
 *   `<thead>` se oculta (no alinea con nada) y cada celda muestra su propia
 *   etiqueta (reutiliza los literales i18n de las cabeceras).
 *
 * Accesibilidad: al cambiar `display` de los elementos de tabla algunos
 * navegadores pierden las semánticas implícitas, así que se declaran `role`
 * explícitos (`table`/`rowgroup`/`row`/`columnheader`/`rowheader`/`cell`). Los
 * targets del stepper se mantienen ≥44px y su envoltorio `w-32 shrink-0`
 * (en modo apilado sobra ancho, el container query no se dispara).
 *
 * Cada fila muestra las mismas cifras que la tarjeta (mismo view-model).
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
  const th =
    "px-3 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-accent";
  // Celda de datos: bloque con etiqueta+valor en modo apilado; table-cell en xl.
  const td = "block xl:table-cell xl:px-3 xl:py-2 xl:align-top";
  // Etiqueta del campo, visible solo en modo apilado (<xl).
  const label =
    "mb-0.5 block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-accent xl:hidden";

  return (
    <div className="space-y-2">
      <div
        role="region"
        aria-label={t.incarnon.tableRegionLabel}
        className="min-w-0 rounded-sm border border-border bg-surface"
      >
        <table role="table" className="block w-full border-collapse text-[0.8125rem] xl:table">
          <thead role="rowgroup" className="hidden bg-surface-alt xl:table-header-group">
            <tr role="row">
              <th scope="col" role="columnheader" className={th}>
                {t.incarnon.colName}
              </th>
              <th scope="col" role="columnheader" className={th}>
                {t.incarnon.colCategory}
              </th>
              <th scope="col" role="columnheader" className={th}>
                {t.incarnon.colWeek}
              </th>
              <th scope="col" role="columnheader" className={th}>
                {t.incarnon.colCopies}
              </th>
              <th scope="col" role="columnheader" className={th}>
                {t.incarnon.colEvolutions}
              </th>
              <th scope="col" role="columnheader" className={th}>
                {t.incarnon.colActions}
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="block xl:table-row-group">
            {weapons.map((weapon) => {
              const progress = progressRecord[weapon.id];
              const vm = buildWeaponViewModel(weapon, progress);
              const isInnate = weapon.kind === "innate";
              const evolutionsTotal =
                vm.evolutions.byInstallation.length > 0
                  ? vm.evolutions.totalTiers
                  : weapon.evolutions.length;
              return (
                <tr
                  key={weapon.id}
                  role="row"
                  className="mb-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-sm border border-border-subtle bg-surface p-3 hover:bg-surface-alt xl:mb-0 xl:table-row xl:rounded-none xl:border-0 xl:border-t xl:p-0"
                >
                  <th
                    scope="row"
                    role="rowheader"
                    className={`${td} col-span-2 border-b border-border-subtle pb-2 font-display text-sm uppercase tracking-[0.08em] text-fg-strong xl:col-span-1 xl:border-0 xl:pb-0`}
                  >
                    {weapon.name.en}
                    <StatusBadge
                      isCompleted={vm.isCompleted}
                      hasIncompleteData={vm.hasIncompleteData}
                    />
                  </th>
                  <td
                    role="cell"
                    className={`${td} text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-fg-muted`}
                  >
                    <span className={label}>{t.incarnon.colCategory}</span>
                    {t.category[weapon.category]}
                  </td>
                  <td role="cell" className={`${td} tabular-nums text-fg-muted`}>
                    <span className={label}>{t.incarnon.colWeek}</span>
                    {weapon.rotation ? `${weapon.rotation.week} (${weapon.rotation.letter})` : "—"}
                  </td>
                  <td role="cell" className={`${td} tabular-nums text-fg`}>
                    <span className={label}>{t.incarnon.colCopies}</span>
                    <div className="xl:hidden">
                      <p>
                        {t.incarnon.copies}: {vm.copies.owned} / {vm.copies.required}
                      </p>
                      <p>
                        {t.incarnon.installed}: {vm.copies.installed}
                      </p>
                      <p>
                        {t.incarnon.inInventory}: {vm.copies.inventory}
                      </p>
                      <p>
                        {t.incarnon.toAcquire}: {vm.copies.missing}
                      </p>
                    </div>
                    <div className="hidden xl:block">
                      <p>
                        {t.incarnon.copies}: {vm.copies.owned} / {vm.copies.required}
                      </p>
                      <p className="mt-1 text-fg-muted">
                        {(vm.copies.installed === 1
                          ? t.incarnon.compactCopiesSingular
                          : t.incarnon.compactCopies
                        )
                          .replace("{installed}", String(vm.copies.installed))
                          .replace("{inventory}", String(vm.copies.inventory))
                          .replace("{missing}", String(vm.copies.missing))}
                      </p>
                    </div>
                    {vm.copies.owned > vm.copies.required ? (
                      <p className="text-fg-muted">
                        {t.incarnon.surplus
                          .replace("{count}", String(vm.copies.owned - vm.copies.required))
                          .replace(
                            "{copies}",
                            vm.copies.owned - vm.copies.required === 1
                              ? t.incarnon.copy
                              : t.incarnon.copiesPlural,
                          )}
                      </p>
                    ) : null}
                  </td>
                  <td role="cell" className={td}>
                    <span className={label}>{t.incarnon.colEvolutions}</span>
                    <ProgressMiniBar
                      completed={vm.evolutions.completedTiers}
                      total={evolutionsTotal}
                    />
                  </td>
                  <td role="cell" className={`${td} col-span-2 xl:col-span-1`}>
                    <span className={label}>{t.incarnon.colActions}</span>
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
                      {!isInnate ? (
                        // Ancho explícito obligatorio: `.copy-stepper` usa
                        // `container-type: inline-size` (globals.css), que implica
                        // `contain: inline-size` y hace que su ancho intrínseco se
                        // compute como 0. w-32 (8rem = 128px = 2 botones 44px + 2
                        // gaps 8px + valor 24px) le da el ancho que el containment
                        // impide inferir, evitando el container query de 127px.
                        <div className="w-32 shrink-0">
                          <CopyStepper
                            value={vm.copies.inventory}
                            nowrap
                            onIncrement={() =>
                              onSetUninstalledCopies(weapon.id, vm.copies.inventory + 1)
                            }
                            onDecrement={() =>
                              onSetUninstalledCopies(
                                weapon.id,
                                Math.max(0, vm.copies.inventory - 1),
                              )
                            }
                          />
                        </div>
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
