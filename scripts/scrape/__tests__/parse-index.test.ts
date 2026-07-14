// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseIndex } from "../parse-index";

const html = readFileSync(join(__dirname, "..", "__fixtures__", "Incarnon.html"), "utf8");
const index = parseIndex(html);

describe("parseIndex — checklist", () => {
  it("no genera notas de revisión con el HTML real", () => {
    expect(index.reviewNotes).toEqual([]);
  });

  it("devuelve las 8 armas innatas sin categoría (se resuelve en su página)", () => {
    const innate = index.weapons.filter((w) => w.kind === "innate");
    expect(innate).toHaveLength(8);
    expect(innate.map((w) => w.name).sort()).toEqual([
      "Felarx",
      "Innodem",
      "Laetum",
      "Onos",
      "Phenmor",
      "Praedos",
      "Ruvox",
      "Thalys",
    ]);
    expect(innate.every((w) => w.category === null)).toBe(true);
  });

  it("devuelve 15 Genesis primary, 16 secondary y 14 melee", () => {
    const genesis = index.weapons.filter((w) => w.kind === "genesis");
    expect(genesis.filter((w) => w.category === "primary")).toHaveLength(15);
    expect(genesis.filter((w) => w.category === "secondary")).toHaveLength(16);
    expect(genesis.filter((w) => w.category === "melee")).toHaveLength(14);
    expect(genesis).toHaveLength(45);
  });

  it("decodifica entidades HTML en el nombre canónico (Ack & Brunt)", () => {
    const ack = index.weapons.find((w) => w.id === "ack-and-brunt");
    expect(ack).toBeDefined();
    expect(ack?.name).toBe("Ack & Brunt Incarnon Genesis");
    expect(ack?.category).toBe("melee");
  });

  it("genera URLs absolutas de la wiki", () => {
    const braton = index.weapons.find((w) => w.id === "braton");
    expect(braton?.url).toBe("https://wiki.warframe.com/w/Braton_Incarnon_Genesis");
  });

  it("no convierte enlaces absolutos externos del HTML en destinos descargables", () => {
    const malicious = `
      <div class="mw-heading"><h2 id="Incarnon_Weapons_Obtained"></h2></div>
      <p><span class="tooltip" data-param-name="Felarx"><a href="https://127.0.0.1/latest/meta-data/iam/security-credentials/">Felarx</a></span></p>
      <div class="mw-heading"><h2 id="next"></h2></div>
    `;
    expect(() => parseIndex(malicious)).toThrow("página no permitida");
  });
});

describe("parseIndex — rotación de The Circuit", () => {
  it("cubre 9 semanas A–I con 5 adaptadores por semana (45 en total)", () => {
    const entries = Object.values(index.rotation);
    expect(entries).toHaveLength(45);

    const letters = [...new Set(entries.map((e) => e.letter))].sort();
    expect(letters).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);

    for (let week = 1; week <= 9; week++) {
      expect(entries.filter((e) => e.week === week)).toHaveLength(5);
    }
  });

  it("asigna braton a la semana 1 (A) y lex a la semana 4 (D)", () => {
    expect(index.rotation["braton"]).toEqual({ week: 1, letter: "A" });
    expect(index.rotation["lex"]).toEqual({ week: 4, letter: "D" });
  });

  it("las armas innatas no tienen rotación", () => {
    for (const id of ["phenmor", "felarx", "laetum"]) {
      expect(index.rotation[id]).toBeUndefined();
    }
  });
});
