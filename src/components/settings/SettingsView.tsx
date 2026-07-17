"use client";

/**
 * Pantalla Configuración. Idioma (aplica al vuelo vía i18n), vista
 * por defecto, copia de seguridad FUNCIONAL (exportar JSON, importar con
 * validación Zod + vista previa del diff + confirmación explícita) y zona de
 * peligro con reset reforzado (`requireCheckbox`). Guardia de hidratación para
 * leer los stores persistidos.
 *
 * La importación REEMPLAZA el progreso y además aplica los ajustes del
 * backup; cancelar no toca nada. El diff es informativo (ver `diffBackup`).
 */
import { useState } from "react";
import { getCatalog } from "../../data/catalog";
import {
  backupFileName,
  createBackup,
  diffBackup,
  parseBackup,
  serializeBackup,
  type Backup,
  type BackupDiff,
  type BackupErrorReason,
} from "../../lib/backup";
import { useT } from "../../lib/i18n";
import { useHydrated } from "../../lib/use-hydrated";
import { useProgressStore } from "../../store/progress-store";
import { useSettingsStore } from "../../store/settings-store";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { FileImportControl } from "../ui/FileImportControl";
import { ImportPreviewDialog } from "../ui/ImportPreviewDialog";
import { InlineAlert } from "../ui/InlineAlert";
import { SegmentedControl } from "../ui/SegmentedControl";
import { ViewSwitch } from "../ui/ViewSwitch";
import { EditorialPageHeader } from "../ui/EditorialPageHeader";

export function SettingsView() {
  const t = useT();
  const hydrated = useHydrated();

  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const view = useSettingsStore((state) => state.view);
  const setView = useSettingsStore((state) => state.setView);

  const progress = useProgressStore((state) => state.progress);
  const importProgress = useProgressStore((state) => state.importProgress);
  const resetAll = useProgressStore((state) => state.resetAll);

  const [resetOpen, setResetOpen] = useState(false);
  const [importError, setImportError] = useState<BackupErrorReason | null>(null);
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);
  const [pendingDiff, setPendingDiff] = useState<BackupDiff | null>(null);

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <EditorialPageHeader title={t.settings.title} />
        <p className="text-fg-muted">{t.app.loading}</p>
      </div>
    );
  }

  const importErrorMessage = (reason: BackupErrorReason): string => {
    switch (reason) {
      case "invalid-json":
        return t.settings.importErrorInvalidJson;
      case "unsupported-version":
        return t.settings.importErrorUnsupportedVersion;
      case "invalid-schema":
      default:
        return t.settings.importErrorInvalidSchema;
    }
  };

  function handleExport() {
    const backup = createBackup(progress, { language, view });
    const blob = new Blob([serializeBackup(backup)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = backupFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFileSelected(file: File) {
    setImportError(null);
    const raw = await file.text();
    const result = parseBackup(raw);
    if (!result.ok) {
      setImportError(result.reason);
      return;
    }
    const diff = diffBackup(progress, result.backup.progress, getCatalog());
    setPendingBackup(result.backup);
    setPendingDiff(diff);
  }

  function confirmImport() {
    if (!pendingBackup) return;
    importProgress(pendingBackup.progress);
    setLanguage(pendingBackup.settings.language);
    setView(pendingBackup.settings.view);
    setPendingBackup(null);
    setPendingDiff(null);
  }

  function cancelImport() {
    setPendingBackup(null);
    setPendingDiff(null);
  }

  return (
    <div className="space-y-8">
      <EditorialPageHeader title={t.settings.title} />

      <section aria-labelledby="cfg-idioma" className="angular-panel space-y-3 p-5">
        <h2 id="cfg-idioma" className="text-xl font-semibold text-fg">
          {t.settings.languageSection}
        </h2>
        <SegmentedControl
          label={t.settings.languageSection}
          value={language}
          onChange={setLanguage}
          options={[
            { value: "es", label: t.settings.languageEs },
            { value: "en", label: t.settings.languageEn },
          ]}
        />
      </section>

      <section aria-labelledby="cfg-vista" className="angular-panel space-y-3 p-5">
        <h2 id="cfg-vista" className="text-xl font-semibold text-fg">
          {t.settings.viewSection}
        </h2>
        <ViewSwitch value={view} onChange={setView} />
      </section>

      <section aria-labelledby="cfg-backup" className="angular-panel space-y-5 p-5">
        <h2 id="cfg-backup" className="text-xl font-semibold text-fg">
          {t.settings.backupSection}
        </h2>

        <div className="space-y-1">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-11 rounded-sm border border-border bg-surface-alt px-4 font-medium text-fg hover:border-accent hover:bg-surface-elevated"
          >
            {t.settings.export}
          </button>
          <p className="text-[0.8125rem] text-fg-muted">{t.settings.exportHint}</p>
        </div>

        <div className="space-y-1">
          <FileImportControl
            label={t.settings.import}
            buttonLabel={t.settings.import}
            onFileSelected={handleFileSelected}
          />
          <p className="text-[0.8125rem] text-fg-muted">{t.settings.importHint}</p>
        </div>

        {importError ? (
          <InlineAlert variant="error" message={importErrorMessage(importError)} />
        ) : null}
      </section>

      <section
        aria-labelledby="cfg-peligro"
        className="space-y-3 rounded-sm border border-danger-fg bg-danger-bg/25 p-5"
      >
        <h2 id="cfg-peligro" className="text-xl font-semibold text-danger-fg">
          {t.settings.dangerSection}
        </h2>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="min-h-11 rounded-lg bg-danger-bg px-4 font-medium text-danger-fg hover:brightness-125"
        >
          {t.settings.reset}
        </button>
      </section>

      <ImportPreviewDialog
        open={pendingBackup !== null}
        diff={pendingDiff}
        onConfirm={confirmImport}
        onCancel={cancelImport}
      />

      <ConfirmDialog
        open={resetOpen}
        danger
        requireCheckbox
        checkboxLabel={t.settings.resetCheckbox}
        title={t.settings.resetTitle}
        description={<p>{t.settings.resetBody}</p>}
        confirmLabel={t.settings.resetConfirm}
        cancelLabel={t.settings.cancel}
        onConfirm={() => {
          resetAll();
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
