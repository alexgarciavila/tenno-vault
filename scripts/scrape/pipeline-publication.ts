import type { IncarnonCatalog } from "../../src/data/catalog-schema";
import {
  publishCatalogWithReport,
  type CatalogReportPublicationPaths,
  type StagedImage,
} from "./publish";
import type { RunReport } from "./report";
import { assertCompleteTranslationCoverage } from "./translations/coverage-gate";

/**
 * Cierra el informe en memoria y publica catálogo e informe en una sola transacción.
 * Los intentos abortados se limitan al diagnóstico por consola y no alteran los activos.
 */
export function publishCompleteScrapeRun(
  catalog: IncarnonCatalog,
  stagedImages: StagedImage[],
  report: RunReport,
  paths?: CatalogReportPublicationPaths,
  finishedAt: string = new Date().toISOString(),
): RunReport {
  if (!report.coverage) {
    throw new Error("BLOCKED: el candidato no contiene un informe de cobertura ES.");
  }
  assertCompleteTranslationCoverage(report.coverage);

  const finalReport: RunReport = {
    ...report,
    finishedAt,
    imagesPublished: [...report.imagesStaged],
    publication: { status: "published" },
  };
  publishCatalogWithReport(catalog, stagedImages, finalReport, paths);
  return finalReport;
}
