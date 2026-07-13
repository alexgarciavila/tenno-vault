/**
 * Fixtures de progreso para los tests de UI, construidos a partir del catálogo
 * real (no del store) para reflejar los ejemplos A–D de cálculo de copias. No es
 * un archivo de test (no coincide con el patrón `*.test.*`).
 */
import { getWeapon } from "../data/catalog";
import type { IncarnonInstallation, UserIncarnonProgress } from "../lib/user-types";

/** Instalación con todos los tiers del arma; `completed` aplica a todos. */
export function buildInstallation(
  weaponId: string,
  variantId: string,
  completed = false,
): IncarnonInstallation {
  const weapon = getWeapon(weaponId);
  if (!weapon) throw new Error(`Arma inexistente en el catálogo: ${weaponId}`);
  return {
    variantId,
    evolutionProgress: weapon.evolutions.map((evo) => ({
      tier: evo.tier,
      completed,
      selectedPerkId: null,
    })),
  };
}

export function buildProgress(
  weaponId: string,
  uninstalledCopies: number,
  installations: IncarnonInstallation[],
): UserIncarnonProgress {
  return { weaponId, uninstalledCopies, installations };
}

/** Ejemplo A — Braton: 1 copia en Braton Prime + 1 sin instalar. */
export function bratonExampleA(): UserIncarnonProgress {
  return buildProgress("braton", 1, [buildInstallation("braton", "braton-prime")]);
}

/** Ejemplo B — Lex: ambas variantes instaladas y todos los tiers completados. */
export function lexExampleB(): UserIncarnonProgress {
  return buildProgress("lex", 0, [
    buildInstallation("lex", "lex", true),
    buildInstallation("lex", "lex-prime", true),
  ]);
}

/** Ejemplo C — Skana: 2 instaladas + 2 sin instalar (existing 4, extra 1). */
export function skanaExampleC(): UserIncarnonProgress {
  return buildProgress("skana", 2, [
    buildInstallation("skana", "skana"),
    buildInstallation("skana", "prisma-skana"),
  ]);
}
