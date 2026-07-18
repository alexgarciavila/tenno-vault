"use client";

/**
 * Controles de filtro (estado, categoría, tipo, semana). Mismo componente para
 * la presentación inline (escritorio) y dentro de la hoja modal (móvil): mismo
 * estado, distinta presentación. El filtro de semana se deshabilita con nota
 * cuando solo se pide el tipo "innata" (rotation siempre null ahí).
 */
import type { WeaponCategory, WeaponKind } from "../../data/catalog-schema";
import { useT } from "../../lib/i18n";
import type { IncarnonStatus } from "../../lib/inventory";
import { ToggleChip } from "../ui/ToggleChip";
import type { FilterState } from "./filters";

const STATUSES: IncarnonStatus[] = [
  "not-owned",
  "available",
  "partially-installed",
  "covered",
  "completed",
];
const CATEGORIES: WeaponCategory[] = ["primary", "secondary", "melee"];
const KINDS: WeaponKind[] = ["genesis", "innate"];
const WEEKS = [
  { value: 1, letter: "A" },
  { value: 2, letter: "B" },
  { value: 3, letter: "C" },
  { value: 4, letter: "D" },
  { value: 5, letter: "E" },
  { value: 6, letter: "F" },
  { value: 7, letter: "G" },
  { value: 8, letter: "H" },
  { value: 9, letter: "I" },
] as const;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function FilterControls({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  const t = useT();
  const weekDisabled = filters.kinds.length === 1 && filters.kinds[0] === "innate";

  return (
    <div className="reflow-chain grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-4">
      <fieldset className="reflow-chain">
        <legend className="wf-section-label reflow-text mb-3">{t.incarnon.filterStatus}</legend>
        <div className="reflow-chain flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <ToggleChip
              key={status}
              label={t.status[status]}
              checked={filters.statuses.includes(status)}
              onChange={() => onChange({ statuses: toggle(filters.statuses, status) })}
            />
          ))}
          <ToggleChip
            label={t.status.incompleteData}
            checked={filters.incompleteData}
            onChange={(checked) => onChange({ incompleteData: checked })}
          />
        </div>
      </fieldset>

      <fieldset className="reflow-chain">
        <legend className="wf-section-label reflow-text mb-3">{t.incarnon.filterCategory}</legend>
        <div className="reflow-chain flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <ToggleChip
              key={category}
              label={t.category[category]}
              checked={filters.categories.includes(category)}
              onChange={() => onChange({ categories: toggle(filters.categories, category) })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="reflow-chain">
        <legend className="wf-section-label reflow-text mb-3">{t.incarnon.filterKind}</legend>
        <div className="reflow-chain flex flex-wrap gap-2">
          {KINDS.map((kind) => (
            <ToggleChip
              key={kind}
              label={t.kind[kind]}
              checked={filters.kinds.includes(kind)}
              onChange={() => onChange({ kinds: toggle(filters.kinds, kind) })}
            />
          ))}
        </div>
      </fieldset>

      <div className="reflow-chain">
        <label htmlFor="filtro-semana" className="wf-section-label mb-3">
          {t.incarnon.filterWeek}
        </label>
        <select
          id="filtro-semana"
          value={filters.week ?? ""}
          disabled={weekDisabled}
          onChange={(event) =>
            onChange({ week: event.target.value === "" ? null : Number(event.target.value) })
          }
          className="max-w-full min-h-11 rounded-sm border border-[rgb(111_217_231/0.25)] bg-[#081016] px-4 font-semibold uppercase tracking-[0.08em] text-fg hover:border-accent disabled:cursor-not-allowed disabled:text-fg-subtle"
        >
          <option value="">—</option>
          {WEEKS.map((week) => (
            <option key={week.value} value={week.value}>
              {t.incarnon.weekShort} {week.value} ({week.letter})
            </option>
          ))}
        </select>
        {weekDisabled ? (
          <p className="reflow-text mt-1 text-[0.8125rem] text-fg-muted">
            {t.incarnon.weekNotApplicable}
          </p>
        ) : null}
      </div>
    </div>
  );
}
