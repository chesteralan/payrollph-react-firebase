import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("should render title", () => {
    render(<EmptyState title="No Data Found" />);
    expect(screen.getByText("No Data Found")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    render(
      <EmptyState
        title="No Data"
        description="There are no items to display."
      />,
    );
    expect(
      screen.getByText("There are no items to display."),
    ).toBeInTheDocument();
  });

  it("should not render description when not provided", () => {
    render(<EmptyState title="No Data" />);
    expect(
      screen.queryByText("There are no items to display."),
    ).not.toBeInTheDocument();
  });

  it("should render default data icon when type is not specified", () => {
    render(<EmptyState title="Empty" />);
    // FileText icon mock creates testid "lucide-filetext"
    expect(screen.getByTestId("lucide-filetext")).toBeInTheDocument();
  });

  it("should render employees icon when type is employees", () => {
    render(<EmptyState title="No Employees" type="employees" />);
    expect(screen.getByTestId("lucide-users")).toBeInTheDocument();
  });

  it("should render payroll icon when type is payroll", () => {
    render(<EmptyState title="No Payroll" type="payroll" />);
    expect(screen.getByTestId("lucide-dollarsign")).toBeInTheDocument();
  });

  it("should render calendar icon when type is calendar", () => {
    render(<EmptyState title="No Events" type="calendar" />);
    expect(screen.getByTestId("lucide-calendar")).toBeInTheDocument();
  });

  it("should render reports icon when type is reports", () => {
    render(<EmptyState title="No Reports" type="reports" />);
    expect(screen.getByTestId("lucide-barchart3")).toBeInTheDocument();
  });

  it("should render settings icon when type is settings", () => {
    render(<EmptyState title="No Settings" type="settings" />);
    expect(screen.getByTestId("lucide-settings")).toBeInTheDocument();
  });

  it("should render files icon when type is files", () => {
    render(<EmptyState title="No Files" type="files" />);
    expect(screen.getByTestId("lucide-folderopen")).toBeInTheDocument();
  });

  it("should render error icon when type is error", () => {
    render(<EmptyState title="Error" type="error" />);
    expect(screen.getByTestId("lucide-alertcircle")).toBeInTheDocument();
  });

  it("should render action button when action prop is provided", () => {
    const actionButton = <button>Create New</button>;
    render(
      <EmptyState title="No Data" action={actionButton} />,
    );
    expect(screen.getByText("Create New")).toBeInTheDocument();
  });

  it("should call action handler when action button is clicked", () => {
    const handleClick = vi.fn();
    const actionButton = <button onClick={handleClick}>Create New</button>;
    render(
      <EmptyState title="No Data" action={actionButton} />,
    );
    fireEvent.click(screen.getByText("Create New"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not render action section when action prop is not provided", () => {
    render(<EmptyState title="No Data" />);
    const container = screen.getByRole("status");
    const actionSection = container.querySelector(".mt-2");
    expect(actionSection).not.toBeInTheDocument();
  });

  it("should use provided icon when icon prop is given", () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />;
    render(
      <EmptyState
        title="Custom"
        type="data"
        icon={<CustomIcon />}
      />,
    );
    // When icon prop is provided, it takes precedence over type-based icon
    // The default FileText icon is NOT rendered when icon prop is given
    expect(screen.queryByTestId("lucide-filetext")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <EmptyState title="Test" className="custom-class" />,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.classList.contains("custom-class")).toBe(true);
  });

  it("should have role status", () => {
    render(<EmptyState title="Test" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
