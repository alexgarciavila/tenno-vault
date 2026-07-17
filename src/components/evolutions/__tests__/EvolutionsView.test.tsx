import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../lib/i18n";
import { buildInstallation } from "../../../test-support/progress-fixtures";
import { useProgressStore } from "../../../store/progress-store";
import { EvolutionsView } from "../EvolutionsView";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  localStorage.clear();
  push.mockClear();
  useProgressStore.setState({ progress: {} });
});

function renderView() {
  return render(
    <I18nProvider>
      <EvolutionsView />
    </I18nProvider>,
  );
}

describe("EvolutionsView — instalaciones y navegación", () => {
  it("muestra solo instalaciones válidas, conserva el deep-link y ordena los tiers", async () => {
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
    expect(
      await screen.findByRole("heading", { level: 2, name: "Braton Incarnon Genesis" }),
    ).toBeDefined();
    expect(container.querySelector("#arma-braton")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "Braton Prime" })).toBeDefined();
    expect(screen.queryByText("variante-eliminada")).toBeNull();

    const tiers = screen
      .getAllByRole("heading", { level: 4 })
      .map((heading) => Number(heading.textContent?.match(/\d+/)?.[0]));
    expect(tiers).toEqual([1, 2, 3, 4]);
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
    await screen.findByRole("heading", { level: 2, name: "Braton Incarnon Genesis" });

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
