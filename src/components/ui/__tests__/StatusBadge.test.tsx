import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("muestra el texto de cada estado (nunca solo color)", () => {
    render(<StatusBadge status="available" />);
    expect(screen.getByText("Disponible")).toBeDefined();
  });

  it("apila el badge 'Datos incompletos' sin sustituir al estado", () => {
    render(<StatusBadge status="partially-installed" hasIncompleteData />);
    expect(screen.getByText("Instalado parcialmente")).toBeDefined();
    expect(screen.getByText("Datos incompletos")).toBeDefined();
  });

  it("no muestra el badge de datos incompletos si la bandera es false", () => {
    render(<StatusBadge status="completed" hasIncompleteData={false} />);
    expect(screen.queryByText("Datos incompletos")).toBeNull();
  });
});
