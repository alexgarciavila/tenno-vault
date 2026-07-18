// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseWeaponPage, type ParseWeaponContext } from "../parse-weapon";

function fixture(name: string): string {
  return readFileSync(join(__dirname, "..", "__fixtures__", name), "utf8");
}

const bratonCtx: ParseWeaponContext = {
  weaponId: "braton",
  weaponName: "Braton",
  kind: "genesis",
  sourceUrl: "https://wiki.warframe.com/w/Braton_Incarnon_Genesis",
};

describe("parseWeaponPage — Braton (Genesis, 4 variantes)", () => {
  const page = parseWeaponPage(fixture("Braton_Incarnon_Genesis.html"), bratonCtx);

  it("no genera notas de revisión con el HTML real", () => {
    expect(page.reviewNotes).toEqual([]);
  });

  it("elige la imagen principal de mayor resolución declarada", () => {
    expect(page.image).toEqual({
      status: "found",
      candidate: {
        sourceUrl: "https://wiki.warframe.com/images/BratonIncarnonGenesis.png?cd344",
        evidence: "infobox-main-image",
      },
    });
  });

  it("extrae las 4 variantes con id, nombre y URL absoluta", () => {
    expect(page.variants.map((v) => v.id)).toEqual([
      "braton",
      "mk1-braton",
      "braton-vandal",
      "braton-prime",
    ]);
    const vandal = page.variants[2];
    expect(vandal?.name.en).toBe("Braton Vandal");
    expect(vandal?.wikiUrl).toBe("https://wiki.warframe.com/w/Braton_Vandal");
  });

  it("extrae 4 tiers con el reparto de perks 1/2/3/3", () => {
    expect(page.evolutions.map((t) => t.tier)).toEqual([1, 2, 3, 4]);
    expect(page.evolutions.map((t) => t.perks.length)).toEqual([1, 2, 3, 3]);
  });

  it("tier 1: no seleccionable, perk fijo Incarnon Form y sin condición de desbloqueo", () => {
    const tier1 = page.evolutions[0];
    expect(tier1?.selectable).toBe(false);
    expect(tier1?.unlockCondition).toBeNull();
    expect(tier1?.perks[0]?.name.en).toBe("Incarnon Form");
    expect(tier1?.perks[0]?.variantValues).toBeUndefined();
  });

  it("tier 2: condición de desbloqueo y 2 perks, con selectable true", () => {
    const tier2 = page.evolutions[1];
    expect(tier2?.unlockCondition?.en).toBe("Complete a solo mission with this weapon equipped.");
    expect(tier2?.selectable).toBe(true);
    expect(tier2?.perks.map((p) => p.name.en)).toEqual(["Daring Reverie", "Munitions Grit"]);
  });

  it('perk "Daring Reverie": id estable y variantValues normalizados para las 4 variantes', () => {
    const daring = page.evolutions[1]?.perks[0];
    expect(daring?.id).toBe("braton-e2-daring-reverie");
    expect(daring?.variantValues).toEqual({
      braton: { kind: "shared", value: "X = 24 · Y = 30" },
      "mk1-braton": { kind: "shared", value: "X = 28 · Y = 22" },
      "braton-vandal": { kind: "shared", value: "X = 12 · Y = 34" },
      "braton-prime": { kind: "shared", value: "X = 4 · Y = 38" },
    });
  });

  it("tiers 3 y 4 arrastran su desafío previo del documento", () => {
    expect(page.evolutions[2]?.unlockCondition?.en).toBe(
      "Kill 100 enemies with this weapon's Incarnon Form.",
    );
    expect(page.evolutions[3]?.unlockCondition?.en).toContain("Kill 30 enemies without reloading.");
  });
});

describe("parseWeaponPage — Lex (Genesis, 2 variantes)", () => {
  const page = parseWeaponPage(fixture("Lex_Incarnon_Genesis.html"), {
    weaponId: "lex",
    weaponName: "Lex",
    kind: "genesis",
    sourceUrl: "https://wiki.warframe.com/w/Lex_Incarnon_Genesis",
  });

  it("extrae 2 variantes y 4 tiers sin notas de revisión", () => {
    expect(page.reviewNotes).toEqual([]);
    expect(page.variants.map((v) => v.id)).toEqual(["lex", "lex-prime"]);
    expect(page.evolutions).toHaveLength(4);
  });

  it("asigna las condiciones de desbloqueo a los tiers 2–4 (tier 1 null)", () => {
    expect(page.evolutions[0]?.unlockCondition).toBeNull();
    expect(page.evolutions[1]?.unlockCondition?.en).toBe(
      "Complete a solo mission with this weapon equipped",
    );
    expect(page.evolutions[2]?.unlockCondition?.en).toBe(
      "Kill 100 enemies with this weapon's Incarnon Form",
    );
    expect(page.evolutions[3]?.unlockCondition?.en).toContain("Get 5 headshots with this weapon");
  });
});

describe("parseWeaponPage — Skana (Genesis, 3 variantes)", () => {
  const page = parseWeaponPage(fixture("Skana_Incarnon_Genesis.html"), {
    weaponId: "skana",
    weaponName: "Skana",
    kind: "genesis",
    sourceUrl: "https://wiki.warframe.com/w/Skana_Incarnon_Genesis",
  });

  it("extrae 3 variantes y 4 tiers sin notas de revisión", () => {
    expect(page.reviewNotes).toEqual([]);
    expect(page.variants.map((v) => v.id)).toEqual(["skana", "prisma-skana", "skana-prime"]);
    expect(page.evolutions.map((t) => t.tier)).toEqual([1, 2, 3, 4]);
  });

  it("asigna las condiciones de desbloqueo de los tiers 2–4", () => {
    expect(page.evolutions[1]?.unlockCondition?.en).toBe(
      "Complete a solo mission with this weapon equipped",
    );
    expect(page.evolutions[2]?.unlockCondition?.en).toBe(
      "Activate this weapon's Incarnon form 6 times in a mission",
    );
    expect(page.evolutions[3]?.unlockCondition?.en).toBe("Reach 10x Combo Multiplier 10 times");
  });
});

describe("parseWeaponPage — Phenmor (innata, 5 tiers)", () => {
  const page = parseWeaponPage(fixture("Phenmor.html"), {
    weaponId: "phenmor",
    weaponName: "Phenmor",
    kind: "innate",
    sourceUrl: "https://wiki.warframe.com/w/Phenmor",
  });

  it("no genera notas de revisión con el HTML real", () => {
    expect(page.reviewNotes).toEqual([]);
  });

  it("extrae también la imagen canónica del arma innata", () => {
    expect(page.image.status).toBe("found");
    if (page.image.status === "found") {
      expect(page.image.candidate.sourceUrl).toMatch(
        /^https:\/\/wiki\.warframe\.com\/images\/Phenmor\.png/,
      );
    }
  });

  it("modela una única variante implícita: el arma misma", () => {
    expect(page.variants).toEqual([
      {
        id: "phenmor",
        name: { en: "Phenmor" },
        wikiUrl: "https://wiki.warframe.com/w/Phenmor",
      },
    ]);
  });

  it("extrae 5 tiers y el desafío de EVO1 existe en innatas", () => {
    expect(page.evolutions.map((t) => t.tier)).toEqual([1, 2, 3, 4, 5]);
    expect(page.evolutions[0]?.unlockCondition?.en).toBe("Kill 100 enemies with the Phenmor.");
    expect(page.evolutions[0]?.selectable).toBe(false);
    expect(page.evolutions[0]?.perks[0]?.name.en).toBe("Incarnon Form");
  });

  it("los perks innatos no llevan variantValues (sin columnas de variante)", () => {
    for (const tier of page.evolutions) {
      for (const perk of tier.perks) {
        expect(perk.variantValues).toBeUndefined();
      }
    }
  });

  it("extrae la categoría primary del infobox (campo Slot)", () => {
    expect(page.infoboxCategory).toBe("primary");
  });
});

describe("parseWeaponPage — estructura inesperada", () => {
  it("HTML sin sección Evolutions → reviewNotes no vacío y sin datos", () => {
    const page = parseWeaponPage(
      "<html><body><h2>Otra cosa</h2><p>Sin evoluciones</p></body></html>",
      bratonCtx,
    );
    expect(page.evolutions).toEqual([]);
    expect(page.variants).toEqual([]);
    expect(page.reviewNotes.length).toBeGreaterThan(0);
  });

  it("distingue imagen ausente y marcado ambiguo", () => {
    const missing = parseWeaponPage("<div class='infobox'></div>", bratonCtx);
    expect(missing.image.status).toBe("missing");
    const ambiguous = parseWeaponPage(
      `<div class="infobox"><span class="main-image"><img src="/images/a.png"><img src="/images/b.png"></span></div>`,
      bratonCtx,
    );
    expect(ambiguous.image.status).toBe("ambiguous");
  });

  it("tabla mutilada (sin marcadores EVO ni variantes) → reviewNotes con los motivos", () => {
    const mutilated = `
      <html><body>
        <div class="mw-heading mw-heading3"><h3 id="Evolutions">Evolutions</h3></div>
        <table class="wikitable">
          <tbody>
            <tr><th colspan="3">Evolution</th><th>Notes</th></tr>
            <tr><td>Perk suelto</td><td>Descripción</td><td>-</td></tr>
          </tbody>
        </table>
      </body></html>`;
    const page = parseWeaponPage(mutilated, bratonCtx);
    expect(page.evolutions).toEqual([]);
    expect(page.reviewNotes.length).toBeGreaterThan(0);
    expect(page.reviewNotes.join(" ")).toContain("EVO");
  });

  it("tier sin perks (nombre vacío) → tier descartado y anotado", () => {
    const brokenTier = `
      <html><body>
        <div class="mw-heading mw-heading3"><h3 id="Evolutions">Evolutions</h3></div>
        <table class="wikitable">
          <tbody>
            <tr><th colspan="3">Evolution</th><th>Notes</th></tr>
            <tr><th>EVO1</th><td></td><td>Descripción</td><td>-</td></tr>
          </tbody>
        </table>
      </body></html>`;
    const page = parseWeaponPage(brokenTier, {
      ...bratonCtx,
      weaponId: "phenmor",
      weaponName: "Phenmor",
      kind: "innate",
      sourceUrl: "https://wiki.warframe.com/w/Phenmor",
    });
    expect(page.evolutions).toEqual([]);
    expect(page.reviewNotes.join(" ")).toContain("sin nombre");
    expect(page.reviewNotes.join(" ")).toContain("no tiene perks");
  });
});
