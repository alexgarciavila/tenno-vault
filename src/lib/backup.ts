/**
 * Lógica pura de copias de seguridad: export/import con validación Zod + vista
 * previa de diferencias. Sin React, sin store, sin side-effects de
 * descarga/escritura: la UI compone estas funciones y aplica el resultado tras
 * confirmación (`importProgress` + setters de settings).
 *
 * La importación REEMPLAZA el progreso (no hace merge); el
 * diff (`diffBackup`) es solo informativo para la vista previa.
 *
 * Política de versión de esquema:
 *   - `schemaVersion` futura (> actual) → rechazo tipado (`unsupported-version`).
 *   - `schemaVersion` antigua (< actual) → hook de migración (hoy identidad
 *     desde v1; se amplía con un `case` por versión de origen).
 *   - `schemaVersion` actual → validación completa contra `userStateSchema`.
 */

import { z } from "zod";
import type { IncarnonCatalog } from "../data/catalog-schema";
import { findOrphanInstallations } from "./inventory";
import {
  USER_STATE_SCHEMA_VERSION,
  progressRecordSchema,
  userSettingsSchema,
  type ProgressRecord,
  type UserIncarnonProgress,
  type UserSettings,
} from "./user-types";

/** Identificador de la app grabado en cada backup para reconocer el formato. */
export const BACKUP_APP_ID = "tenno-vault" as const;

/** Objeto de copia de seguridad serializable (envoltorio de ajustes + progreso). */
export interface Backup {
  schemaVersion: number;
  /** ISO 8601 del momento de exportación. */
  exportedAt: string;
  app: typeof BACKUP_APP_ID;
  settings: UserSettings;
  progress: ProgressRecord;
}

/** Esquema Zod del backup con la versión de esquema ACTUAL. */
export const backupSchema = z.object({
  schemaVersion: z.literal(USER_STATE_SCHEMA_VERSION),
  exportedAt: z.string(),
  app: z.literal(BACKUP_APP_ID),
  settings: userSettingsSchema,
  progress: progressRecordSchema,
});

/** Motivo tipado de fallo al parsear un backup. */
export type BackupErrorReason = "invalid-json" | "invalid-schema" | "unsupported-version";

export type ParseBackupResult =
  { ok: true; backup: Backup } | { ok: false; reason: BackupErrorReason };

/**
 * Construye el objeto de backup a partir del progreso y los ajustes actuales.
 * `now` inyectable para tests deterministas.
 */
export function createBackup(
  progress: ProgressRecord,
  settings: UserSettings,
  now: Date = new Date(),
): Backup {
  return {
    schemaVersion: USER_STATE_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    app: BACKUP_APP_ID,
    settings,
    progress,
  };
}

/** Serializa un backup a JSON legible (indentado a 2 espacios). */
export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

/** Nombre de archivo sugerido: `tenno-vault-backup-YYYY-MM-DD.json`. */
export function backupFileName(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `tenno-vault-backup-${yyyy}-${mm}-${dd}.json`;
}

/**
 * Hook de migración de backups antiguos hacia la forma de la versión actual.
 * Hoy identidad (solo existe v1). Para una migración futura, añadir un `case`
 * por versión de origen que transforme el objeto antes de caer en `default`.
 * Los backups con versión FUTURA se rechazan antes de llegar aquí.
 */
function migrateBackup(raw: unknown, version: number): unknown {
  switch (version) {
    case USER_STATE_SCHEMA_VERSION:
    default:
      return raw;
  }
}

const envelopeSchema = z.object({ schemaVersion: z.number() });

/**
 * Parsea y valida un backup desde texto crudo. Devuelve un `Result` discriminado
 * (nunca lanza). Orden: JSON → versión → migración → validación de esquema.
 */
export function parseBackup(raw: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    return { ok: false, reason: "invalid-schema" };
  }

  if (envelope.data.schemaVersion > USER_STATE_SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported-version" };
  }

  const migrated = migrateBackup(parsed, envelope.data.schemaVersion);
  const result = backupSchema.safeParse(migrated);
  if (!result.success) {
    return { ok: false, reason: "invalid-schema" };
  }

  return { ok: true, backup: result.data };
}

/** Detalle de diferencia por arma para la vista previa de importación. */
export interface WeaponDiff {
  weaponId: string;
  /** Nombre del catálogo si existe; si no, el propio id (arma huérfana). */
  weaponName: string;
  /** incoming − current de copias sin instalar. */
  copiesDelta: number;
  /** incoming − current de instalaciones. */
  installationsDelta: number;
  /** incoming − current de tiers completados (sumados). */
  completedTiersDelta: number;
}

/** Resumen del diff entre el progreso actual y el del backup entrante. */
export interface BackupDiff {
  /** Armas presentes en el backup pero no en el progreso actual. */
  added: WeaponDiff[];
  /** Armas presentes ahora pero que desaparecen tras importar. */
  removed: WeaponDiff[];
  /** Armas presentes en ambos con contenido distinto. */
  modified: WeaponDiff[];
  /** Armas presentes en ambos sin cambios. */
  unchangedCount: number;
  /**
   * Total de instalaciones del backup que NO existen en el catálogo actual
   * (variante huérfana o arma inexistente); se descartarán al importar.
   */
  orphanInstallations: number;
}

function countCompletedTiers(progress?: UserIncarnonProgress): number {
  if (!progress) return 0;
  return progress.installations.reduce(
    (acc, inst) => acc + inst.evolutionProgress.filter((ep) => ep.completed).length,
    0,
  );
}

function buildWeaponDiff(
  weaponId: string,
  weaponName: string,
  current: UserIncarnonProgress | undefined,
  incoming: UserIncarnonProgress | undefined,
): WeaponDiff {
  const currentCopies = current?.uninstalledCopies ?? 0;
  const incomingCopies = incoming?.uninstalledCopies ?? 0;
  const currentInst = current?.installations.length ?? 0;
  const incomingInst = incoming?.installations.length ?? 0;
  return {
    weaponId,
    weaponName,
    copiesDelta: incomingCopies - currentCopies,
    installationsDelta: incomingInst - currentInst,
    completedTiersDelta: countCompletedTiers(incoming) - countCompletedTiers(current),
  };
}

/**
 * Compara el progreso actual con el del backup entrante contra el catálogo real.
 * Puramente informativo (la importación reemplaza, no fusiona). Las instalaciones
 * huérfanas se cuentan con `findOrphanInstallations` contra el catálogo actual.
 */
export function diffBackup(
  current: ProgressRecord,
  incoming: ProgressRecord,
  catalog: IncarnonCatalog,
): BackupDiff {
  const nameById = new Map(catalog.weapons.map((w) => [w.id, w.name.en]));
  const weaponById = new Map(catalog.weapons.map((w) => [w.id, w]));

  const added: WeaponDiff[] = [];
  const removed: WeaponDiff[] = [];
  const modified: WeaponDiff[] = [];
  let unchangedCount = 0;

  const weaponIds = new Set([...Object.keys(current), ...Object.keys(incoming)]);

  for (const weaponId of weaponIds) {
    const currentP = current[weaponId];
    const incomingP = incoming[weaponId];
    const name = nameById.get(weaponId) ?? weaponId;

    if (incomingP && !currentP) {
      added.push(buildWeaponDiff(weaponId, name, undefined, incomingP));
      continue;
    }
    if (currentP && !incomingP) {
      removed.push(buildWeaponDiff(weaponId, name, currentP, undefined));
      continue;
    }
    // Presente en ambos.
    if (JSON.stringify(currentP) === JSON.stringify(incomingP)) {
      unchangedCount += 1;
    } else {
      modified.push(buildWeaponDiff(weaponId, name, currentP, incomingP));
    }
  }

  let orphanInstallations = 0;
  for (const [weaponId, progress] of Object.entries(incoming)) {
    const weapon = weaponById.get(weaponId);
    if (!weapon) {
      // Arma que no existe en el catálogo actual: todas sus instalaciones son huérfanas.
      orphanInstallations += progress.installations.length;
    } else {
      orphanInstallations += findOrphanInstallations(weapon, progress).length;
    }
  }

  return { added, removed, modified, unchangedCount, orphanInstallations };
}
