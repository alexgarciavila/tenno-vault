"use client";

/**
 * Control de selección de archivo para importar una copia de seguridad.
 * Input `.json` con label accesible asociado. Tras seleccionar
 * un archivo se resetea el valor del input para que elegir el MISMO archivo de
 * nuevo vuelva a disparar `onFileSelected` (los inputs file no emiten `change`
 * si el valor no cambia).
 */
import { useId, useRef } from "react";

export function FileImportControl({
  label,
  buttonLabel,
  onFileSelected,
}: {
  label: string;
  buttonLabel: string;
  onFileSelected: (file: File) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="reflow-chain flex flex-col gap-1">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".json,application/json"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          // Permite reseleccionar el mismo archivo.
          event.target.value = "";
        }}
        className="reflow-text block w-full text-[0.8125rem] text-fg-muted file:mr-3 file:min-h-11 file:max-w-full file:cursor-pointer file:rounded-sm file:border file:border-border file:bg-surface-alt file:px-4 file:font-medium file:text-fg hover:file:border-accent"
      />
      <span className="sr-only">{buttonLabel}</span>
    </div>
  );
}
