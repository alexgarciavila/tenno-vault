// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const renameFailure = vi.hoisted(() => ({ call: 0, failAt: Number.POSITIVE_INFINITY }));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    renameSync(source: import("node:fs").PathLike, destination: import("node:fs").PathLike) {
      renameFailure.call++;
      if (renameFailure.call === renameFailure.failAt) {
        throw new Error(`fallo rename simulado ${renameFailure.failAt}`);
      }
      return actual.renameSync(source, destination);
    },
  };
});

import catalogJson from "../../../src/data/incarnon-catalog.json";
import { incarnonCatalogSchema } from "../../../src/data/catalog-schema";
import { publishCompleteScrapeRun } from "../pipeline-publication";
import type { CatalogReportPublicationPaths } from "../publish";
import reportJson from "../report/last-run.json";
import type { RunReport } from "../report";

const temporaryRoots: string[] = [];

afterEach(() => {
  renameFailure.call = 0;
  renameFailure.failAt = Number.POSITIVE_INFINITY;
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(): {
  paths: CatalogReportPublicationPaths;
  previousCatalog: Buffer;
  previousReport: Buffer;
} {
  const root = mkdtempSync(join(tmpdir(), "tenno-vault-transaction-"));
  temporaryRoots.push(root);
  const paths: CatalogReportPublicationPaths = {
    catalogPath: join(root, "catalog.json"),
    reportPath: join(root, "last-run.json"),
    publicRoot: resolve("public", "generated", "incarnon-images"),
    stagingRoot: join(root, "staging"),
  };
  const previousCatalog = Buffer.from("catálogo previo byte a byte\r\n", "utf8");
  const previousReport = Buffer.from("informe previo byte a byte\r\n", "utf8");
  writeFileSync(paths.catalogPath, previousCatalog);
  writeFileSync(paths.reportPath, previousReport);
  return { paths, previousCatalog, previousReport };
}

describe("rollback transaccional de catálogo e informe", () => {
  for (const [stage, failAt] of [
    ["backup del catálogo", 1],
    ["backup del informe", 2],
    ["commit del catálogo", 3],
    ["commit del informe", 4],
  ] as const) {
    it(`restaura ambos archivos si falla ${stage}`, () => {
      const { paths, previousCatalog, previousReport } = fixture();
      renameFailure.failAt = failAt;

      expect(() =>
        publishCompleteScrapeRun(
          incarnonCatalogSchema.parse(catalogJson),
          [],
          reportJson as RunReport,
          paths,
        ),
      ).toThrow(`fallo rename simulado ${failAt}`);

      expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
      expect(readFileSync(paths.reportPath)).toEqual(previousReport);
    });
  }
});
