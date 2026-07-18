import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWeapon } from "../../../data/catalog";
import { I18nProvider } from "../../../lib/i18n";
import { bratonExampleA } from "../../../test-support/progress-fixtures";
import { WeaponTable } from "../WeaponTable";

describe("WeaponTable — regresión estructural", () => {
  it("muestra la semana y la rotación con el formato de la wiki", () => {
    const weapon = getWeapon("braton")!;
    render(
      <I18nProvider>
        <WeaponTable
          weapons={[weapon]}
          progressRecord={{}}
          onSetUninstalledCopies={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("1 (A)")).toBeDefined();
    expect(screen.queryByText("1 · A")).toBeNull();
  });

  it("mantiene las armas innatas sin semana, rotación ni control de copias", () => {
    const weapon = getWeapon("felarx")!;
    render(
      <I18nProvider>
        <WeaponTable
          weapons={[weapon]}
          progressRecord={{}}
          onSetUninstalledCopies={vi.fn()}
        />
      </I18nProvider>,
    );

    const row = screen.getByRole("row", { name: /Felarx/ });
    expect(within(row).getByText("—")).toBeDefined();
    expect(within(row).queryByText(/\d+\s*[·()]\s*[A-G]/)).toBeNull();
    expect(within(row).queryByRole("button", { name: "Añadir copia" })).toBeNull();
    expect(within(row).queryByRole("button", { name: "Quitar copia" })).toBeNull();
  });

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

  it("da ancho explícito al stepper y no impone min-w global en la tabla", () => {
    const weapon = getWeapon("braton")!;
    const { container } = render(
      <I18nProvider>
        <WeaponTable
          weapons={[weapon]}
          progressRecord={{ braton: bratonExampleA() }}
          onSetUninstalledCopies={vi.fn()}
        />
      </I18nProvider>,
    );

    // La tabla no fuerza un ancho mínimo global.
    const table = container.querySelector("table");
    expect(table?.className).toContain("w-full");
    expect(table?.className).not.toContain("min-w-[57.5rem]");

    // Envoltorio con ancho explícito para el stepper (container-type: inline-size
    // computa ancho intrínseco 0; w-32 lo fija y evita el container query).
    const stepperWrapper = container.querySelector(".copy-stepper")?.parentElement;
    expect(stepperWrapper?.classList).toContain("w-32");
    expect(stepperWrapper?.classList).toContain("shrink-0");
  });

  it("aplica patrón apilado (stacked) por debajo de xl, sin ocultar datos ni scroll", () => {
    const weapon = getWeapon("braton")!;
    const { container } = render(
      <I18nProvider>
        <WeaponTable
          weapons={[weapon]}
          progressRecord={{ braton: bratonExampleA() }}
          onSetUninstalledCopies={vi.fn()}
        />
      </I18nProvider>,
    );

    // Contenedor: overflow-x solo como red de seguridad, sin acotar alto.
    const region = screen.getByRole("region", { name: "Tabla de Incarnon" });
    expect(region.className).toContain("overflow-x-auto");
    expect(region.className).not.toContain("overflow-y-auto");
    expect(region.className).not.toContain("max-h-");

    // La tabla se apila (block) por defecto y vuelve a table en xl.
    const table = container.querySelector("table");
    expect(table?.className).toContain("block");
    expect(table?.className).toContain("xl:table");

    // El thead se oculta en modo apilado y reaparece en xl.
    const thead = container.querySelector("thead");
    expect(thead?.classList).toContain("hidden");
    expect(thead?.classList).toContain("xl:table-header-group");

    // Las filas son grid apilado hasta xl, donde vuelven a table-row.
    const row = container.querySelector("tbody tr");
    expect(row?.classList).toContain("grid");
    expect(row?.classList).toContain("xl:table-row");

    // Ninguna columna se oculta: no hay clases hidden <bp>:table-cell en celdas.
    for (const cell of Array.from(container.querySelectorAll("tbody td"))) {
      expect(cell.className).not.toContain("hidden");
    }

    // Cada dato lleva su etiqueta visible solo en modo apilado (xl:hidden).
    const categoryLabel = screen.getAllByText("Categoría", { selector: "span" })[0]!;
    expect(categoryLabel.classList).toContain("xl:hidden");
    // Todos los campos siguen presentes (info nunca oculta).
    expect(screen.getByText(weapon.name)).toBeDefined();
    expect(screen.getByText("Semana", { selector: "span" })).toBeDefined();
    expect(screen.getByText("Evoluciones", { selector: "span" })).toBeDefined();
  });
});
