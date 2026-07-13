import { describe, expect, it } from "vitest";
import { isActivePath } from "../nav-items";

describe("isActivePath", () => {
  it("marca inicio solo en la raíz", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/", "/incarnon")).toBe(false);
  });

  it("marca la ruta activa sin barra final", () => {
    expect(isActivePath("/incarnon", "/incarnon")).toBe(true);
    expect(isActivePath("/evoluciones", "/evoluciones")).toBe(true);
  });

  it("tolera la barra final que añade trailingSlash: true", () => {
    expect(isActivePath("/incarnon", "/incarnon/")).toBe(true);
    expect(isActivePath("/evoluciones", "/evoluciones/")).toBe(true);
    expect(isActivePath("/configuracion", "/configuracion/")).toBe(true);
    expect(isActivePath("/acerca-de", "/acerca-de/")).toBe(true);
  });

  it("marca subrutas por prefijo", () => {
    expect(isActivePath("/incarnon", "/incarnon/detalle/")).toBe(true);
  });

  it("no marca rutas que solo comparten prefijo textual", () => {
    expect(isActivePath("/incarnon", "/incarnon-extra")).toBe(false);
    expect(isActivePath("/incarnon", "/evoluciones/")).toBe(false);
  });
});
