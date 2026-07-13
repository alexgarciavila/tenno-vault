// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  absoluteWikiUrl,
  cleanText,
  decodeEntities,
  joinValueLines,
  perkId,
  slugify,
  stripGenesisSuffix,
  weaponIdFromName,
} from "../normalize";

describe("normalize", () => {
  it("decodifica entidades HTML habituales y numéricas", () => {
    expect(decodeEntities("Ack &amp; Brunt")).toBe("Ack & Brunt");
    expect(decodeEntities("&quot;X&quot; &#39;Y&#39; &#x26;")).toBe("\"X\" 'Y' &");
  });

  it("colapsa espacios y recorta con cleanText", () => {
    expect(cleanText("  Braton \n  Prime\t")).toBe("Braton Prime");
  });

  it("genera slugs kebab-case con las reglas del proyecto", () => {
    expect(slugify("Braton Prime")).toBe("braton-prime");
    expect(slugify("Mk1-Braton")).toBe("mk1-braton");
    expect(slugify("Ack & Brunt")).toBe("ack-and-brunt");
    expect(slugify("Void's Guidance")).toBe("voids-guidance");
  });

  it("deriva el id del arma desde el nombre canónico", () => {
    expect(stripGenesisSuffix("Braton Incarnon Genesis")).toBe("Braton");
    expect(weaponIdFromName("Ack &amp; Brunt Incarnon Genesis")).toBe("ack-and-brunt");
    expect(weaponIdFromName("Phenmor")).toBe("phenmor");
  });

  it("construye ids de perk estables", () => {
    expect(perkId("braton", 2, "Daring Reverie")).toBe("braton-e2-daring-reverie");
  });

  it("convierte href relativos en URLs absolutas de la wiki", () => {
    expect(absoluteWikiUrl("/w/Braton_Prime")).toBe("https://wiki.warframe.com/w/Braton_Prime");
    expect(absoluteWikiUrl("https://example.com/x")).toBe("https://example.com/x");
  });

  it("une líneas de valores con separador medio", () => {
    expect(joinValueLines(["X = 24", "Y = 30"])).toBe("X = 24 · Y = 30");
    expect(joinValueLines(["-"])).toBe("-");
    expect(joinValueLines([])).toBe("");
  });
});
