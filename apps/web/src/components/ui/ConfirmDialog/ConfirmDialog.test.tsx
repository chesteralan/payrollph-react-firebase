import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

function setup(props?: {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}) {
  const onConfirm = vi.fn();

  render(
    <ConfirmDialog
      title={props?.title ?? "Delete item"}
      message={props?.message ?? "Are you sure?"}
      confirmText={props?.confirmText}
      cancelText={props?.cancelText}
      variant={props?.variant}
      onConfirm={onConfirm}
    >
      {(open) => (
        <button data-testid="trigger" onClick={() => act(() => open())}>
          Open
        </button>
      )}
    </ConfirmDialog>,
  );

  return { onConfirm };
}

describe("ConfirmDialog", () => {
  it("does not show dialog initially", () => {
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens dialog when trigger is clicked", () => {
    setup();
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("shows default confirm and cancel text", () => {
    setup();
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows custom confirm and cancel text", () => {
    setup({ confirmText: "Yes", cancelText: "No" });
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
  });

  it("calls onConfirm and closes when confirm is clicked", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByTestId("trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when cancel is clicked", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByTestId("trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when clicking the backdrop", () => {
    setup();
    fireEvent.click(screen.getByTestId("trigger"));
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement!.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    setup();
    fireEvent.click(screen.getByTestId("trigger"));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with warning variant", () => {
    setup({ variant: "warning" });
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Delete item")).toBeInTheDocument();
  });

  it("renders with info variant", () => {
    setup({ variant: "info" });
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Delete item")).toBeInTheDocument();
  });

  it("has correct dialog attributes", () => {
    setup();
    fireEvent.click(screen.getByTestId("trigger"));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-dialog-title");
  });
});
