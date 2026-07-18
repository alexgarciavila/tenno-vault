import { describe, expect, it } from "vitest";
import { localizedTextSchema, localizedVariantValueSchema } from "./catalog-schema";

describe("contrato localizado v3", () => {
  it("exige EN no vacío y admite ES opcional no vacío", () => {
    expect(localizedTextSchema.safeParse({ en: "English", es: "Español" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ en: "English" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ en: " " }).success).toBe(false);
    expect(localizedTextSchema.safeParse({ en: "English", es: "" }).success).toBe(false);
  });

  it("distingue valores compartidos de localizables", () => {
    expect(
      localizedVariantValueSchema.safeParse({ kind: "shared", value: "X = 28%" }).success,
    ).toBe(true);
    expect(
      localizedVariantValueSchema.safeParse({ kind: "localized", text: { en: "On hit" } }).success,
    ).toBe(true);
  });
});
