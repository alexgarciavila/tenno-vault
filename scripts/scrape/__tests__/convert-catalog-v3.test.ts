// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import catalogJson from "../../../src/data/incarnon-catalog.json";
import spanishJson from "../translations/es.json";
import {
  assertCompleteTranslationCoverage,
  convertAndPublishCatalogV3,
  convertCatalogToV3,
} from "../convert-catalog-v3";
import type { CatalogReportPublicationPaths } from "../publish";
import { spanishTranslationSidecarSchema } from "../translations/schema";

const temporaryRoots: string[] = [];

function publicationPaths(root: string): CatalogReportPublicationPaths {
  return {
    catalogPath: join(root, "catalog.json"),
    reportPath: join(root, "last-run.json"),
    publicRoot: resolve("public", "generated", "incarnon-images"),
    stagingRoot: join(root, "staging"),
  };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("gate final y publicación de conversión v3", () => {
  it("rechaza un único campo faltante de una sola arma y preserva ambos archivos byte a byte", () => {
    const root = mkdtempSync(join(tmpdir(), "tenno-vault-convert-"));
    temporaryRoots.push(root);
    const paths = publicationPaths(root);
    const previousCatalog = Buffer.from("catálogo previo exacto\r\n", "utf8");
    const previousReport = Buffer.from("informe previo exacto\r\n", "utf8");
    writeFileSync(paths.catalogPath, previousCatalog);
    writeFileSync(paths.reportPath, previousReport);
    const incomplete = spanishTranslationSidecarSchema.parse(structuredClone(spanishJson));
    delete incomplete.weapons.phenmor!.name;

    expect(() => convertAndPublishCatalogV3(catalogJson, incomplete, paths)).toThrow(
      /BLOCKED: cobertura ES incompleta[\s\S]*phenmor/,
    );
    expect(readFileSync(paths.catalogPath)).toEqual(previousCatalog);
    expect(readFileSync(paths.reportPath)).toEqual(previousReport);
  });

  it("bloquea si una sola arma queda por debajo de 100 % aunque el global aparente completo", () => {
    const complete = convertCatalogToV3(catalogJson).coverage;
    const forged = structuredClone(complete);
    forged.byWeapon.phenmor!.missing = 1;
    forged.byWeapon.phenmor!.percentage = 99;

    expect(() => assertCompleteTranslationCoverage(forged)).toThrow(/phenmor/);
  });

  it("acepta 1594/1594 y publica catálogo e informe coherentes", () => {
    const root = mkdtempSync(join(tmpdir(), "tenno-vault-convert-"));
    temporaryRoots.push(root);
    const paths = publicationPaths(root);

    const converted = convertAndPublishCatalogV3(catalogJson, spanishJson, paths);
    const publishedCatalog = JSON.parse(readFileSync(paths.catalogPath, "utf8"));
    const publishedReport = JSON.parse(readFileSync(paths.reportPath, "utf8"));

    expect(converted.coverage).toMatchObject({
      translated: 1594,
      missing: 0,
      notApplicable: 631,
      percentage: 100,
    });
    expect(publishedCatalog).toEqual(converted.catalog);
    expect(publishedReport).toMatchObject({
      total: 53,
      ok: 53,
      coverage: converted.coverage,
      publication: { status: "published" },
    });
  });
});
