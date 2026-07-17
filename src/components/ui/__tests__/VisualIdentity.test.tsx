import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "../BrandMark";
import { EditorialPageHeader } from "../EditorialPageHeader";

describe("identidad visual", () => {
  it("mantiene un único heading de página y muestra el subtítulo editorial", () => {
    render(<EditorialPageHeader title="Incarnon" subtitle="Adaptadores · Rotación" />);

    expect(screen.getByRole("heading", { level: 1, name: "Incarnon" })).toBeDefined();
    expect(screen.getByText("Adaptadores · Rotación")).toBeDefined();
  });

  it("aplica la guardia de reflow al título y subtítulo compartidos", () => {
    render(
      <EditorialPageHeader
        title="CONFIGURACIÓNEXTRAORDINARIAMENTELARGA"
        subtitle="Exceptionallylongeditorialsubtitlewithoutspaces"
      />,
    );

    expect(screen.getByRole("banner").classList).toContain("editorial-page-header");
    expect(screen.getByRole("heading", { level: 1 }).classList).toContain(
      "editorial-page-header__copy",
    );
    expect(screen.getByText("Exceptionallylongeditorialsubtitlewithoutspaces").classList).toContain(
      "editorial-page-header__copy",
    );
  });

  it("trata el monograma como decoración para no duplicar el nombre accesible", () => {
    const { container } = render(<BrandMark />);

    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
