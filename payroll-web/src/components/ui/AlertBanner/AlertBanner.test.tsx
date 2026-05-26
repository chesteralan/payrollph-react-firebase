import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertBanner } from "./AlertBanner";
import type { SystemAlert } from "./AlertBanner.types";

describe("AlertBanner", () => {
  const baseAlert: SystemAlert = {
    id: "test-alert",
    type: "info",
    title: "Information",
    message: "This is an informational alert.",
    dismissed: false,
  };

  it("should display the alert title", () => {
    const { container } = render(
      <AlertBanner alert={baseAlert} onDismiss={vi.fn()} />,
    );
    expect(screen.getByText("Information")).toBeInTheDocument();
  });

  it("should display the alert message", () => {
    render(<AlertBanner alert={baseAlert} onDismiss={vi.fn()} />);
    expect(
      screen.getByText("This is an informational alert."),
    ).toBeInTheDocument();
  });

  it("should render with info variant styling", () => {
    const { container } = render(
      <AlertBanner alert={baseAlert} onDismiss={vi.fn()} />,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass(
      "bg-blue-50",
      "border-blue-200",
      "text-blue-800",
    );
  });

  it("should render with warning variant styling", () => {
    const warningAlert: SystemAlert = {
      ...baseAlert,
      type: "warning",
      title: "Warning",
    };
    const { container } = render(
      <AlertBanner alert={warningAlert} onDismiss={vi.fn()} />,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass(
      "bg-yellow-50",
      "border-yellow-200",
      "text-yellow-800",
    );
  });

  it("should render with error variant styling", () => {
    const errorAlert: SystemAlert = {
      ...baseAlert,
      type: "error",
      title: "Error",
    };
    const { container } = render(
      <AlertBanner alert={errorAlert} onDismiss={vi.fn()} />,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("bg-red-50", "border-red-200", "text-red-800");
  });

  it("should render with success variant styling", () => {
    const successAlert: SystemAlert = {
      ...baseAlert,
      type: "success",
      title: "Success",
    };
    const { container } = render(
      <AlertBanner alert={successAlert} onDismiss={vi.fn()} />,
    );
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass(
      "bg-green-50",
      "border-green-200",
      "text-green-800",
    );
  });

  it("should call onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<AlertBanner alert={baseAlert} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText("Dismiss info alert"));
    expect(onDismiss).toHaveBeenCalledWith("test-alert");
  });

  it("should have dismiss button with correct aria-label for warning", () => {
    const warningAlert: SystemAlert = {
      ...baseAlert,
      type: "warning",
    };
    render(<AlertBanner alert={warningAlert} onDismiss={vi.fn()} />);
    expect(screen.getByLabelText("Dismiss warning alert")).toBeInTheDocument();
  });

  it("should render info icon for info type", () => {
    render(<AlertBanner alert={baseAlert} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("lucide-info")).toBeInTheDocument();
  });

  it("should render warning icon for warning type", () => {
    const warningAlert: SystemAlert = {
      ...baseAlert,
      type: "warning",
    };
    render(<AlertBanner alert={warningAlert} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("lucide-alerttriangle")).toBeInTheDocument();
  });

  it("should render error icon for error type", () => {
    const errorAlert: SystemAlert = {
      ...baseAlert,
      type: "error",
    };
    render(<AlertBanner alert={errorAlert} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("lucide-alertcircle")).toBeInTheDocument();
  });

  it("should render success icon for success type", () => {
    const successAlert: SystemAlert = {
      ...baseAlert,
      type: "success",
    };
    render(<AlertBanner alert={successAlert} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("lucide-checkcircle")).toBeInTheDocument();
  });

  it("should render with expiresAt when provided", () => {
    const alertWithExpiry: SystemAlert = {
      ...baseAlert,
      expiresAt: new Date("2025-12-31"),
    };
    render(<AlertBanner alert={alertWithExpiry} onDismiss={vi.fn()} />);
    expect(screen.getByText("Information")).toBeInTheDocument();
  });
});
