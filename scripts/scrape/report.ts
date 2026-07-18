import { join } from "node:path";

import type { TranslationCoverage } from "./translations/apply";

export interface RunReport {
  catalogSchemaVersion: number;
  translationSchemaVersion: number | null;
  translationSource: "project-translation" | null;
  startedAt: string;
  finishedAt: string;
  /** "all" | "weapon:<id>" | "list-only". */
  mode: string;
  /** Total de armas consideradas. */
  total: number;
  /** Armas scrapeadas y completas. */
  ok: number;
  /** Armas parseadas con estructura inesperada. */
  reviewRequired: Array<{ id: string; notes: string[] }>;
  /** Armas cuyo registro previo se conservó (no re-scrapeadas o con error de fetch). */
  kept: string[];
  /** Errores irrecuperables por arma. */
  errors: Array<{ id: string; error: string }>;
  imageIssues: Array<{
    id: string;
    phase: "parse" | "url" | "fetch" | "content" | "publish";
    reason: string;
  }>;
  imagesKept: string[];
  /** Imágenes descargadas en staging durante esta ejecución, aún no confirmadas. */
  imagesStaged: string[];
  /** Imágenes confirmadas únicamente después del commit del catálogo. */
  imagesPublished: string[];
  coverage: TranslationCoverage | null;
  translationIssues: Array<{
    kind: "orphan" | "blank" | "placeholder-mismatch" | "mechanic-mismatch";
    path: string;
    reason: string;
  }>;
  identityIssues: string[];
  publication: { status: "published" | "aborted" | "not-published"; reason?: string };
}

export const DEFAULT_REPORT_PATH = join("scripts", "scrape", "report", "last-run.json");

/** Resumen legible por consola. */
export function printSummary(report: RunReport): void {
  console.log("");
  console.log(`Scrape (${report.mode}) — ${report.startedAt} → ${report.finishedAt}`);
  console.log(`  Total:            ${report.total}`);
  console.log(`  OK:               ${report.ok}`);
  console.log(`  Revisión:         ${report.reviewRequired.length}`);
  console.log(`  Conservadas:      ${report.kept.length}`);
  console.log(`  Errores:          ${report.errors.length}`);
  console.log(`  Imágenes staged:  ${report.imagesStaged.length}`);
  console.log(`  Imágenes nuevas:  ${report.imagesPublished.length}`);
  console.log(`  Imágenes previas: ${report.imagesKept.length}`);
  console.log(`  Incidencias img.: ${report.imageIssues.length}`);
  if (report.coverage) console.log(`  Cobertura ES:     ${report.coverage.percentage}%`);
  console.log(`  Incidencias ES:   ${report.translationIssues.length}`);
  console.log(`  Incidencias IDs:  ${report.identityIssues.length}`);
  console.log(`  Publicación:      ${report.publication.status}`);

  for (const item of report.reviewRequired) {
    console.log(`  [revisar] ${item.id}`);
    for (const note of item.notes) console.log(`     - ${note}`);
  }
  for (const id of report.kept) console.log(`  [conservada] ${id}`);
  for (const err of report.errors) console.log(`  [error] ${err.id}: ${err.error}`);
  for (const issue of report.imageIssues) {
    console.log(`  [imagen:${issue.phase}] ${issue.id}: ${issue.reason}`);
  }
  for (const id of report.imagesKept) console.log(`  [imagen conservada] ${id}`);
  if (report.publication.reason) console.log(`  [publicación] ${report.publication.reason}`);
}
