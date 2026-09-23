import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationPanel } from "./ValidationPanel";
import type { PayrollValidationError } from "@/types";

const makeError = (
  overrides: Partial<PayrollValidationError> = {},
): PayrollValidationError => ({
  field: "salary",
  message: "Salary is required",
  severity: "error",
  ...overrides,
});

describe("ValidationPanel", () => {
  it("renders error title when errors contain severity error", () => {
    const errors = [makeError({ severity: "error" })];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText("Validation Errors")).toBeTruthy();
  });

  it("renders warning title when all errors are warnings", () => {
    const errors = [makeError({ severity: "warning" })];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText("Validation Warnings")).toBeTruthy();
  });

  it("renders error message text", () => {
    const errors = [makeError({ message: "Missing rate" })];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText("Missing rate")).toBeTruthy();
  });

  it("renders employee name when provided", () => {
    const errors = [
      makeError({ employeeName: "John Doe", message: "Invalid" }),
    ];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText(/John Doe: Invalid/)).toBeTruthy();
  });

  it("renders nameId when provided", () => {
    const errors = [makeError({ nameId: "emp-1", message: "Invalid" })];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText("(emp-1)")).toBeTruthy();
  });

  it("renders multiple errors", () => {
    const errors = [
      makeError({ message: "Error 1" }),
      makeError({ message: "Error 2" }),
      makeError({ message: "Error 3" }),
    ];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText("Error 1")).toBeTruthy();
    expect(screen.getByText("Error 2")).toBeTruthy();
    expect(screen.getByText("Error 3")).toBeTruthy();
  });

  it("renders with mixed error and warning severities", () => {
    const errors = [
      makeError({ severity: "error", message: "Critical" }),
      makeError({ severity: "warning", message: "Minor" }),
    ];
    render(<ValidationPanel errors={errors} onClose={vi.fn()} />);
    expect(screen.getByText("Validation Errors")).toBeTruthy();
    expect(screen.getByText("Critical")).toBeTruthy();
    expect(screen.getByText("Minor")).toBeTruthy();
  });
});
