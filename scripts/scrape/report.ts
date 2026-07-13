import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface RunReport {
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
}

export const DEFAULT_REPORT_PATH = join("scripts", "scrape", "report", "last-run.json");

/** Escribe el informe JSON de la ejecución (crea el directorio si no existe). */
export function writeReport(report: RunReport, path: string = DEFAULT_REPORT_PATH): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

/** Resumen legible por consola. */
export function printSummary(report: RunReport): void {
  console.log("");
  console.log(`Scrape (${report.mode}) — ${report.startedAt} → ${report.finishedAt}`);
  console.log(`  Total:            ${report.total}`);
  console.log(`  OK:               ${report.ok}`);
  console.log(`  Revisión:         ${report.reviewRequired.length}`);
  console.log(`  Conservadas:      ${report.kept.length}`);
  console.log(`  Errores:          ${report.errors.length}`);

  for (const item of report.reviewRequired) {
    console.log(`  [revisar] ${item.id}`);
    for (const note of item.notes) console.log(`     - ${note}`);
  }
  for (const id of report.kept) console.log(`  [conservada] ${id}`);
  for (const err of report.errors) console.log(`  [error] ${err.id}: ${err.error}`);
}
