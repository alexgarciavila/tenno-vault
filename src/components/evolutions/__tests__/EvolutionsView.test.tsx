import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../lib/i18n";
import { buildInstallation } from "../../../test-support/progress-fixtures";
import { useProgressStore } from "../../../store/progress-store";
import { useSettingsStore } from "../../../store/settings-store";
import { EvolutionsView } from "../EvolutionsView";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", window.location.pathname);
  push.mockClear();
  useProgressStore.setState({ progress: {} });
  useSettingsStore.setState({ language: "es", view: "cards" });
});

function renderView() {
  return render(
    <I18nProvider>
      <EvolutionsView />
    </I18nProvider>,
  );
}

describe("EvolutionsView — instalaciones y navegación", () => {
  it("muestra una lista plegada, la despliega por clic y ordena los tiers con romanos", async () => {
    useProgressStore.setState({
      progress: {
        braton: {
          weaponId: "braton",
          uninstalledCopies: 0,
          installations: [
            buildInstallation("braton", "braton-prime"),
            { variantId: "variante-eliminada", evolutionProgress: [] },
          ],
        },
      },
    });

    const { container } = renderView();
    const trigger = await screen.findByRole("button", { name: /Génesis Incarnon de Braton/i });
    expect(document.getElementById("titulo-braton")?.querySelector("[lang='en']")).toBeNull();
    expect(container.querySelector("#arma-braton")).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe("evo-panel-braton");
    expect(screen.queryByRole("heading", { level: 3, name: "Braton Prime" })).toBeNull();
    expect(screen.queryByText("variante-eliminada")).toBeNull();

    expect(container.textContent).toContain("PROGRESO POR ARMA · 0/4 COMPLETADAS");
    expect(screen.getByText("I", { selector: "li span[aria-hidden='true']" })).toBeDefined();
    expect(screen.getByText("IV", { selector: "li span[aria-hidden='true']" })).toBeDefined();

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("heading", { level: 3, name: "Braton Prime" })).toBeDefined();
    const tiers = screen
      .getAllByRole("heading", { level: 4 })
      .map((heading) => heading.textContent?.match(/Evolución\s+([IVX]+)/)?.[1]);
    expect(tiers).toEqual(["I", "II", "III", "IV"]);
    expect(screen.getByRole("link", { name: /Ver en la wiki/i }).className).toContain("uppercase");
  });

  it("muestra traducciones propias de Furis en ES, EN canónico y conserva el progreso", async () => {
    useProgressStore.setState({
      progress: {
        furis: {
          weaponId: "furis",
          uninstalledCopies: 0,
          installations: [buildInstallation("furis", "furis")],
        },
      },
    });

    renderView();
    const trigger = await screen.findByRole("button", { name: /Génesis Incarnon de Furis/i });
    expect(
      screen.getByText("Completa una misión en solitario con esta arma equipada."),
    ).toBeDefined();
    expect(screen.queryByText("Complete a solo mission with this weapon equipped.")).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByRole("heading", { level: 3, name: "Furis" })).toBeDefined();
    expect(
      screen.getByText(
        "Aumenta el daño base en +X. Con sobreescudos: aumenta el daño base en +30.",
      ),
    ).toBeDefined();
    expect(screen.getByText("La bonificación no se aplica a la Forma Incarnon.")).toBeDefined();
    expect(screen.queryByText("The bonus does not apply to the Incarnon form.")).toBeNull();
    const radio = screen.getByRole("radio", { name: /Incursión protectora/i });
    fireEvent.click(radio);
    const tierCheckboxes = screen.getAllByRole("checkbox");
    fireEvent.click(tierCheckboxes[1]!);

    useSettingsStore.getState().setLanguage("en");
    expect(await screen.findByRole("button", { name: /Furis Incarnon Genesis/i })).toBeDefined();
    expect(screen.getByText("Complete a solo mission with this weapon equipped.")).toBeDefined();
    expect((screen.getByRole("radio", { name: /Haven Foray/i }) as HTMLInputElement).checked).toBe(
      true,
    );
    expect((tierCheckboxes[1] as HTMLInputElement).checked).toBe(true);

    useSettingsStore.getState().setLanguage("es");
    expect(await screen.findByRole("button", { name: /Génesis Incarnon de Furis/i })).toBeDefined();
    expect(
      (screen.getByRole("radio", { name: /Incursión protectora/i }) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("no marca fallback EN al recorrer Braton con el catálogo completo actual", async () => {
    useProgressStore.setState({
      progress: {
        braton: {
          weaponId: "braton",
          uninstalledCopies: 0,
          installations: [buildInstallation("braton", "braton-prime")],
        },
      },
    });
    const { container } = renderView();
    const trigger = await screen.findByRole("button", { name: /Génesis Incarnon de Braton/i });
    fireEvent.click(trigger);
    const challengeText = screen.getAllByText(
      "Completa una misión en solitario con esta arma equipada.",
    )[0];
    expect(challengeText?.closest("[lang='en']")).toBeNull();
    const challenge = challengeText?.parentElement;
    expect(challenge?.textContent).toContain("Desafío:");
    expect(container.querySelector("[lang='en']")).toBeNull();
  });

  it("apila en la cabecera del acordeón el nombre arriba y el badge debajo a la izquierda", async () => {
    useProgressStore.setState({
      progress: {
        braton: {
          weaponId: "braton",
          uninstalledCopies: 0,
          installations: [buildInstallation("braton", "braton-prime")],
        },
      },
    });

    renderView();
    await screen.findByRole("button", { name: /Génesis Incarnon de Braton/i });
    // El título display vive en una columna (nombre arriba, badge debajo).
    const title = document.getElementById("titulo-braton");
    expect(title?.className).toContain("display-title");
    const stack = title?.parentElement;
    expect(stack?.className).toContain("flex-col");
    // El título es el primer hijo y el badge queda apilado justo debajo.
    expect(stack?.firstElementChild).toBe(title);
    expect(stack?.children.length).toBeGreaterThanOrEqual(2);
    const badge = stack?.children[1] as HTMLElement | undefined;
    expect(badge?.className).toContain("self-start");
  });

  it("abre el arma indicada por deep-link y conserva el detalle accesible", async () => {
    window.history.replaceState(null, "", "#arma-braton");
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    useProgressStore.setState({
      progress: {
        braton: {
          weaponId: "braton",
          uninstalledCopies: 0,
          installations: [buildInstallation("braton", "braton-prime")],
        },
      },
    });

    renderView();
    const trigger = await screen.findByRole("button", { name: /Génesis Incarnon de Braton/i });
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("true"));
    expect(screen.getByRole("heading", { level: 3, name: "Braton Prime" })).toBeDefined();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("ofrece CTA funcional a Incarnon cuando no hay instalaciones", async () => {
    renderView();
    const cta = await screen.findByRole("button", { name: "Ir a Incarnon" });
    fireEvent.click(cta);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/incarnon"));
  });

  it("expone una cadena compresible sin alterar fieldset, radios ni checkbox", async () => {
    useProgressStore.setState({
      progress: {
        braton: {
          weaponId: "braton",
          uninstalledCopies: 0,
          installations: [buildInstallation("braton", "braton-prime")],
        },
      },
    });

    const { container } = renderView();
    const trigger = await screen.findByRole("button", { name: /Génesis Incarnon de Braton/i });
    fireEvent.click(trigger);

    const weaponGroup = container.querySelector("#arma-braton");
    const fieldset = container.querySelector("fieldset.reflow-chain");
    const perkOption = container.querySelector("label.extreme-perk-option");
    expect(weaponGroup?.classList).toContain("reflow-chain");
    expect(weaponGroup?.classList).toContain("extreme-panel");
    expect(fieldset).not.toBeNull();
    expect(fieldset?.querySelector("legend.reflow-text")).not.toBeNull();
    expect(perkOption?.classList).toContain("reflow-chain");
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });
});
