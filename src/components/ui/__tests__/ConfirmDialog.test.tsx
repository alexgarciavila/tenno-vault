import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="¿Confirmar?"
      description={<p>Descripción de la acción.</p>}
      confirmLabel="Confirmar"
      cancelLabel="Cancelar"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("no renderiza nada cuando open es false", () => {
    const { onConfirm, onCancel } = { onConfirm: vi.fn(), onCancel: vi.fn() };
    render(
      <ConfirmDialog
        open={false}
        title="x"
        description="y"
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("llama a onConfirm al pulsar el botón de confirmar", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("llama a onCancel al pulsar Cancelar", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("llama a onCancel con la tecla Escape", () => {
    const { onCancel } = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("con requireCheckbox, confirmar está deshabilitado hasta marcar la casilla", () => {
    const { onConfirm } = setup({
      requireCheckbox: true,
      checkboxLabel: "Entiendo que se perderá todo",
      danger: true,
    });
    const confirmButton = screen.getByRole("button", { name: "Confirmar" });
    expect(confirmButton).toHaveProperty("disabled", true);
    fireEvent.click(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(confirmButton).toHaveProperty("disabled", false);
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("expone role dialog con aria-modal", () => {
    setup();
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});
