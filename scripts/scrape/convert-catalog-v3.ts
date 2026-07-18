/** Conversión local v1/v2→v3 sin red, con overlay ES y publicación atómica. */
import { readFileSync } from "node:fs";

import spanishJson from "./translations/es.json";
import { readCatalogForGeneration } from "./catalog-compat";
import { identityIssues } from "./identity";
import {
  CATALOG_PATH,
  publishCatalogWithReport,
  type CatalogReportPublicationPaths,
} from "./publish";
import { type RunReport } from "./report";
import { applySpanishTranslations } from "./translations/apply";
import { assertCompleteTranslationCoverage } from "./translations/coverage-gate";
import { loadSpanishTranslationSidecar } from "./translations/schema";
import { validateCatalog } from "./validate";

export { assertCompleteTranslationCoverage } from "./translations/coverage-gate";

export function convertCatalogToV3(raw: unknown, spanishSidecar: unknown = spanishJson) {
  const canonical = readCatalogForGeneration(raw);
  const sidecar = loadSpanishTranslationSidecar(spanishSidecar);
  const translated = applySpanishTranslations(canonical, sidecar);
  if (translated.issues.length > 0) {
    throw new Error(`Conversión ES rechazada: ${JSON.stringify(translated.issues)}`);
  }
  const issues = identityIssues(canonical, translated.catalog);
  if (issues.length > 0) throw new Error(`BLOCKED: huella de IDs diferente: ${issues.join(", ")}`);
  const validation = validateCatalog(translated.catalog);
  if (!validation.success) throw validation.error;
  assertCompleteTranslationCoverage(translated.coverage);
  return { catalog: validation.catalog, coverage: translated.coverage };
}

export function conversionReport(
  startedAt: string,
  finishedAt: string,
  coverage: ReturnType<typeof convertCatalogToV3>["coverage"],
  total: number,
): RunReport {
  return {
    catalogSchemaVersion: 3,
    translationSchemaVersion: 1,
    translationSource: "project-translation",
    startedAt,
    finishedAt,
    mode: "convert-v3",
    total,
    ok: total,
    reviewRequired: [],
    kept: [],
    errors: [],
    imageIssues: [],
    imagesKept: [],
    imagesStaged: [],
    imagesPublished: [],
    coverage,
    translationIssues: [],
    identityIssues: [],
    publication: { status: "published" },
  };
}

export function convertAndPublishCatalogV3(
  raw: unknown,
  spanishSidecar: unknown = spanishJson,
  paths?: CatalogReportPublicationPaths,
): ReturnType<typeof convertCatalogToV3> {
  const startedAt = new Date().toISOString();
  const converted = convertCatalogToV3(raw, spanishSidecar);
  const report = conversionReport(
    startedAt,
    new Date().toISOString(),
    converted.coverage,
    converted.catalog.weapons.length,
  );
  publishCatalogWithReport(converted.catalog, [], report, paths);
  return converted;
}

const isDirectRun = process.argv[1]
  ?.replace(/\\/g, "/")
  .endsWith("scripts/scrape/convert-catalog-v3.ts");
if (isDirectRun) {
  const startedAt = new Date().toISOString();
  const raw: unknown = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const converted = convertCatalogToV3(raw);
  const report = conversionReport(
    startedAt,
    new Date().toISOString(),
    converted.coverage,
    converted.catalog.weapons.length,
  );
  publishCatalogWithReport(converted.catalog, [], report);
  console.log(
    `Catálogo v3 publicado de forma atómica. Cobertura ES: ${converted.coverage.translated}/${converted.coverage.translated + converted.coverage.missing} (${converted.coverage.percentage}%).`,
  );
}
