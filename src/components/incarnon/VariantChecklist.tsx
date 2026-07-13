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
    <ul className="flex flex-col gap-0.5">
      {variants.map((variant) => {
        const isInstalled = installed.has(variant.id);
        return (
          <li key={variant.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-alt">
              <input
                type="checkbox"
                checked={isInstalled}
                onChange={(event) => onToggle(variant.id, event.target.checked)}
                className="size-5 shrink-0 accent-[#38bdf8]"
              />
              <span className="text-fg">{variant.name}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
