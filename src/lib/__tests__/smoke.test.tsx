import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function Smoke() {
  return <h1>Tenno Vault</h1>;
}

describe("entorno de tests", () => {
  it("renderiza un componente React en jsdom", () => {
    render(<Smoke />);
    expect(screen.getByRole("heading", { name: "Tenno Vault" })).toBeDefined();
  });
});
