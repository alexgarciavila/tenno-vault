// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { IncarnonCatalog, IncarnonWeapon } from "../../../src/data/catalog-schema";
import { decideDataStatus, formatValidationError, validateCatalog } from "../validate";

function minimalWeapon(overrides: Partial<IncarnonWeapon> = {}): IncarnonWeapon {
  return {
    id: "braton",
    name: "Braton Incarnon Genesis",
    weaponName: "Braton",
    kind: "genesis",
    category: "primary",
    rotation: { week: 1, letter: "A" },
    variants: [
      { id: "braton", name: "Braton", wikiUrl: "https://wiki.warframe.com/w/Braton" },
      { id: "mk1-braton", name: "Mk1-Braton", wikiUrl: "https://wiki.warframe.com/w/Mk1-Braton" },
      {
        id: "braton-vandal",
        name: "Braton Vandal",
        wikiUrl: "https://wiki.warframe.com/w/Braton_Vandal",
      },
      {
        id: "braton-prime",
        name: "Braton Prime",
        wikiUrl: "https://wiki.warframe.com/w/Braton_Prime",
      },
    ],
    evolutions: [
      {
        tier: 1,
        selectable: false,
        unlockCondition: null,
        perks: [{ id: "braton-e1-incarnon-form", name: "Incarnon Form", description: "…" }],
      },
      {
        tier: 2,
        selectable: true,
        unlockCondition: "Complete a solo mission with this weapon equipped.",
        perks: [
          {
            id: "braton-e2-daring-reverie",
            name: "Daring Reverie",
            description: "Increase Base Damage by +X.",
            variantValues: { braton: "X = 24 · Y = 30" },
          },
        ],
      },
      {
        tier: 3,
        selectable: true,
        unlockCondition: "Kill 100 enemies with this weapon's Incarnon Form.",
        perks: [{ id: "braton-e3-x", name: "X", description: "" }],
      },
      {
        tier: 4,
        selectable: true,
        unlockCondition: "Kill 30 enemies without reloading.",
        perks: [{ id: "braton-e4-y", name: "Y", description: "" }],
      },
    ],
    sourceUrl: "https://wiki.warframe.com/w/Braton_Incarnon_Genesis",
    scrapedAt: "2026-07-12T00:00:00.000Z",
    dataStatus: "complete",
    reviewNotes: [],
    ...overrides,
  };
}

function minimalCatalog(weapon: IncarnonWeapon = minimalWeapon()): IncarnonCatalog {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-12T00:00:00.000Z",
    attribution: {
      source: "Warframe Wiki",
      sourceUrl: "https://wiki.warframe.com/w/Incarnon",
      license: "CC BY-NC-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    },
    weapons: [weapon],
  };
}

describe("validateCatalog", () => {
  it("acepta un catálogo mínimo válido", () => {
    const result = validateCatalog(minimalCatalog());
    expect(result.success).toBe(true);
  });

  it("rechaza un tier fuera de rango (6)", () => {
    const weapon = minimalWeapon();
    const tier = weapon.evolutions[0];
    if (!tier) throw new Error("fixture roto");
    tier.tier = 6;
    const result = validateCatalog(minimalCatalog(weapon));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatValidationError(result.error)).toContain("tier");
    }
  });

  it("rechaza una categoría inválida", () => {
    const weapon = minimalWeapon({ category: "rifle" as IncarnonWeapon["category"] });
    const result = validateCatalog(minimalCatalog(weapon));
    expect(result.success).toBe(false);
  });

  it("rechaza un tier sin perks", () => {
    const weapon = minimalWeapon();
    const tier = weapon.evolutions[0];
    if (!tier) throw new Error("fixture roto");
    tier.perks = [];
    const result = validateCatalog(minimalCatalog(weapon));
    expect(result.success).toBe(false);
  });

  it("rechaza schemaVersion desconocida", () => {
    const catalog = { ...minimalCatalog(), schemaVersion: 2 };
    const result = validateCatalog(catalog);
    expect(result.success).toBe(false);
  });
});

describe("decideDataStatus", () => {
  it("complete cuando la estructura cuadra y no hay notas", () => {
    expect(decideDataStatus(minimalWeapon())).toBe("complete");
  });

  it("review-required cuando hay notas de revisión", () => {
    expect(decideDataStatus(minimalWeapon({ reviewNotes: ["algo raro"] }))).toBe("review-required");
  });

  it("review-required cuando el nº de tiers no cuadra con el kind", () => {
    const weapon = minimalWeapon();
    weapon.evolutions = weapon.evolutions.slice(0, 3);
    expect(decideDataStatus(weapon)).toBe("review-required");

    const innate = minimalWeapon({ kind: "innate" });
    expect(decideDataStatus(innate)).toBe("review-required"); // 4 tiers ≠ 5 esperados
  });

  it("review-required sin variantes", () => {
    expect(decideDataStatus(minimalWeapon({ variants: [] }))).toBe("review-required");
  });

  it("incomplete cuando un tier > 1 no tiene condición de desbloqueo", () => {
    const weapon = minimalWeapon();
    const tier = weapon.evolutions[1];
    if (!tier) throw new Error("fixture roto");
    tier.unlockCondition = null;
    expect(decideDataStatus(weapon)).toBe("incomplete");
  });
});
