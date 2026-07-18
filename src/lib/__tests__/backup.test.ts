import { describe, expect, it } from "vitest";
import { getCatalog } from "../../data/catalog";
import type { ProgressRecord, UserSettings } from "../user-types";
import { backupFileName, createBackup, diffBackup, parseBackup, serializeBackup } from "../backup";

const settings: UserSettings = { language: "es", view: "cards" };

const sampleProgress: ProgressRecord = {
  braton: {
    weaponId: "braton",
    uninstalledCopies: 1,
    installations: [
      {
        variantId: "braton-prime",
        evolutionProgress: [
          { tier: 1, completed: true, selectedPerkId: null },
          { tier: 2, completed: false, selectedPerkId: null },
        ],
      },
    ],
  },
};

describe("backup — createBackup / serializeBackup / backupFileName", () => {
  it("createBackup produce el envoltorio con la versión y el app id", () => {
    const backup = createBackup(sampleProgress, settings, new Date("2026-07-12T10:00:00Z"));
    expect(backup.app).toBe("tenno-vault");
    expect(backup.schemaVersion).toBe(1);
    expect(backup.exportedAt).toBe("2026-07-12T10:00:00.000Z");
    expect(backup.settings).toEqual(settings);
    expect(backup.progress).toEqual(sampleProgress);
  });

  it("serializeBackup genera JSON indentado (pretty)", () => {
    const backup = createBackup(sampleProgress, settings);
    const json = serializeBackup(backup);
    expect(json).toContain('\n  "app"');
  });

  it("backupFileName usa el patrón tenno-vault-backup-YYYY-MM-DD.json", () => {
    const name = backupFileName(new Date(2026, 6, 5));
    expect(name).toBe("tenno-vault-backup-2026-07-05.json");
  });
});

describe("backup — parseBackup", () => {
  it("round-trip: export → serialize → parse devuelve ok con el mismo contenido", () => {
    const backup = createBackup(sampleProgress, settings);
    const result = parseBackup(serializeBackup(backup));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.progress).toEqual(sampleProgress);
      expect(result.backup.settings).toEqual(settings);
    }
  });

  it("rechaza JSON corrupto con motivo invalid-json", () => {
    const result = parseBackup("{ esto no es json");
    expect(result).toEqual({ ok: false, reason: "invalid-json" });
  });

  it("rechaza esquema inválido (progress malformado) con invalid-schema", () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      exportedAt: "2026-07-12T00:00:00.000Z",
      app: "tenno-vault",
      settings,
      progress: {
        braton: {
          weaponId: "braton",
          uninstalledCopies: "muchas", // debería ser number
          installations: [],
        },
      },
    });
    const result = parseBackup(raw);
    expect(result).toEqual({ ok: false, reason: "invalid-schema" });
  });

  it("rechaza un backup sin campos de envoltorio con invalid-schema", () => {
    const result = parseBackup(JSON.stringify({ hello: "world" }));
    expect(result).toEqual({ ok: false, reason: "invalid-schema" });
  });

  it("rechaza schemaVersion futura (99) con unsupported-version", () => {
    const raw = JSON.stringify({
      schemaVersion: 99,
      exportedAt: "2026-07-12T00:00:00.000Z",
      app: "tenno-vault",
      settings,
      progress: {},
    });
    const result = parseBackup(raw);
    expect(result).toEqual({ ok: false, reason: "unsupported-version" });
  });

  it("rechaza un app id ajeno con invalid-schema", () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      exportedAt: "2026-07-12T00:00:00.000Z",
      app: "otra-app",
      settings,
      progress: {},
    });
    const result = parseBackup(raw);
    expect(result).toEqual({ ok: false, reason: "invalid-schema" });
  });
});

describe("backup — diffBackup", () => {
  const catalog = getCatalog();

  it("clasifica armas añadidas, modificadas y eliminadas con sus deltas", () => {
    const current: ProgressRecord = {
      braton: { weaponId: "braton", uninstalledCopies: 1, installations: [] },
      skana: { weaponId: "skana", uninstalledCopies: 1, installations: [] },
    };
    const incoming: ProgressRecord = {
      braton: { weaponId: "braton", uninstalledCopies: 3, installations: [] },
      lex: { weaponId: "lex", uninstalledCopies: 1, installations: [] },
    };

    const diff = diffBackup(current, incoming, catalog);

    expect(diff.added.map((d) => d.weaponId)).toEqual(["lex"]);
    expect(diff.removed.map((d) => d.weaponId)).toEqual(["skana"]);
    expect(diff.modified.map((d) => d.weaponId)).toEqual(["braton"]);
    expect(diff.modified[0]?.copiesDelta).toBe(2);
    // El nombre viene del catálogo real, no del id.
    expect(diff.added[0]?.weaponName).toBe(catalog.weapons.find((w) => w.id === "lex")?.name.en);
  });

  it("cuenta el delta de tiers completados en armas modificadas", () => {
    const current: ProgressRecord = {
      braton: {
        weaponId: "braton",
        uninstalledCopies: 0,
        installations: [
          {
            variantId: "braton-prime",
            evolutionProgress: [{ tier: 1, completed: false, selectedPerkId: null }],
          },
        ],
      },
    };
    const incoming: ProgressRecord = {
      braton: {
        weaponId: "braton",
        uninstalledCopies: 0,
        installations: [
          {
            variantId: "braton-prime",
            evolutionProgress: [{ tier: 1, completed: true, selectedPerkId: null }],
          },
        ],
      },
    };

    const diff = diffBackup(current, incoming, catalog);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0]?.completedTiersDelta).toBe(1);
  });

  it("no marca como modificada un arma idéntica (unchangedCount)", () => {
    const same: ProgressRecord = {
      braton: { weaponId: "braton", uninstalledCopies: 1, installations: [] },
    };
    const diff = diffBackup(same, structuredClone(same), catalog);
    expect(diff.modified).toHaveLength(0);
    expect(diff.unchangedCount).toBe(1);
  });

  it("cuenta instalaciones huérfanas del backup contra el catálogo real", () => {
    const incoming: ProgressRecord = {
      // Variante inexistente en el catálogo de braton.
      braton: {
        weaponId: "braton",
        uninstalledCopies: 0,
        installations: [
          {
            variantId: "variante-fantasma",
            evolutionProgress: [{ tier: 1, completed: false, selectedPerkId: null }],
          },
        ],
      },
      // Arma que no existe en el catálogo: todas sus instalaciones son huérfanas.
      "arma-inexistente": {
        weaponId: "arma-inexistente",
        uninstalledCopies: 0,
        installations: [
          { variantId: "x", evolutionProgress: [] },
          { variantId: "y", evolutionProgress: [] },
        ],
      },
    };

    const diff = diffBackup({}, incoming, catalog);
    expect(diff.orphanInstallations).toBe(3);
  });
});
