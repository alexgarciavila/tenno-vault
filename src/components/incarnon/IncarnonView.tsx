"use client";

/**
 * Pantalla Incarnon. Orquesta buscador (debounce), filtros
 * (inline en escritorio / hoja modal en móvil), toggles, conmutador de vista
 * (persistido en settings) y el render en tarjetas o tabla. Client component con
 * guardia de hidratación: hasta montar en cliente muestra un skeleton para no
 * provocar mismatch al leer los stores persistidos.
 */
import { useEffect, useMemo, useState } from "react";
import { getCatalog } from "../../data/catalog";
import { useT } from "../../lib/i18n";
import { useHydrated } from "../../lib/use-hydrated";
import { useProgressStore } from "../../store/progress-store";
import { useSettingsStore } from "../../store/settings-store";
import { CatalogDateNote } from "../ui/CatalogDateNote";
import { EmptyState } from "../ui/EmptyState";
import { SearchInput } from "../ui/SearchInput";
import { Sheet } from "../ui/Sheet";
import { ToggleChip } from "../ui/ToggleChip";
import { ViewSwitch } from "../ui/ViewSwitch";
import { EditorialPageHeader } from "../ui/EditorialPageHeader";
import { FilterControls } from "./FilterControls";
import { EMPTY_FILTERS, countActiveFilters, filterWeapons } from "./filters";
import { WeaponCard } from "./WeaponCard";
import { WeaponTable } from "./WeaponTable";

export function IncarnonView() {
  const t = useT();
  const hydrated = useHydrated();
  const catalog = getCatalog();

  const view = useSettingsStore((state) => state.view);
  const setView = useSettingsStore((state) => state.setView);

  const progress = useProgressStore((state) => state.progress);
  const setUninstalledCopies = useProgressStore((state) => state.setUninstalledCopies);
  const installVariant = useProgressStore((state) => state.installVariant);
  const uninstallVariant = useProgressStore((state) => state.uninstallVariant);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Deep-link "Ver pendientes" desde Inicio: ?pendientes=1 preactiva el toggle.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pendientes") === "1") {
      setFilters((prev) => ({ ...prev, onlyPending: true }));
    }
  }, []);

  const patch = (next: Partial<typeof filters>) => setFilters((prev) => ({ ...prev, ...next }));

  const filtered = useMemo(
    () => filterWeapons(catalog.weapons, progress, filters),
    [catalog.weapons, progress, filters],
  );

  const activeCount = countActiveFilters(filters);

  if (!hydrated) {
    return (
      <div className="space-y-5">
        <EditorialPageHeader title={t.incarnon.title} subtitle={t.incarnon.subtitle} />
        <p aria-live="polite" className="text-fg-muted">
          {t.app.loading}
        </p>
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
          <div className="angular-panel h-52" />
          <div className="angular-panel h-52" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditorialPageHeader title={t.incarnon.title} subtitle={t.incarnon.subtitle} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-64">
            {/* SearchInput controla su propio debounce internamente. */}
            <SearchInput
              value={filters.search}
              label={t.incarnon.searchLabel}
              placeholder={t.incarnon.searchPlaceholder}
              onChange={(search) => patch({ search })}
            />
          </div>
          <ViewSwitch value={view} onChange={setView} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToggleChip
            label={t.incarnon.onlyPending}
            checked={filters.onlyPending}
            onChange={(checked) => patch({ onlyPending: checked })}
          />
          <ToggleChip
            label={t.incarnon.onlyIncompleteEvolutions}
            checked={filters.onlyIncompleteEvolutions}
            onChange={(checked) => patch({ onlyIncompleteEvolutions: checked })}
          />
          {/* Botón de filtros: abre la hoja modal en móvil. */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="wf-cut inline-flex min-h-11 items-center gap-2 px-4 text-[0.8125rem] font-semibold uppercase tracking-[0.09em] text-fg-muted hover:text-fg md:hidden"
          >
            {t.incarnon.filters}
            {activeCount > 0 ? (
              <span className="rounded-full bg-accent px-1.5 text-[0.75rem] text-bg tabular-nums">
                {activeCount}
              </span>
            ) : null}
          </button>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="min-h-11 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-accent hover:underline"
            >
              {t.incarnon.clearFilters}
            </button>
          ) : null}
        </div>

        {/* Filtros inline en escritorio. */}
        <div className="angular-panel hidden p-5 md:block">
          <FilterControls filters={filters} onChange={patch} />
        </div>
      </div>

      <CatalogDateNote generatedAt={catalog.generatedAt} />

      {filtered.length === 0 ? (
        <EmptyState
          title={t.incarnon.emptyTitle}
          description={t.incarnon.emptyBody}
          ctaLabel={t.incarnon.clearFilters}
          onCta={() => setFilters(EMPTY_FILTERS)}
        />
      ) : view === "table" ? (
        <WeaponTable
          weapons={filtered}
          progressRecord={progress}
          onSetUninstalledCopies={setUninstalledCopies}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19.5rem),1fr))] gap-4 lg:gap-5">
          {filtered.map((weapon) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              progress={progress[weapon.id]}
              onInstallVariant={(variantId) => installVariant(weapon.id, variantId)}
              onUninstallVariant={(variantId) => uninstallVariant(weapon.id, variantId)}
              onSetUninstalledCopies={(n) => setUninstalledCopies(weapon.id, n)}
            />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} title={t.incarnon.filters} onClose={() => setSheetOpen(false)}>
        <FilterControls filters={filters} onChange={patch} />
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-4 min-h-11 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-accent hover:underline"
          >
            {t.incarnon.clearFilters}
          </button>
        ) : null}
      </Sheet>
    </div>
  );
}
