import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutView } from "../AboutView";

describe("AboutView", () => {
  it("aplica wrapping seguro al contenido legal que incluye dominios visibles", () => {
    const { container } = render(<AboutView />);

    const legalCopy = container.querySelector(".legal-copy");
    expect(legalCopy).not.toBeNull();
    expect(legalCopy?.textContent).toContain("wiki.warframe.com");

    for (const link of screen.getAllByRole("link")) {
      expect(link.classList).toContain("external-link");
      expect(link.querySelector(".external-link__label")).not.toBeNull();
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });
});
