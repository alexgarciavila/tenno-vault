import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../lib/i18n";
import { AppShell } from "../AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/incarnon",
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderShell() {
  return render(
    <I18nProvider>
      <AppShell>
        <h1>Incarnon</h1>
      </AppShell>
    </I18nProvider>,
  );
}

describe("AppShell — navegación y landmarks", () => {
  it("conserva el salto al contenido, un main identificable y un único h1 de pantalla", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Saltar al contenido" }).getAttribute("href")).toBe(
      "#contenido-principal",
    );
    const main = screen.getByRole("main");
    expect(main.getAttribute("id")).toBe("contenido-principal");
    expect(main.className).toContain("w-full");
    expect(main.className).not.toMatch(/max-w-|mx-auto/);
    expect(main.className).toContain("pb-[var(--mobile-bottom-nav-clearance)]");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("expone los cinco destinos y marca Incarnon semánticamente como ruta activa", () => {
    renderShell();

    const primaryNavs = screen.getAllByRole("navigation", { name: "Navegación principal" });
    const desktopNav = primaryNavs.find((nav) =>
      within(nav).queryByRole("link", { name: "Acerca de" }),
    );
    expect(desktopNav).toBeDefined();

    const expectedDestinations = ["/", "/incarnon", "/evoluciones", "/configuracion", "/acerca-de"];
    const hrefs = within(desktopNav!)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(expectedDestinations);
    expect(
      within(desktopNav!).getByRole("link", { name: "Incarnon" }).getAttribute("aria-current"),
    ).toBe("page");

    const moreButton = screen.getByRole("button", { name: "Más" });
    fireEvent.click(moreButton);
    const sheet = screen.getByRole("dialog", { name: "Más" });
    expect(within(sheet).getByRole("link", { name: "Configuración" })).toBeDefined();
    expect(within(sheet).getByRole("link", { name: "Acerca de" })).toBeDefined();
  });
});
