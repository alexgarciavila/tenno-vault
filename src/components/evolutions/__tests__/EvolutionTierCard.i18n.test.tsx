import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvolutionTier } from "../../../data/catalog-schema";
import { I18nProvider } from "../../../lib/i18n";
import { useSettingsStore } from "../../../store/settings-store";
import { EvolutionTierCard } from "../EvolutionTierCard";

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ language: "es", view: "cards" });
});

describe("EvolutionTierCard — resolución localizada por campo", () => {
  it("combina ES y fallback EN sin propagar el idioma de un campo a los demás", async () => {
    const tier: EvolutionTier = {
      tier: 2,
      selectable: true,
      unlockCondition: { en: "English challenge", es: "Desafío español" },
      perks: [
        {
          id: "fixture-e2-perk",
          name: { en: "English perk", es: "Perk español" },
          description: { en: "English description" },
          notes: { en: "English note", es: "Nota española" },
          variantValues: {
            fixture: { kind: "localized", text: { en: "English mechanic value" } },
          },
        },
      ],
    };

    render(
      <I18nProvider>
        <EvolutionTierCard
          tier={tier}
          variantId="fixture"
          selectedPerkId={null}
          completed={false}
          onSelectPerk={vi.fn()}
          onToggleCompleted={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("Desafío español").hasAttribute("lang")).toBe(false);
    expect(screen.getByText("Perk español").hasAttribute("lang")).toBe(false);
    expect(screen.getByText("Nota española").hasAttribute("lang")).toBe(false);
    expect(screen.getByText("English description").getAttribute("lang")).toBe("en");
    expect(screen.getByText("English mechanic value").getAttribute("lang")).toBe("en");
    expect(screen.queryByText("English perk")).toBeNull();
    expect(screen.queryByText("English note")).toBeNull();

    useSettingsStore.getState().setLanguage("en");
    expect(await screen.findByText("English perk")).toBeDefined();
    expect(screen.getByText("English challenge")).toBeDefined();
    expect(screen.getByText("English note")).toBeDefined();
    expect(screen.queryByText("Perk español")).toBeNull();
  });
});
