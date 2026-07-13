import { describe, expect, it } from "vitest";
import { getWeapon } from "../../data/catalog";
import type { IncarnonWeapon } from "../../data/catalog-schema";
import {
  computeCopies,
  computeEvolutionSummary,
  computeGlobalSummary,
  computeStatus,
  findOrphanInstallations,
} from "../inventory";
import type { IncarnonInstallation, UserIncarnonProgress } from "../user-types";

/** Arma real del catálogo; falla el test si el id no existe. */
function requireWeapon(id: string): IncarnonWeapon {
  const weapon = getWeapon(id);
  if (!weapon) throw new Error(`arma no encontrada en el catálogo: ${id}`);
  return weapon;
}

/** Instalación con los tiers reales del arma; `completedTiers` marca cuáles. */
function installation(
  weapon: IncarnonWeapon,
  variantId: string,
  completedTiers: number[] = [],
): IncarnonInstallation {
  return {
    variantId,
    evolutionProgress: weapon.evolutions.map((evo) => ({
      tier: evo.tier,
      completed: completedTiers.includes(evo.tier),
      selectedPerkId: null,
    })),
  };
}

/** Todos los tiers del arma. */
function allTiers(weapon: IncarnonWeapon): number[] {
  return weapon.evolutions.map((evo) => evo.tier);
}

describe("computeCopies / computeStatus — ejemplos A–D de la spec", () => {
  it("A — Braton: 1 instalada (Prime) + 1 sin instalar → 2 pendientes, instalado parcialmente", () => {
    const braton = requireWeapon("braton");
    const progress: UserIncarnonProgress = {
      weaponId: "braton",
      uninstalledCopies: 1,
      installations: [installation(braton, "braton-prime")],
    };

    const copies = computeCopies(braton, progress);
    expect(copies).toEqual({
      needed: 4,
      existing: 2,
      installed: 1,
      uninstalled: 1,
      missing: 2,
      extra: 0,
    });
    expect(computeStatus(braton, progress).status).toBe("partially-installed");
  });

  it("B — Lex: instalada en ambas variantes con 8/8 tiers → completado", () => {
    const lex = requireWeapon("lex");
    const tiers = allTiers(lex);
    const progress: UserIncarnonProgress = {
      weaponId: "lex",
      uninstalledCopies: 0,
      installations: [installation(lex, "lex", tiers), installation(lex, "lex-prime", tiers)],
    };

    const copies = computeCopies(lex, progress);
    expect(copies.needed).toBe(2);
    expect(copies.missing).toBe(0);
    expect(computeStatus(lex, progress).status).toBe("completed");

    const evo = computeEvolutionSummary(lex, progress);
    expect(evo.completedTiers).toBe(8);
    expect(evo.totalTiers).toBe(8);
  });

  it("C — Skana: 2 instaladas + 2 sin instalar → cubierto con 1 copia extra", () => {
    const skana = requireWeapon("skana");
    const progress: UserIncarnonProgress = {
      weaponId: "skana",
      uninstalledCopies: 2,
      installations: [installation(skana, "skana"), installation(skana, "prisma-skana")],
    };

    const copies = computeCopies(skana, progress);
    expect(copies).toEqual({
      needed: 3,
      existing: 4,
      installed: 2,
      uninstalled: 2,
      missing: 0,
      extra: 1,
    });
    expect(computeStatus(skana, progress).status).toBe("covered");
  });

  it("D — Phenmor (innata): no conseguido / cubierto 3-de-5 / completado 5-de-5", () => {
    const phenmor = requireWeapon("phenmor");

    // Sin instalación: no conseguido.
    expect(computeStatus(phenmor, undefined).status).toBe("not-owned");

    // Obtenida con 3/5 tiers: cubierto.
    const partial: UserIncarnonProgress = {
      weaponId: "phenmor",
      uninstalledCopies: 0,
      installations: [installation(phenmor, "phenmor", [1, 2, 3])],
    };
    expect(computeStatus(phenmor, partial).status).toBe("covered");
    const partialEvo = computeEvolutionSummary(phenmor, partial);
    expect(partialEvo.completedTiers).toBe(3);
    expect(partialEvo.totalTiers).toBe(5);

    // 5/5 tiers: completado.
    const full: UserIncarnonProgress = {
      weaponId: "phenmor",
      uninstalledCopies: 0,
      installations: [installation(phenmor, "phenmor", allTiers(phenmor))],
    };
    expect(computeStatus(phenmor, full).status).toBe("completed");
  });
});

describe("computeCopies / computeStatus — casos límite", () => {
  it("progress undefined = arma sin registrar → existing 0 y no conseguido", () => {
    const braton = requireWeapon("braton");
    const copies = computeCopies(braton, undefined);
    expect(copies).toEqual({
      needed: 4,
      existing: 0,
      installed: 0,
      uninstalled: 0,
      missing: 4,
      extra: 0,
    });
    expect(computeStatus(braton, undefined).status).toBe("not-owned");
  });

  it("solo copias sin instalar → disponible", () => {
    const braton = requireWeapon("braton");
    const progress: UserIncarnonProgress = {
      weaponId: "braton",
      uninstalledCopies: 1,
      installations: [],
    };
    expect(computeStatus(braton, progress).status).toBe("available");
  });

  it("copias extra: más existencias que variantes → extra > 0 y cubierto", () => {
    const lex = requireWeapon("lex");
    const progress: UserIncarnonProgress = {
      weaponId: "lex",
      uninstalledCopies: 5,
      installations: [],
    };
    const copies = computeCopies(lex, progress);
    expect(copies.missing).toBe(0);
    expect(copies.extra).toBe(3);
    expect(computeStatus(lex, progress).status).toBe("covered");
  });

  it("instalación huérfana (variantId inexistente) se ignora en los cálculos", () => {
    const braton = requireWeapon("braton");
    const progress: UserIncarnonProgress = {
      weaponId: "braton",
      uninstalledCopies: 0,
      installations: [
        installation(braton, "braton-prime"),
        // Variante que no existe en el catálogo del arma.
        installation(braton, "braton-fantasma"),
      ],
    };
    const copies = computeCopies(braton, progress);
    expect(copies.installed).toBe(1);
    expect(copies.existing).toBe(1);

    const orphans = findOrphanInstallations(braton, progress);
    expect(orphans).toHaveLength(1);
    expect(orphans[0]?.variantId).toBe("braton-fantasma");
  });

  it("hasIncompleteData refleja dataStatus del catálogo, independiente del estado", () => {
    const braton = requireWeapon("braton");
    expect(computeStatus(braton, undefined).hasIncompleteData).toBe(false);

    const incomplete: IncarnonWeapon = { ...braton, dataStatus: "incomplete" };
    const result = computeStatus(incomplete, undefined);
    expect(result.hasIncompleteData).toBe(true);
    // La bandera no altera el estado derivado.
    expect(result.status).toBe("not-owned");
  });

  it("todas las variantes instaladas pero tiers incompletos → cubierto, no completado", () => {
    const lex = requireWeapon("lex");
    const progress: UserIncarnonProgress = {
      weaponId: "lex",
      uninstalledCopies: 0,
      installations: [installation(lex, "lex", [1, 2]), installation(lex, "lex-prime")],
    };
    expect(computeStatus(lex, progress).status).toBe("covered");
  });
});

describe("computeEvolutionSummary", () => {
  it("agrega tiers sobre las instalaciones existentes y desglosa por instalación", () => {
    const skana = requireWeapon("skana");
    const progress: UserIncarnonProgress = {
      weaponId: "skana",
      uninstalledCopies: 0,
      installations: [
        installation(skana, "skana", [1, 2]),
        installation(skana, "skana-prime", [1]),
      ],
    };
    const evo = computeEvolutionSummary(skana, progress);
    expect(evo.completedTiers).toBe(3);
    expect(evo.totalTiers).toBe(8); // 4 tiers × 2 instalaciones
    expect(evo.byInstallation).toEqual([
      { variantId: "skana", completedTiers: 2, totalTiers: 4 },
      { variantId: "skana-prime", completedTiers: 1, totalTiers: 4 },
    ]);
  });

  it("sin progreso → resumen vacío", () => {
    const skana = requireWeapon("skana");
    const evo = computeEvolutionSummary(skana, undefined);
    expect(evo).toEqual({
      completedTiers: 0,
      totalTiers: 0,
      byInstallation: [],
    });
  });
});

describe("computeGlobalSummary", () => {
  it("agrega métricas de inicio sobre catálogo + progreso", () => {
    const braton = requireWeapon("braton");
    const lex = requireWeapon("lex");
    const skana = requireWeapon("skana");
    const weapons = [braton, lex, skana];

    const progressRecord = {
      // Braton: 1 instalada + 1 sin instalar (parcial): missing 2.
      braton: {
        weaponId: "braton",
        uninstalledCopies: 1,
        installations: [installation(braton, "braton-prime", [1])],
      },
      // Lex: completada (2 variantes, 8/8).
      lex: {
        weaponId: "lex",
        uninstalledCopies: 0,
        installations: [
          installation(lex, "lex", allTiers(lex)),
          installation(lex, "lex-prime", allTiers(lex)),
        ],
      },
      // Skana: sin registrar (no aparece en el record).
    };

    const summary = computeGlobalSummary(weapons, progressRecord);
    expect(summary.adaptersObtained).toBe(2); // braton + lex
    expect(summary.installed).toBe(2); // braton + lex
    expect(summary.availableCopies).toBe(1); // braton
    expect(summary.pendingCopies).toBe(2 + 3); // braton missing 2 + skana missing 3
    expect(summary.fullyCoveredFamilies).toBe(1); // solo lex
    expect(summary.evolutionsCompleted).toBe(1 + 8); // braton 1 + lex 8
    expect(summary.evolutionsTotal).toBe(4 + 8); // braton 4 + lex 8
  });
});
