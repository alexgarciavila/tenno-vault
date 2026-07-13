import { z } from "zod";

/**
 * Tipos y esquemas Zod del progreso del usuario.
 * Módulo compartido entre la lógica de dominio (`inventory.ts`), los stores
 * Zustand y los backups (export/import con validación).
 *
 * Cualquier cambio estructural exige bump de `USER_STATE_SCHEMA_VERSION`
 * y una migración versionada en el store persistido.
 */

export const USER_STATE_SCHEMA_VERSION = 1 as const;

export const userEvolutionProgressSchema = z.object({
  /** 1–4 en Genesis, 1–5 en innatas (debe existir en el catálogo del arma). */
  tier: z.number().int().min(1).max(5),
  completed: z.boolean(),
  /** null = sin perk elegido (o tier de perk fijo). */
  selectedPerkId: z.string().min(1).nullable(),
});

export const incarnonInstallationSchema = z.object({
  /** Id de variante del catálogo, ej. "braton-prime". */
  variantId: z.string().min(1),
  /** Una entrada por tier del catálogo del arma. */
  evolutionProgress: z.array(userEvolutionProgressSchema),
});

export const userIncarnonProgressSchema = z.object({
  /** Id del arma del catálogo, ej. "braton". */
  weaponId: z.string().min(1),
  /** Copias del adaptador sin instalar; siempre 0 en innatas. */
  uninstalledCopies: z.number().int().min(0),
  installations: z.array(incarnonInstallationSchema),
});

/** `weaponId` → progreso; forma exacta del estado persistido del store. */
export const progressRecordSchema = z.record(z.string(), userIncarnonProgressSchema);

export const userSettingsSchema = z.object({
  language: z.enum(["es", "en"]),
  view: z.enum(["cards", "table"]),
});

/**
 * Estado completo exportable/importable (backups de F6): ajustes + progreso
 * bajo una única versión de esquema.
 */
export const userStateSchema = z.object({
  schemaVersion: z.literal(USER_STATE_SCHEMA_VERSION),
  /** ISO 8601. */
  updatedAt: z.string(),
  settings: userSettingsSchema,
  progress: progressRecordSchema,
});

export type UserEvolutionProgress = z.infer<typeof userEvolutionProgressSchema>;
export type IncarnonInstallation = z.infer<typeof incarnonInstallationSchema>;
export type UserIncarnonProgress = z.infer<typeof userIncarnonProgressSchema>;
export type ProgressRecord = z.infer<typeof progressRecordSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UserState = z.infer<typeof userStateSchema>;
