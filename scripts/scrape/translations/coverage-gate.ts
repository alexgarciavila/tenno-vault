import type { TranslationCoverage } from "./coverage";

export const RELEASE_TRANSLATED_FIELDS = 1594;
export const RELEASE_WEAPON_COUNT = 53;

/** Gate único del catálogo de entrega v3: cobertura completa global y por arma. */
export function assertCompleteTranslationCoverage(coverage: TranslationCoverage): void {
  const totalApplicable = coverage.translated + coverage.missing;
  const weaponEntries = Object.entries(coverage.byWeapon);
  const incompleteWeapons = weaponEntries
    .filter(([, weapon]) => {
      const weaponApplicable = weapon.translated + weapon.missing;
      return (
        weapon.missing > 0 || weapon.translated !== weaponApplicable || weapon.percentage !== 100
      );
    })
    .map(
      ([id, weapon]) =>
        `${id} (${weapon.translated}/${weapon.translated + weapon.missing}, ${weapon.percentage}%)`,
    );

  const releaseBaselineMismatch =
    totalApplicable !== RELEASE_TRANSLATED_FIELDS ||
    coverage.translated !== RELEASE_TRANSLATED_FIELDS ||
    weaponEntries.length !== RELEASE_WEAPON_COUNT;
  if (
    coverage.missing > 0 ||
    coverage.translated !== totalApplicable ||
    coverage.percentage !== 100 ||
    incompleteWeapons.length > 0 ||
    releaseBaselineMismatch
  ) {
    throw new Error(
      `BLOCKED: cobertura ES incompleta: global ${coverage.translated}/${totalApplicable} (${coverage.percentage}%), missing=${coverage.missing}; armas ${weaponEntries.length}/${RELEASE_WEAPON_COUNT}; armas incompletas: ${incompleteWeapons.join(", ") || "ninguna"}. Se exige ${RELEASE_TRANSLATED_FIELDS}/${RELEASE_TRANSLATED_FIELDS}.`,
    );
  }
}
