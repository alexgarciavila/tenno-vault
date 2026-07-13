// @vitest-environment node
import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../index";

describe("parseCliArgs", () => {
  it("parsea --all", () => {
    expect(parseCliArgs(["--all"])).toEqual({ mode: "all", weaponId: null, cacheDir: null });
  });

  it("parsea --weapon <id>", () => {
    expect(parseCliArgs(["--weapon", "braton"])).toEqual({
      mode: "weapon",
      weaponId: "braton",
      cacheDir: null,
    });
  });

  it("parsea --list-only con --cache-dir", () => {
    expect(parseCliArgs(["--list-only", "--cache-dir", "tmp/html"])).toEqual({
      mode: "list-only",
      weaponId: null,
      cacheDir: "tmp/html",
    });
  });

  it("rechaza --weapon sin id, argumentos desconocidos y la falta de modo", () => {
    expect(() => parseCliArgs(["--weapon"])).toThrow("--weapon requiere");
    expect(() => parseCliArgs(["--turbo"])).toThrow("no reconocido");
    expect(() => parseCliArgs([])).toThrow("Uso:");
  });
});
