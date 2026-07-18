import type { IncarnonCatalog, IncarnonWeapon } from "../../src/data/catalog-schema";
import { perkId } from "./normalize";

const SAFE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function catalogIdentityFingerprint(catalog: Pick<IncarnonCatalog, "weapons">): string[] {
  return catalog.weapons
    .flatMap((weapon) => [
      `weapon:${weapon.id}`,
      ...weapon.variants.map((variant) => `variant:${weapon.id}:${variant.id}`),
      ...weapon.evolutions.flatMap((tier) => [
        `tier:${weapon.id}:${tier.tier}`,
        ...tier.perks.map((perk) => `perk:${weapon.id}:${tier.tier}:${perk.id}`),
      ]),
    ])
    .sort();
}

export function identityIssues(
  previous: Pick<IncarnonCatalog, "weapons">,
  candidate: Pick<IncarnonCatalog, "weapons">,
): string[] {
  const before = catalogIdentityFingerprint(previous);
  const after = catalogIdentityFingerprint(candidate);
  if (before.length === after.length && before.every((value, index) => value === after[index])) {
    return [];
  }
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const duplicateIdentities = after.filter((value, index) => after.indexOf(value) !== index);
  const additions = after.filter((value) => !beforeSet.has(value));
  const unsafeAdditions = candidate.weapons.flatMap((weapon) => {
    const issues: string[] = [];
    if (!beforeSet.has(`weapon:${weapon.id}`) && !SAFE_ID_PATTERN.test(weapon.id)) {
      issues.push(`unsafe:weapon:${weapon.id}`);
    }
    for (const variant of weapon.variants) {
      const identity = `variant:${weapon.id}:${variant.id}`;
      if (!beforeSet.has(identity) && !SAFE_ID_PATTERN.test(variant.id))
        issues.push(`unsafe:${identity}`);
    }
    for (const tier of weapon.evolutions) {
      for (const perk of tier.perks) {
        const identity = `perk:${weapon.id}:${tier.tier}:${perk.id}`;
        if (
          !beforeSet.has(identity) &&
          (!SAFE_ID_PATTERN.test(perk.id) || perk.id !== perkId(weapon.id, tier.tier, perk.name.en))
        ) {
          issues.push(`unsafe:${identity}`);
        }
      }
    }
    return issues;
  });
  return [
    ...before.filter((value) => !afterSet.has(value)).map((value) => `missing:${value}`),
    ...additions.map((value) => `added:${value}`),
    ...new Set(duplicateIdentities.map((value) => `collision:${value}`)),
    ...unsafeAdditions,
  ];
}

/** Las altas seguras quedan trazadas como `added:*`, pero no bloquean la publicación. */
export function blockingIdentityIssues(issues: readonly string[]): string[] {
  return issues.filter((issue) => !issue.startsWith("added:"));
}

function normalizedEnglish(value: string): string {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

function groupByNormalizedEnglish<T extends { name: { en: string } }>(
  items: readonly T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const name = normalizedEnglish(item.name.en);
    const group = grouped.get(name);
    if (group) {
      group.push(item);
    } else {
      grouped.set(name, [item]);
    }
  }
  return grouped;
}

/** Reutiliza IDs previos solo para coincidencias EN inequívocas. */
export function reconcilePerkIds(previous: IncarnonWeapon, candidate: IncarnonWeapon): string[] {
  const issues: string[] = [];
  for (const tier of candidate.evolutions) {
    const previousTier = previous.evolutions.find((item) => item.tier === tier.tier);
    if (!previousTier) continue;

    const previousByName = groupByNormalizedEnglish(previousTier.perks);
    const candidateByName = groupByNormalizedEnglish(tier.perks);

    for (const [name, previousPerks] of previousByName) {
      const candidatePerks = candidateByName.get(name) ?? [];
      if (previousPerks.length !== 1 || candidatePerks.length > 1) {
        issues.push(
          `${candidate.id}:e${tier.tier}:${name}:coincidencia-ambigua=${previousPerks.length}/${candidatePerks.length}`,
        );
        continue;
      }
      if (candidatePerks.length === 0) {
        issues.push(
          `${candidate.id}:e${tier.tier}:${previousPerks[0]!.name.en}:perk-previo-ausente`,
        );
        continue;
      }
      candidatePerks[0]!.id = previousPerks[0]!.id;
    }

    for (const [name, candidatePerks] of candidateByName) {
      if (previousByName.has(name)) continue;
      if (candidatePerks.length !== 1) {
        issues.push(`${candidate.id}:e${tier.tier}:${name}:alta-ambigua=${candidatePerks.length}`);
        continue;
      }
      const perk = candidatePerks[0]!;
      const proposedId = perkId(candidate.id, tier.tier, perk.name.en);
      if (!SAFE_ID_PATTERN.test(perk.id) || perk.id !== proposedId) {
        issues.push(`${candidate.id}:e${tier.tier}:${perk.name.en}:id-alta-inseguro=${perk.id}`);
      }
    }
  }

  const ids = candidate.evolutions.flatMap((tier) => tier.perks.map((perk) => perk.id));
  for (const id of new Set(ids.filter((value, index) => ids.indexOf(value) !== index))) {
    issues.push(`${candidate.id}:colision-perk-id=${id}`);
  }
  return issues;
}
