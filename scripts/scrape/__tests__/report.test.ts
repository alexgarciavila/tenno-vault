// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { conversionReport } from "../convert-catalog-v3";
import { printSummary, type RunReport } from "../report";
import type { TranslationCoverage } from "../translations/apply";

afterEach(() => vi.restoreAllMocks());

describe("reporting de imágenes", () => {
  it("distingue publicación abortada, incidencia por fase e imagen previa conservada", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const report: RunReport = {
      catalogSchemaVersion: 3,
      translationSchemaVersion: 1,
      translationSource: "project-translation",
      startedAt: "2026-07-13T00:00:00.000Z",
      finishedAt: "2026-07-13T00:00:01.000Z",
      mode: "weapon:braton",
      total: 1,
      ok: 0,
      reviewRequired: [{ id: "braton", notes: ["Imagen ambigua"] }],
      kept: [],
      errors: [{ id: "publication", error: "Catálogo previo conservado" }],
      imageIssues: [{ id: "braton", phase: "parse", reason: "Imagen ambigua" }],
      imagesKept: ["braton"],
      imagesStaged: ["braton"],
      imagesPublished: [],
      coverage: null,
      translationIssues: [],
      identityIssues: [],
      publication: { status: "aborted", reason: "Catálogo previo conservado" },
    };

    printSummary(report);

    const output = log.mock.calls.map(([message]) => String(message)).join("\n");
    expect(output).toContain("Incidencias img.: 1");
    expect(output).toContain("Imágenes staged:  1");
    expect(output).toContain("Imágenes nuevas:  0");
    expect(output).toContain("Publicación:      aborted");
    expect(output).toContain("[imagen:parse] braton: Imagen ambigua");
    expect(output).toContain("[imagen conservada] braton");
    expect(output).toContain("[publicación] Catálogo previo conservado");
  });
});

describe("reporting de conversión v3", () => {
  it("materializa versión, procedencia y cobertura por arma/campo", () => {
    const stats = { translated: 1, missing: 2, notApplicable: 3, percentage: 33.33 };
    const byField = {
      name: stats,
      weaponName: stats,
      variantName: stats,
      unlockCondition: stats,
      perkName: stats,
      perkDescription: stats,
      perkNotes: stats,
      variantValue: stats,
    } satisfies TranslationCoverage["byField"];
    const coverage = {
      ...stats,
      byField,
      byWeapon: { phenmor: { ...stats, byField } },
    } satisfies TranslationCoverage;

    const report = conversionReport("inicio", "fin", coverage, 1);

    expect(report).toMatchObject({
      catalogSchemaVersion: 3,
      translationSchemaVersion: 1,
      translationSource: "project-translation",
      mode: "convert-v3",
      total: 1,
      ok: 1,
      coverage,
      publication: { status: "published" },
    });
  });
});
