// @vitest-environment node
import { describe, expect, it } from "vitest";

import catalogJson from "../../../src/data/incarnon-catalog.json";
import type { IncarnonCatalog, IncarnonWeapon } from "../../../src/data/catalog-schema";
import { readCatalogForGeneration } from "../catalog-compat";
import { blockingIdentityIssues, identityIssues, reconcilePerkIds } from "../identity";
import { perkId } from "../normalize";

function catalog(): IncarnonCatalog {
  return structuredClone(readCatalogForGeneration(catalogJson));
}

function weapon(source: IncarnonCatalog, id = "phenmor"): IncarnonWeapon {
  return structuredClone(source.weapons.find((item) => item.id === id)!);
}

describe("política de identidad canónica", () => {
  it("reconcilia IDs sin depender del groupBy incorporado en Map", () => {
    const groupByDescriptor = Object.getOwnPropertyDescriptor(Map, "groupBy");
    Reflect.deleteProperty(Map, "groupBy");

    try {
      expect(Reflect.has(Map, "groupBy")).toBe(false);
      const previous = weapon(catalog());
      const candidate = structuredClone(previous);
      candidate.evolutions[1]!.perks[0]!.id = "id-temporal";

      expect(reconcilePerkIds(previous, candidate)).toEqual([]);
      expect(candidate.evolutions[1]!.perks[0]!.id).toBe(previous.evolutions[1]!.perks[0]!.id);
    } finally {
      if (groupByDescriptor) Object.defineProperty(Map, "groupBy", groupByDescriptor);
    }
  });

  it("permite y traza un arma nueva con IDs seguros y únicos", () => {
    const previous = catalog();
    const added = weapon(previous);
    added.id = "new-weapon";
    added.name.en = "New Weapon";
    added.weaponName.en = "New Weapon";
    for (const variant of added.variants) variant.id = "new-weapon";
    for (const tier of added.evolutions) {
      for (const perk of tier.perks) perk.id = perkId(added.id, tier.tier, perk.name.en);
    }
    const candidate = structuredClone(previous);
    candidate.weapons.push(added);

    const changes = identityIssues(previous, candidate);

    expect(changes).toContain("added:weapon:new-weapon");
    expect(blockingIdentityIssues(changes)).toEqual([]);
  });

  it("permite un perk nuevo inequívoco y conserva los IDs canónicos previos", () => {
    const previousCatalog = catalog();
    const previous = weapon(previousCatalog);
    const candidate = structuredClone(previous);
    const tier = candidate.evolutions[1]!;
    const added = structuredClone(tier.perks[0]!);
    added.name = { en: "Brand New Perk" };
    added.id = perkId(candidate.id, tier.tier, added.name.en);
    tier.perks.push(added);

    expect(reconcilePerkIds(previous, candidate)).toEqual([]);

    const changes = identityIssues({ weapons: [previous] }, { weapons: [candidate] });
    expect(changes).toContain(`added:perk:${candidate.id}:${tier.tier}:${added.id}`);
    expect(blockingIdentityIssues(changes)).toEqual([]);
  });

  it("bloquea una colisión de perk", () => {
    const previous = weapon(catalog());
    const candidate = structuredClone(previous);
    candidate.evolutions[1]!.perks.push(structuredClone(candidate.evolutions[1]!.perks[0]!));

    expect(reconcilePerkIds(previous, candidate)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("coincidencia-ambigua"),
        expect.stringContaining("colision-perk-id"),
      ]),
    );
    expect(
      blockingIdentityIssues(identityIssues({ weapons: [previous] }, { weapons: [candidate] })),
    ).toEqual(expect.arrayContaining([expect.stringContaining("collision:perk:")]));
  });

  it("bloquea altas con IDs inseguros aunque también estén trazadas como added", () => {
    const previous = catalog();
    const candidate = structuredClone(previous);
    const added = weapon(previous);
    added.id = "new-weapon";
    added.name.en = "New Weapon";
    added.weaponName.en = "New Weapon";
    added.variants[0]!.id = "Unsafe Variant";
    for (const tier of added.evolutions) {
      for (const perk of tier.perks) perk.id = perkId(added.id, tier.tier, perk.name.en);
    }
    added.evolutions[1]!.perks[0]!.id = "unsafe perk id";
    candidate.weapons.push(added);

    const changes = identityIssues(previous, candidate);

    expect(changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("added:"),
        expect.stringContaining("unsafe:variant:"),
        expect.stringContaining("unsafe:perk:"),
      ]),
    );
    expect(blockingIdentityIssues(changes)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unsafe:variant:"),
        expect.stringContaining("unsafe:perk:"),
      ]),
    );
  });

  it("bloquea un alta de perk ambigua", () => {
    const previous = weapon(catalog());
    const candidate = structuredClone(previous);
    const tier = candidate.evolutions[1]!;
    const first = structuredClone(tier.perks[0]!);
    first.name = { en: "Ambiguous New Perk" };
    first.id = perkId(candidate.id, tier.tier, first.name.en);
    tier.perks.push(first, structuredClone(first));

    expect(reconcilePerkIds(previous, candidate)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("alta-ambigua"),
        expect.stringContaining("colision-perk-id"),
      ]),
    );
    expect(
      blockingIdentityIssues(identityIssues({ weapons: [previous] }, { weapons: [candidate] })),
    ).toEqual(expect.arrayContaining([expect.stringContaining("collision:perk:")]));
  });

  it("bloquea la eliminación de un perk existente", () => {
    const previous = weapon(catalog());
    const candidate = structuredClone(previous);
    const removed = candidate.evolutions[1]!.perks.pop()!;

    expect(reconcilePerkIds(previous, candidate)).toEqual(
      expect.arrayContaining([expect.stringContaining("perk-previo-ausente")]),
    );
    expect(
      blockingIdentityIssues(identityIssues({ weapons: [previous] }, { weapons: [candidate] })),
    ).toContain(`missing:perk:${candidate.id}:2:${removed.id}`);
  });

  it("bloquea un renombre no autorizado en vez de aceptarlo como alta", () => {
    const previous = weapon(catalog());
    const candidate = structuredClone(previous);
    const renamed = candidate.evolutions[1]!.perks[0]!;
    const oldId = renamed.id;
    renamed.name.en = `${renamed.name.en} Renamed`;
    renamed.id = perkId(candidate.id, 2, renamed.name.en);

    expect(reconcilePerkIds(previous, candidate)).toEqual(
      expect.arrayContaining([expect.stringContaining("perk-previo-ausente")]),
    );
    expect(
      blockingIdentityIssues(identityIssues({ weapons: [previous] }, { weapons: [candidate] })),
    ).toContain(`missing:perk:${candidate.id}:2:${oldId}`);
  });
});
