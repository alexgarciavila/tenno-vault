import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../../../lib/i18n";
import { useProgressStore } from "../../../store/progress-store";
import { useSettingsStore } from "../../../store/settings-store";
import { IncarnonView } from "../IncarnonView";

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ language: "es", view: "cards" });
  useProgressStore.setState({ progress: {} });
});

describe("IncarnonView — filtros móviles", () => {
  it("abre controles operables en un diálogo y devuelve el foco al cerrarlo", async () => {
    render(
      <I18nProvider>
        <IncarnonView />
      </I18nProvider>,
    );

    const trigger = await screen.findByRole("button", { name: "Filtros" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(within(dialog).getByRole("combobox", { name: "Semana de rotación" })).toBeDefined();

    const inventoryToggle = within(dialog).getByRole("button", { name: "En inventario" });
    fireEvent.click(inventoryToggle);
    expect(inventoryToggle.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(dialog.isConnected).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
