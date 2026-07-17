import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CopyStepper } from "../CopyStepper";

describe("CopyStepper — contrato de reflow extremo", () => {
  it("conserva orden DOM, nombres accesibles, valor live y targets de 44 px", () => {
    const { container } = render(
      <CopyStepper
        value={7}
        label="Copias sin instalar con una etiqueta larga"
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />,
    );

    const root = container.querySelector(".copy-stepper");
    const controls = container.querySelector(".copy-stepper__controls");
    const decrement = screen.getByRole("button", { name: "Quitar copia" });
    const increment = screen.getByRole("button", { name: "Añadir copia" });
    const value = container.querySelector(".copy-stepper__value");

    expect(root).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(decrement.classList).toContain("size-11");
    expect(increment.classList).toContain("size-11");
    expect(value?.getAttribute("aria-live")).toBe("polite");
    expect(value?.textContent).toBe("7");
    expect(Array.from(controls?.children ?? [])).toEqual([decrement, value, increment]);
  });
});
