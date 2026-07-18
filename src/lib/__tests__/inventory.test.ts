import { describe, expect, it } from "vitest";
import { getWeapon } from "../../data/catalog";
import type { IncarnonWeapon } from "../../data/catalog-schema";
import {
  computeGlobalSummary,
  computeInventorySummary,
  findOrphanInstallations,
} from "../inventory";
import type { IncarnonInstallation, UserIncarnonProgress } from "../user-types";

function weapon(id: string): IncarnonWeapon {
  return getWeapon(id)!;
}
function installation(
  item: IncarnonWeapon,
  variantId: string,
  completed: number[] = [],
): IncarnonInstallation {
  return {
    variantId,
    evolutionProgress: item.evolutions.map((tier) => ({
      tier: tier.tier,
      completed: completed.includes(tier.tier),
      selectedPerkId: null,
    })),
  };
}
function all(item: IncarnonWeapon) {
  return item.evolutions.map((tier) => tier.tier);
}

describe("computeInventorySummary", () => {
  it("deriva el caso canónico 4/2/1/1", () => {
    const braton = weapon("braton");
    const result = computeInventorySummary(braton, {
      weaponId: "braton",
      uninstalledCopies: 1,
      installations: [installation(braton, "braton"), installation(braton, "braton-prime")],
    });
    expect(result.copies).toEqual({
      required: 4,
      installed: 2,
      inventory: 1,
      owned: 3,
      missing: 1,
    });
    expect(result.evolutions).toMatchObject({ completedTiers: 0, totalTiers: 8 });
    expect(result.isCompleted).toBe(false);
  });

  it("no completa 0/0 y completa una única variante con todos sus tiers", () => {
    const braton = weapon("braton");
    const empty = { ...braton, variants: [] };
    expect(computeInventorySummary(empty).copies).toEqual({
      required: 0,
      installed: 0,
      inventory: 0,
      owned: 0,
      missing: 0,
    });
    expect(computeInventorySummary(empty).isCompleted).toBe(false);
    const phenmor = weapon("phenmor");
    expect(
      computeInventorySummary(phenmor, {
        weaponId: "phenmor",
        uninstalledCopies: 0,
        installations: [installation(phenmor, "phenmor", all(phenmor))],
      }).isCompleted,
    ).toBe(true);
  });

  it("conserva excedentes y no deja que bloqueen completado", () => {
    const lex = weapon("lex");
    const result = computeInventorySummary(lex, {
      weaponId: "lex",
      uninstalledCopies: 3,
      installations: [installation(lex, "lex", all(lex)), installation(lex, "lex-prime", all(lex))],
    });
    expect(result.copies).toMatchObject({ owned: 5, required: 2, missing: 0 });
    expect(result.isCompleted).toBe(true);
  });

  it("normaliza inventario inválido e ignora instalaciones duplicadas y huérfanas", () => {
    const braton = weapon("braton");
    const progress = {
      weaponId: "braton",
      uninstalledCopies: -2,
      installations: [
        installation(braton, "braton", all(braton)),
        installation(braton, "braton", []),
        installation(braton, "fantasma", all(braton)),
      ],
    } as unknown as UserIncarnonProgress;
    const result = computeInventorySummary(braton, progress);
    expect(result.copies).toEqual({
      required: 4,
      installed: 1,
      inventory: 0,
      owned: 1,
      missing: 3,
    });
    expect(result.evolutions).toMatchObject({ completedTiers: 4, totalTiers: 4 });
    expect(result.installedVariantIds).toEqual(["braton"]);
    expect(findOrphanInstallations(braton, progress)).toHaveLength(1);
  });

  it("cuenta solo tiers catalogados y no completa con datos parciales", () => {
    const phenmor = weapon("phenmor");
    const result = computeInventorySummary(phenmor, {
      weaponId: "phenmor",
      uninstalledCopies: 0,
      installations: [
        {
          variantId: "phenmor",
          evolutionProgress: [
            { tier: 1, completed: true, selectedPerkId: null },
            { tier: 1, completed: true, selectedPerkId: null },
          ],
        },
      ],
    });
    expect(result.evolutions).toMatchObject({ completedTiers: 1, totalTiers: 5 });
    expect(result.isCompleted).toBe(false);
  });
});

describe("computeGlobalSummary", () => {
  it("agrega exclusivamente los hechos del resumen", () => {
    const braton = weapon("braton");
    const summary = computeGlobalSummary([braton], {
      braton: { weaponId: "braton", uninstalledCopies: 1, installations: [] },
    });
    expect(summary).toMatchObject({
      weaponsWithCopies: 1,
      weaponsWithInstallations: 0,
      inventoryCopies: 1,
      missingCopies: 3,
      completedWeapons: 0,
    });
  });
});
