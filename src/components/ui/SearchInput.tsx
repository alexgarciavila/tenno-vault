/**
 * Campo de búsqueda con label visible y debounce interno. El
 * estado local se refleja al instante en el input; el valor debounced se propaga
 * al padre para no filtrar en cada pulsación.
 */
import { useEffect, useId, useState } from "react";
import { IconSearch } from "../icons";

export function SearchInput({
  value,
  label,
  placeholder,
  debounceMs = 200,
  onChange,
}: {
  value: string;
  label: string;
  placeholder?: string;
  debounceMs?: number;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [local, setLocal] = useState(value);

  // Mantener sincronía si el valor cambia desde fuera (p. ej. "quitar filtros").
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const handle = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-fg-muted"
      >
        {label}
      </label>
      <div className="wf-frame relative flex min-h-12 items-center">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <input
          id={id}
          type="search"
          value={local}
          placeholder={placeholder}
          onChange={(event) => setLocal(event.target.value)}
          className="min-h-12 w-full bg-transparent pl-11 pr-4 text-[1rem] font-semibold uppercase tracking-[0.09em] text-fg-strong placeholder:uppercase placeholder:text-fg-subtle"
        />
      </div>
    </div>
  );
}
