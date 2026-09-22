import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ReviewStep } from "./ReviewStep";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useNavigate } from "react-router-dom";

const mockNavigate = vi.fn();

const defaultProps = {
  formData: {
    name: "January 2026 Payroll",
    month: 1,
    year: 2026,
    templateId: "",
  },
  templates: [],
  inclusiveDates: [new Date("2026-01-15"), new Date("2026-01-20")],
  groups: [],
  selectedEmployeeIds: ["e1", "e2", "e3"],
  employees: [],
  id: "payroll-123",
  onBack: vi.fn(),
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("ReviewStep", () => {
  it("renders the heading", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(<ReviewStep {...defaultProps} />);
    expect(screen.getByText("Review & Generate")).toBeTruthy();
  });

  it("displays the payroll name", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(<ReviewStep {...defaultProps} />);
    expect(screen.getByText("January 2026 Payroll")).toBeTruthy();
  });

  it("displays the period", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(<ReviewStep {...defaultProps} />);
    const periodLabel = screen.getByText("Period:");
    const periodContainer = periodLabel.closest("div");
    expect(periodContainer?.textContent).toContain("January");
    expect(periodContainer?.textContent).toContain("2026");
  });

  it("displays inclusive dates count", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(<ReviewStep {...defaultProps} />);
    expect(screen.getByText("2 dates")).toBeTruthy();
  });

  it("displays selected employees count", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(<ReviewStep {...defaultProps} />);
    expect(screen.getByText("3 selected")).toBeTruthy();
  });

  it("displays template name when templateId is set", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(
      <ReviewStep
        {...defaultProps}
        formData={{ ...defaultProps.formData, templateId: "t1" }}
        templates={[{ id: "t1", name: "Standard Template" }]}
      />,
    );
    expect(screen.getByText("Standard Template")).toBeTruthy();
  });

  it("calls onBack when Back is clicked", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    const onBack = vi.fn();
    renderWithRouter(
      <ReviewStep {...defaultProps} onBack={onBack} />,
    );
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });

  it("navigates to payroll detail on Complete Setup click", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(<ReviewStep {...defaultProps} />);
    fireEvent.click(screen.getByText("Complete Setup"));
    expect(mockNavigate).toHaveBeenCalledWith("/payroll/payroll-123");
  });

  it("shows group filter count", () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderWithRouter(
      <ReviewStep
        {...defaultProps}
        groups={[{}, {}, {}]}
      />,
    );
    expect(screen.getByText("3 filters")).toBeTruthy();
  });
});
