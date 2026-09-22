import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileTabs } from "./ProfileTabs";
import type { ProfileTab } from "./EmployeeProfilePage.types";

const defaultProps = {
  activeTab: "info" as ProfileTab,
  onTabChange: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  return { ...defaultProps, ...props };
}

describe("ProfileTabs", () => {
  it("renders all tab labels", () => {
    render(<ProfileTabs {...setup()} />);
    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Compensation")).toBeInTheDocument();
    expect(screen.getByText("DTR History")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("calls onTabChange with tab key when a tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<ProfileTabs {...setup({ onTabChange })} />);
    fireEvent.click(screen.getByText("Contact"));
    expect(onTabChange).toHaveBeenCalledWith("contact");
  });

  it("calls onTabChange with compensation tab key", () => {
    const onTabChange = vi.fn();
    render(<ProfileTabs {...setup({ onTabChange })} />);
    fireEvent.click(screen.getByText("Compensation"));
    expect(onTabChange).toHaveBeenCalledWith("compensation");
  });

  it("calls onTabChange with dtr tab key", () => {
    const onTabChange = vi.fn();
    render(<ProfileTabs {...setup({ onTabChange })} />);
    fireEvent.click(screen.getByText("DTR History"));
    expect(onTabChange).toHaveBeenCalledWith("dtr");
  });

  it("calls onTabChange with documents tab key", () => {
    const onTabChange = vi.fn();
    render(<ProfileTabs {...setup({ onTabChange })} />);
    fireEvent.click(screen.getByText("Documents"));
    expect(onTabChange).toHaveBeenCalledWith("documents");
  });

  it("highlights the active tab", () => {
    render(<ProfileTabs {...setup({ activeTab: "contact" })} />);
    const contactTab = screen.getByText("Contact").closest("button");
    expect(contactTab).toHaveClass("border-primary-600");
    expect(contactTab).toHaveClass("text-primary-600");
  });

  it("renders non-active tabs with default styling", () => {
    render(<ProfileTabs {...setup({ activeTab: "info" })} />);
    const contactTab = screen.getByText("Contact").closest("button");
    expect(contactTab).toHaveClass("border-transparent");
    expect(contactTab).toHaveClass("text-gray-500");
  });
});
