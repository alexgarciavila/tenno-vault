import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createBackup, serializeBackup } from "../../../lib/backup";
import { I18nProvider } from "../../../lib/i18n";
import type { ProgressRecord } from "../../../lib/user-types";
import { useProgressStore } from "../../../store/progress-store";
import { useSettingsStore } from "../../../store/settings-store";
import { SettingsView } from "../SettingsView";

function renderSettings() {
  return render(
    <I18nProvider>
      <SettingsView />
    </I18nProvider>,
  );
}

/** Dispara la selección de un archivo en el input file de importación. */
function selectFile(container: HTMLElement, contents: string) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("No se encontró el input de archivo");
  const file = new File([contents], "backup.json", {
    type: "application/json",
  });
  fireEvent.change(input, { target: { files: [file] } });
}

const importedProgress: ProgressRecord = {
  braton: { weaponId: "braton", uninstalledCopies: 2, installations: [] },
};

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ language: "es", view: "cards" });
  useProgressStore.setState({ progress: {} });
});

describe("SettingsView — importación de backups", () => {
  it("muestra un error legible al seleccionar un archivo inválido", async () => {
    const { container } = renderSettings();
    await screen.findByRole("heading", { name: "Configuración" });

    selectFile(container, "{ no es json");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("El archivo no contiene un JSON válido.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("con un backup válido abre la vista previa con los conteos del diff", async () => {
    const { container } = renderSettings();
    await screen.findByRole("heading", { name: "Configuración" });

    const backup = createBackup(importedProgress, { language: "en", view: "table" });
    selectFile(container, serializeBackup(backup));

    const dialog = await screen.findByRole("dialog");
    // 1 arma nueva (braton) sobre progreso actual vacío.
    expect(within(dialog).getByText("1")).toBeDefined();
    expect(dialog.textContent).toContain("armas nuevas");
  });

  it("confirmar la importación reemplaza el progreso y aplica los ajustes del backup", async () => {
    const { container } = renderSettings();
    await screen.findByRole("heading", { name: "Configuración" });

    const backup = createBackup(importedProgress, { language: "en", view: "table" });
    selectFile(container, serializeBackup(backup));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Importar y sobrescribir" }));

    await waitFor(() => {
      expect(useProgressStore.getState().progress).toEqual(importedProgress);
    });
    expect(useSettingsStore.getState().language).toBe("en");
    expect(useSettingsStore.getState().view).toBe("table");
  });

  it("cancelar la importación no toca el progreso ni los ajustes", async () => {
    const { container } = renderSettings();
    await screen.findByRole("heading", { name: "Configuración" });

    const backup = createBackup(importedProgress, { language: "en", view: "table" });
    selectFile(container, serializeBackup(backup));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(useProgressStore.getState().progress).toEqual({});
    expect(useSettingsStore.getState().language).toBe("es");
  });
});

describe("SettingsView — cambio de idioma al vuelo", () => {
  it("cambiar a English re-renderiza los literales de la UI", async () => {
    renderSettings();
    // Estado inicial en español.
    await screen.findByRole("heading", { name: "Configuración" });

    fireEvent.click(screen.getByRole("radio", { name: "English" }));

    // La misma pantalla ahora en inglés (título traducido).
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Configuración" })).toBeNull();
  });
});
