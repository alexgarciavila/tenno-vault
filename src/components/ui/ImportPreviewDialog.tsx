"use client";

/**
 * Vista previa de importación. Extiende `ConfirmDialog`: muestra
 * el resumen del diff (armas añadidas / modificadas / eliminadas y, si las hay,
 * instalaciones huérfanas que se descartarán) antes de aplicar nada. Acción de
 * confirmación en estilo `danger` con foco inicial en "Cancelar" (heredado de
 * `ConfirmDialog`), porque la importación reemplaza todo el progreso actual.
 */
import type { BackupDiff } from "../../lib/backup";
import { useT } from "../../lib/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { InlineAlert } from "./InlineAlert";

export function ImportPreviewDialog({
  open,
  diff,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  diff: BackupDiff | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  if (!open || !diff) return null;

  const description = (
    <div className="space-y-3">
      <p>{t.settings.previewReplaceWarning}</p>
      <ul className="list-disc space-y-1 pl-5 text-fg">
        <li>
          <span className="font-semibold tabular-nums">{diff.added.length}</span>{" "}
          {t.settings.previewAdded}
        </li>
        <li>
          <span className="font-semibold tabular-nums">{diff.modified.length}</span>{" "}
          {t.settings.previewModified}
        </li>
        <li>
          <span className="font-semibold tabular-nums">{diff.removed.length}</span>{" "}
          {t.settings.previewRemoved}
        </li>
      </ul>
      {diff.orphanInstallations > 0 ? (
        <InlineAlert
          variant="warning"
          message={`${diff.orphanInstallations} ${t.settings.previewOrphans}`}
        />
      ) : null}
    </div>
  );

  return (
    <ConfirmDialog
      open={open}
      danger
      title={t.settings.previewTitle}
      description={description}
      confirmLabel={t.settings.previewConfirm}
      cancelLabel={t.settings.cancel}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
