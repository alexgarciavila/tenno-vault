import { beforeEach, describe, expect, it } from "vitest";
import { migrateSettings, useSettingsStore } from "../settings-store";

function state() {
  return useSettingsStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ language: "es", view: "cards" });
});

describe("settings-store", () => {
  it("usa los defaults es/cards", () => {
    expect(state().language).toBe("es");
    expect(state().view).toBe("cards");
  });

  it("setLanguage y setView actualizan y persisten en localStorage", () => {
    state().setLanguage("en");
    state().setView("table");

    expect(state().language).toBe("en");
    expect(state().view).toBe("table");

    const persisted = JSON.parse(localStorage.getItem("tenno-vault-settings") ?? "{}");
    expect(persisted.state.language).toBe("en");
    expect(persisted.state.view).toBe("table");
  });
});

describe("migrateSettings (v0 → v1)", () => {
  it("preserva los ajustes persistidos", () => {
    expect(migrateSettings({ language: "en", view: "table" }, 0)).toEqual({
      language: "en",
      view: "table",
    });
  });

  it("no rompe ante estado ausente", () => {
    expect(migrateSettings(undefined, 0)).toEqual({});
  });
});
