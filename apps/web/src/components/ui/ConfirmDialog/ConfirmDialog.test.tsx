import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    title: "Confirm Deletion",
    message: "Are you sure you want to delete this item?",
    onConfirm: vi.fn(),
    children: (open: () => void) => <button onClick={open}>Open Dialog</button>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the trigger button via children prop", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Open Dialog")).toBeInTheDocument();
  });

  it("should open dialog when trigger is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this item?"),
    ).toBeInTheDocument();
  });

  it("should show confirm and cancel buttons with default text", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should show custom button text when provided", () => {
    render(
      <ConfirmDialog {...defaultProps} confirmText="Yes" cancelText="No" />,
    );
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("should call onConfirm when Confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("Open Dialog"));
    fireEvent.click(screen.getByText("Confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should close dialog after confirming", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));
    fireEvent.click(screen.getByText("Confirm"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close dialog when Cancel button is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close dialog when backdrop is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));

    const backdrop = document.querySelector(".fixed.inset-0.bg-black\\/50");
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should close dialog when Escape key is pressed", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not call onConfirm when cancelled", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("Open Dialog"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("should render with danger variant by default", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should render with warning variant", () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />);
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should render with info variant", () => {
    render(<ConfirmDialog {...defaultProps} variant="info" />);
    fireEvent.click(screen.getByText("Open Dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
