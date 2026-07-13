"use client";

/**
 * Conmutador de vista tarjetas ⇄ tabla. Refleja y actualiza `settings.view`
 * (persistido). Es el MISMO control reutilizado en Incarnon y en Configuración.
 * Envuelve `SegmentedControl`.
 */
import { useT } from "../../lib/i18n";
import { SegmentedControl } from "./SegmentedControl";

export type ViewMode = "cards" | "table";

export function ViewSwitch({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  const t = useT();
  return (
    <SegmentedControl<ViewMode>
      label={t.incarnon.view}
      value={value}
      onChange={onChange}
      options={[
        { value: "cards", label: t.incarnon.viewCards },
        { value: "table", label: t.incarnon.viewTable },
      ]}
    />
  );
}
