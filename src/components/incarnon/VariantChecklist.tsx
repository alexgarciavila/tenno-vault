/**
 * Lista de variantes con checkbox para instalar/desinstalar.
 * Armas innatas: una única fila cuya etiqueta es el nombre del arma; se reutiliza
 * el mismo componente (modelo uniforme). Cada fila es un `<label>` con
 * checkbox real (accesible) y área táctil ≥44px.
 */
import type { WeaponVariant } from "../../data/catalog-schema";

export function VariantChecklist({
  variants,
  installedVariantIds,
  onToggle,
}: {
  variants: WeaponVariant[];
  installedVariantIds: string[];
  onToggle: (variantId: string, install: boolean) => void;
}) {
  const installed = new Set(installedVariantIds);
  return (
    <ul className="reflow-chain flex flex-col gap-0.5">
      {variants.map((variant) => {
        const isInstalled = installed.has(variant.id);
        return (
          <li key={variant.id} className="reflow-chain">
            <label className="reflow-chain extreme-perk-option flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-transparent px-2 hover:border-border hover:bg-surface-alt has-[:checked]:border-accent has-[:checked]:bg-accent-surface">
              <input
                type="checkbox"
                checked={isInstalled}
                onChange={(event) => onToggle(variant.id, event.target.checked)}
                className="size-5 shrink-0 accent-[#70dceb]"
              />
              <span className="reflow-text flex-1 text-fg">{variant.name}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
