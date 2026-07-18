import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getWeapon } from "../../../data/catalog";
import {
  bratonExampleA,
  lexExampleB,
  skanaExampleC,
} from "../../../test-support/progress-fixtures";
import { WeaponCard } from "../WeaponCard";

const noop = () => {};

function normalized(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

describe("WeaponCard", () => {
  it("muestra la semana y la rotación con el formato de la wiki", () => {
    const weapon = getWeapon("braton")!;
    render(
      <WeaponCard
        weapon={weapon}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );

    expect(screen.getByText("Semana 1 (A)")).toBeDefined();
    expect(screen.queryByText("Semana 1 · A")).toBeNull();
  });

  it("mantiene la etiqueta de las armas innatas sin semana ni rotación", () => {
    const weapon = getWeapon("felarx")!;
    render(
      <WeaponCard
        weapon={weapon}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );

    expect(screen.getByText("Innata")).toBeDefined();
    expect(screen.queryByText(/Semana\s+\d/)).toBeNull();
    expect(screen.queryByText(/·\s*[A-G]/)).toBeNull();
  });

  it("reserva la región 16:9 y muestra solo la ruta local como imagen decorativa", () => {
    const weapon = getWeapon("braton")!;
    const sha256 = "a".repeat(64);
    const { container } = render(
      <WeaponCard
        weapon={{
          ...weapon,
          image: {
            localPath: `/generated/incarnon-images/braton/${sha256}.png`,
            sourceUrl: "https://wiki.warframe.com/images/Braton.png",
            contentType: "image/png",
            sha256,
          },
        }}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    const region = container.querySelector("[data-image-state]");
    const image = container.querySelector("img");
    expect(region?.className).toContain("aspect-video");
    expect(region?.className).toContain("w-full");
    expect(region?.className).toContain("min-w-0");
    expect(region?.getAttribute("aria-hidden")).toBe("true");
    expect(image?.getAttribute("alt")).toBe("");
    expect(image?.getAttribute("src")).toContain("/generated/incarnon-images/braton/");
    expect(image?.getAttribute("src")).not.toContain("wiki.warframe.com");
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("decoding")).toBe("async");
    expect(image?.className).toContain("object-contain");
    expect(container.querySelector("[data-image-state='loading']")).not.toBeNull();
  });

  it("usa el mismo fallback neutral cuando falta la imagen o falla su carga", () => {
    const weapon = getWeapon("braton")!;
    const { container, rerender } = render(
      <WeaponCard
        weapon={{ ...weapon, image: null }}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    expect(container.querySelector("[data-image-state='missing']")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();

    const sha256 = "b".repeat(64);
    rerender(
      <WeaponCard
        weapon={{
          ...weapon,
          image: {
            localPath: `/generated/incarnon-images/braton/${sha256}.png`,
            sourceUrl: "https://wiki.warframe.com/images/Braton.png",
            contentType: "image/png",
            sha256,
          },
        }}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    const image = container.querySelector("img");
    if (!image) throw new Error("No se renderizó la imagen de prueba");
    fireEvent.error(image);
    expect(container.querySelector("[data-image-state='error']")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByRole("link", { name: /Wiki/i })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Braton" })).toBeDefined();
  });

  it("ejemplo A (Braton): estado 'Instalado parcialmente' y resumen 1·1·2", () => {
    const weapon = getWeapon("braton")!;
    const { container } = render(
      <WeaponCard
        weapon={weapon}
        progress={bratonExampleA()}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    expect(screen.getByText("Instalado parcialmente")).toBeDefined();
    expect(normalized(container.textContent)).toContain("1 instalado · 1 disponible · 2 pendiente");
    expect(normalized(container.textContent)).toContain("Evoluciones · 0/4");
    expect(screen.getByRole("link", { name: /Ver en la wiki/i }).className).toContain("uppercase");
  });

  it("ejemplo B (Lex): estado 'Completado'", () => {
    const weapon = getWeapon("lex")!;
    render(
      <WeaponCard
        weapon={weapon}
        progress={lexExampleB()}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    expect(screen.getByText("Completado")).toBeDefined();
  });

  it("ejemplo C (Skana): estado 'Cubierto' con 1 copia extra", () => {
    const weapon = getWeapon("skana")!;
    const { container } = render(
      <WeaponCard
        weapon={weapon}
        progress={skanaExampleC()}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    expect(screen.getByText("Cubierto")).toBeDefined();
    expect(normalized(container.textContent)).toContain("1 copia extra");
  });

  it("instalar una variante nueva llama a onInstallVariant sin confirmación", () => {
    const weapon = getWeapon("braton")!;
    const onInstall = vi.fn();
    render(
      <WeaponCard
        weapon={weapon}
        progress={bratonExampleA()}
        onInstallVariant={onInstall}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    // Braton (base) aún no está instalada en el ejemplo A.
    fireEvent.click(screen.getByRole("checkbox", { name: "Braton" }));
    expect(onInstall).toHaveBeenCalledWith("braton");
  });

  it("desinstalar una variante SIN progreso no pide confirmación", () => {
    const weapon = getWeapon("braton")!;
    const onUninstall = vi.fn();
    // Braton Prime instalada pero sin tiers completados ni perks (ejemplo A).
    render(
      <WeaponCard
        weapon={weapon}
        progress={bratonExampleA()}
        onInstallVariant={noop}
        onUninstallVariant={onUninstall}
        onSetUninstalledCopies={noop}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Braton Prime" }));
    expect(onUninstall).toHaveBeenCalledWith("braton-prime");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("desinstalar una variante CON progreso abre ConfirmDialog", () => {
    const weapon = getWeapon("lex")!;
    const onUninstall = vi.fn();
    // Ejemplo B: Lex Prime instalada con todos los tiers completados.
    render(
      <WeaponCard
        weapon={weapon}
        progress={lexExampleB()}
        onInstallVariant={noop}
        onUninstallVariant={onUninstall}
        onSetUninstalledCopies={noop}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Lex Prime" }));
    expect(onUninstall).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("armas innatas no muestran el stepper de copias", () => {
    const weapon = getWeapon("felarx")!;
    render(
      <WeaponCard
        weapon={weapon}
        onInstallVariant={noop}
        onUninstallVariant={noop}
        onSetUninstalledCopies={noop}
      />,
    );
    expect(screen.queryByRole("button", { name: "Añadir copia" })).toBeNull();
  });

  it("expone un header con reflow intrínseco en cards reales cortas, innatas y largas", () => {
    const weapons = [getWeapon("felarx")!, getWeapon("innodem")!, getWeapon("burston")!];
    const { container, rerender } = render(<div />);

    for (const weapon of weapons) {
      rerender(
        <WeaponCard
          weapon={weapon}
          onInstallVariant={noop}
          onUninstallVariant={noop}
          onSetUninstalledCopies={noop}
        />,
      );

      const header = container.querySelector(".weapon-card__header");
      const category = container.querySelector(".weapon-card__category");
      const name = screen.getByRole("heading", { level: 2, name: weapon.name });
      expect(header).not.toBeNull();
      expect(name.classList).toContain("weapon-card__name");
      expect(header?.contains(name)).toBe(true);
      expect(category?.textContent?.trim()).not.toBe("");
      expect(header?.contains(category)).toBe(true);
    }
  });
});
