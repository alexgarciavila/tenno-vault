// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { printSummary, type RunReport } from "../report";

afterEach(() => vi.restoreAllMocks());

describe("reporting de imágenes", () => {
  it("distingue publicación abortada, incidencia por fase e imagen previa conservada", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const report: RunReport = {
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
