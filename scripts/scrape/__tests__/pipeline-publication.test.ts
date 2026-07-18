// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import catalogJson from "../../../src/data/incarnon-catalog.json";
import { incarnonCatalogSchema } from "../../../src/data/catalog-schema";
import { publishCatalogWithReport, type CatalogReportPublicationPaths } from "../publish";
import reportJson from "../report/last-run.json";
import type { RunReport } from "../report";
import { finishScrapePublication, finishScrapeWithoutPublication } from "../index";

const temporaryRoots: string[] = [];
const catalog = incarnonCatalogSchema.parse(catalogJson);

function fixture(): {
  paths: CatalogReportPublicationPaths;
  previousCatalog: Buffer;
  previousReport: Buffer;
} {
  const root = mkdtempSync(join(tmpdir(), "tenno-vault-pipeline-"));
  temporaryRoots.push(root);
  const paths: CatalogReportPublicationPaths = {
    catalogPath: join(root, "catalog.json"),
    reportPath: join(root, "last-run.json"),
    publicRoot: resolve("public", "generated", "incarnon-images"),
    stagingRoot: join(root, "staging"),
  };
  const previousCatalog = Buffer.from("catálogo previo exacto\r\n", "utf8");
  const previousReport = Buffer.from("informe previo exacto\r\n", "utf8");
  writeFileSync(paths.catalogPath, previousCatalog);
  writeFileSync(paths.reportPath, previousReport);
  return { paths, previousCatalog, previousReport };
}

function completeReport(): RunReport {
  return structuredClone(reportJson) as RunReport;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("publicación del camino oficial extraído", () => {
  it("bloquea un campo faltante en una sola arma y preserva catálogo e informe", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    report.coverage!.translated--;
    report.coverage!.missing++;
    report.coverage!.percentage = 99.94;
    report.coverage!.byWeapon.phenmor!.translated--;
    report.coverage!.byWeapon.phenmor!.missing++;
    report.coverage!.byWeapon.phenmor!.percentage = 99;

    expect(() => finishScrapePublication(catalog, [], report, paths)).toThrow(
      /BLOCKED: cobertura ES incompleta[\s\S]*phenmor/,
    );
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  for (const mode of ["all", "weapon:phenmor"] as const) {
    it(`aplica el gate al camino oficial ${mode} y preserva ambos activos`, () => {
      const { paths, previousCatalog, previousReport } = fixture();
      const report = completeReport();
      report.mode = mode;
      report.coverage!.translated--;
      report.coverage!.missing++;
      report.coverage!.percentage = 99.94;

      expect(() => finishScrapePublication(catalog, [], report, paths)).toThrow(
        /BLOCKED: cobertura ES incompleta/,
      );
      expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
      expect(readFileSync(paths.reportPath)).toEqual(previousReport);
    });
  }

  it("un aborto previo solo informa por consola y preserva ambos activos byte a byte", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    report.mode = "all";

    const finalReport = finishScrapeWithoutPublication(
      report,
      { status: "aborted", reason: "fallo previo al gate" },
      "2026-07-18T12:00:00.000Z",
    );

    expect(finalReport.publication).toEqual({ status: "aborted", reason: "fallo previo al gate" });
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("list-only produce resumen útil sin publicar ni alterar ambos activos", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    report.mode = "list-only";
    const reason = "Modo de consulta: no publica catálogo ni informe activo.";
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    const finalReport = finishScrapeWithoutPublication(
      report,
      { status: "not-published", reason },
      "2026-07-18T12:00:00.000Z",
    );

    expect(finalReport.publication).toEqual({ status: "not-published", reason });
    expect(log.mock.calls.flat().join("\n")).toContain("Publicación:      not-published");
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("impide usar el publicador transaccional como bypass del gate", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    report.coverage!.translated--;
    report.coverage!.missing++;

    expect(() => publishCatalogWithReport(catalog, [], report, paths)).toThrow(
      /BLOCKED: la cobertura del informe no corresponde exactamente/,
    );
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("rechaza un informe 100 % que no corresponde con el catálogo candidato", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const incompleteCatalog = structuredClone(catalog);
    delete incompleteCatalog.weapons.find((weapon) => weapon.id === "phenmor")!.name.es;

    expect(() => publishCatalogWithReport(incompleteCatalog, [], completeReport(), paths)).toThrow(
      /BLOCKED|cobertura|incomplet/i,
    );
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("rechaza un informe con global correcto y detalle por campo manipulado", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    report.coverage!.byField.name.translated--;
    report.coverage!.byField.name.missing++;
    report.coverage!.byField.name.percentage = 98.11;

    expect(() => publishCatalogWithReport(catalog, [], report, paths)).toThrow(
      /BLOCKED: la cobertura del informe no corresponde exactamente/,
    );
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("rechaza IDs de armas incoherentes aunque global y número de armas coincidan", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    report.coverage!.byWeapon["arma-inventada"] = report.coverage!.byWeapon.phenmor!;
    delete report.coverage!.byWeapon.phenmor;

    expect(() => publishCatalogWithReport(catalog, [], report, paths)).toThrow(
      /BLOCKED: la cobertura del informe no corresponde exactamente/,
    );
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("publica catálogo e informe final conjuntamente solo con 1594/1594 y 53/53 armas", () => {
    const { paths } = fixture();
    const report = completeReport();
    report.finishedAt = "";
    report.publication = { status: "aborted", reason: "pendiente" };
    const finishedAt = "2026-07-18T12:00:00.000Z";

    const finalReport = finishScrapePublication(catalog, [], report, paths, finishedAt);

    expect(JSON.parse(readFileSync(paths.catalogPath, "utf8"))).toEqual(catalog);
    expect(JSON.parse(readFileSync(paths.reportPath, "utf8"))).toEqual(finalReport);
    expect(finalReport).toMatchObject({
      finishedAt,
      coverage: { translated: 1594, missing: 0, percentage: 100 },
      publication: { status: "published" },
    });
    expect(Object.keys(finalReport.coverage!.byWeapon)).toHaveLength(53);
  });

  it("preserva ambos archivos si falla la preparación del informe", () => {
    const { paths, previousCatalog, previousReport } = fixture();
    const report = completeReport();
    (report as unknown as { total: bigint }).total = BigInt(53);

    expect(() => finishScrapePublication(catalog, [], report, paths)).toThrow(/BigInt/);
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });
});
