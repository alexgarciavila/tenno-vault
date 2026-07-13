import { beforeEach, describe, expect, it } from "vitest";
import { migrateProgress, useProgressStore } from "../progress-store";

function state() {
  return useProgressStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  useProgressStore.setState({ progress: {} });
});

describe("installVariant", () => {
  it("inicializa la instalación con los tiers reales del catálogo", () => {
    state().installVariant("braton", "braton-prime");

    const entry = state().progress["braton"];
    expect(entry).toBeDefined();
    expect(entry?.installations).toHaveLength(1);

    const evo = entry?.installations[0]?.evolutionProgress ?? [];
    expect(evo.map((e) => e.tier)).toEqual([1, 2, 3, 4]);
    expect(evo.every((e) => e.completed === false)).toBe(true);
    expect(evo.every((e) => e.selectedPerkId === null)).toBe(true);
  });

  it("es idempotente: instalar dos veces no duplica la instalación", () => {
    state().installVariant("braton", "braton-prime");
    state().installVariant("braton", "braton-prime");
    expect(state().progress["braton"]?.installations).toHaveLength(1);
  });

  it("ignora armas o variantes inexistentes en el catálogo", () => {
    state().installVariant("arma-fantasma", "x");
    state().installVariant("braton", "variante-fantasma");
    expect(state().progress).toEqual({});
  });
});

describe("selectPerk", () => {
  it("acepta un perk que pertenece al tier", () => {
    state().installVariant("braton", "braton-prime");
    state().selectPerk("braton", "braton-prime", 2, "braton-e2-daring-reverie");

    const evo = state().progress["braton"]?.installations[0]?.evolutionProgress;
    const tier2 = evo?.find((e) => e.tier === 2);
    expect(tier2?.selectedPerkId).toBe("braton-e2-daring-reverie");
  });

  it("rechaza un perk de otro tier", () => {
    state().installVariant("braton", "braton-prime");
    // Perk de tier 3 aplicado sobre el tier 2 → rechazado.
    state().selectPerk("braton", "braton-prime", 2, "braton-e3-mercenary-chamber");

    const evo = state().progress["braton"]?.installations[0]?.evolutionProgress;
    expect(evo?.find((e) => e.tier === 2)?.selectedPerkId).toBeNull();
  });

  it("permite limpiar el perk con null", () => {
    state().installVariant("braton", "braton-prime");
    state().selectPerk("braton", "braton-prime", 2, "braton-e2-daring-reverie");
    state().selectPerk("braton", "braton-prime", 2, null);

    const evo = state().progress["braton"]?.installations[0]?.evolutionProgress;
    expect(evo?.find((e) => e.tier === 2)?.selectedPerkId).toBeNull();
  });
});

describe("setTierCompleted y setUninstalledCopies", () => {
  it("marca un tier como completado", () => {
    state().installVariant("braton", "braton-prime");
    state().setTierCompleted("braton", "braton-prime", 1, true);

    const evo = state().progress["braton"]?.installations[0]?.evolutionProgress;
    expect(evo?.find((e) => e.tier === 1)?.completed).toBe(true);
  });

  it("recorta copias negativas a 0", () => {
    state().setUninstalledCopies("braton", -3);
    expect(state().progress["braton"]?.uninstalledCopies).toBe(0);

    state().setUninstalledCopies("braton", 2);
    expect(state().progress["braton"]?.uninstalledCopies).toBe(2);
  });
});

describe("uninstallVariant y resetAll", () => {
  it("uninstall elimina la instalación y limpia la entrada vacía", () => {
    state().installVariant("braton", "braton-prime");
    state().uninstallVariant("braton", "braton-prime");
    expect(state().progress["braton"]).toBeUndefined();
  });

  it("uninstall conserva la entrada si quedan copias sin instalar", () => {
    state().setUninstalledCopies("braton", 1);
    state().installVariant("braton", "braton-prime");
    state().uninstallVariant("braton", "braton-prime");

    const entry = state().progress["braton"];
    expect(entry?.installations).toHaveLength(0);
    expect(entry?.uninstalledCopies).toBe(1);
  });

  it("resetAll limpia todo el progreso", () => {
    state().installVariant("braton", "braton-prime");
    state().resetAll();
    expect(state().progress).toEqual({});
  });

  it("importProgress reemplaza el progreso completo", () => {
    state().installVariant("braton", "braton-prime");
    state().importProgress({
      lex: { weaponId: "lex", uninstalledCopies: 2, installations: [] },
    });
    expect(state().progress["braton"]).toBeUndefined();
    expect(state().progress["lex"]?.uninstalledCopies).toBe(2);
  });
});

describe("migrateProgress (v0 → v1)", () => {
  it("no rompe con un estado persistido v0 y preserva el progreso", () => {
    const persisted = {
      progress: {
        braton: { weaponId: "braton", uninstalledCopies: 1, installations: [] },
      },
    };
    expect(migrateProgress(persisted, 0)).toEqual(persisted);
  });

  it("devuelve progreso vacío ante estado ausente o corrupto", () => {
    expect(migrateProgress(undefined, 0)).toEqual({ progress: {} });
    expect(migrateProgress({}, 0)).toEqual({ progress: {} });
  });
});
