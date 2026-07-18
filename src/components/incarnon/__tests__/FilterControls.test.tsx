import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../lib/i18n";
import { useSettingsStore } from "../../../store/settings-store";
import { FilterControls } from "../FilterControls";
import { EMPTY_FILTERS } from "../filters";

const EXPECTED_ROTATIONS = Array.from({ length: 9 }, (_, index) => ({
  labelEs: `Semana ${index + 1} (${String.fromCharCode(65 + index)})`,
  labelEn: `Week ${index + 1} (${String.fromCharCode(65 + index)})`,
  value: String(index + 1),
}));

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ language: "es", view: "cards" });
});

describe("FilterControls", () => {
  it("muestra las nueve semanas en español sin duplicados y conserva sus valores numéricos", () => {
    const onChange = vi.fn();
    render(<FilterControls filters={EMPTY_FILTERS} onChange={onChange} />);

    const select = screen.getByRole("combobox", { name: "Semana de rotación" });
    const rotationOptions = screen.getAllByRole("option").slice(1);
    const rotationLabels = rotationOptions.map((option) => option.textContent);

    expect(rotationLabels).toEqual(EXPECTED_ROTATIONS.map(({ labelEs }) => labelEs));
    expect(rotationOptions.map((option) => option.getAttribute("value"))).toEqual(
      EXPECTED_ROTATIONS.map(({ value }) => value),
    );
    expect(rotationLabels).toHaveLength(9);
    expect(new Set(rotationLabels).size).toBe(rotationLabels.length);

    EXPECTED_ROTATIONS.forEach(({ value }, index) => {
      fireEvent.change(select, { target: { value } });
      expect(onChange).toHaveBeenNthCalledWith(index + 1, { week: index + 1 });
    });
  });

  it("mantiene el patrón número y letra al mostrar las rotaciones en inglés", async () => {
    useSettingsStore.setState({ language: "en" });

    render(
      <I18nProvider>
        <FilterControls filters={EMPTY_FILTERS} onChange={vi.fn()} />
      </I18nProvider>,
    );

    const select = (await screen.findByRole("combobox", {
      name: "Rotation week",
    })) as HTMLSelectElement;
    const rotationOptions = Array.from(select.options).slice(1);

    expect(rotationOptions.map((option) => option.textContent)).toEqual(
      EXPECTED_ROTATIONS.map(({ labelEn }) => labelEn),
    );
    expect(rotationOptions.map((option) => option.value)).toEqual(
      EXPECTED_ROTATIONS.map(({ value }) => value),
    );
  });
});
