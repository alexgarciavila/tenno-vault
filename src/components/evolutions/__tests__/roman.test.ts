import { describe, expect, it } from "vitest";
import { toRoman } from "../roman";

describe("toRoman", () => {
  it("convierte los tiers I–V del prototipo", () => {
    expect([1, 2, 3, 4, 5].map(toRoman)).toEqual(["I", "II", "III", "IV", "V"]);
  });
});
