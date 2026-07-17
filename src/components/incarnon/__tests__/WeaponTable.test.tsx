import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWeapon } from "../../../data/catalog";
import { I18nProvider } from "../../../lib/i18n";
import { bratonExampleA } from "../../../test-support/progress-fixtures";
import { WeaponTable } from "../WeaponTable";

describe("WeaponTable — regresión estructural", () => {
  it("mantiene región de scroll enfocables, tabla y encabezados semánticos", () => {
    const weapon = getWeapon("braton")!;
    render(
      <I18nProvider>
        <WeaponTable
          weapons={[weapon]}
          progressRecord={{ braton: bratonExampleA() }}
          onSetUninstalledCopies={vi.fn()}
        />
      </I18nProvider>,
    );

    const region = screen.getByRole("region", { name: "Tabla de Incarnon" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(within(region).getByRole("table")).toBeDefined();
    expect(within(region).getAllByRole("columnheader")).toHaveLength(7);
    expect(within(region).getByRole("rowheader", { name: weapon.name })).toBeDefined();
    expect(screen.getByText("Desplaza horizontalmente para ver todas las columnas.")).toBeDefined();
  });

  it("preserva acciones y enlace de fuente sin usar la imagen remota del catálogo", () => {
    const weapon = getWeapon("braton")!;
    const onSetCopies = vi.fn();
    render(
      <I18nProvider>
        <WeaponTable
          weapons={[weapon]}
          progressRecord={{ braton: bratonExampleA() }}
          onSetUninstalledCopies={onSetCopies}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: "Añadir copia" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Quitar copia" })).toBeDefined();
    expect(screen.getByRole("link", { name: /Wiki/i }).getAttribute("href")).toBe(weapon.sourceUrl);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
