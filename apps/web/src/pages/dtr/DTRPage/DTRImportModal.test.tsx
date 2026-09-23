import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DTRImportModal } from "./DTRImportModal";

const defaultProps = {
  show: true,
  importPreview: [
    {
      date: "2025-01-15",
      timeIn: "08:00",
      timeOut: "17:00",
      hoursWorked: 8,
      overtimeHours: 0,
      lateHours: 0,
    },
    {
      date: "2025-01-16",
      timeIn: "09:00",
      timeOut: "18:00",
      hoursWorked: 8,
      overtimeHours: 1,
      lateHours: 0,
    },
  ],
  importErrors: [],
  onClose: vi.fn(),
  onImport: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  const merged = { ...defaultProps, ...props };
  merged.onClose = vi.fn();
  merged.onImport = vi.fn();
  render(<DTRImportModal {...merged} />);
  return merged;
}

describe("DTRImportModal", () => {
  it("does not render when show is false", () => {
    setup({ show: false });
    expect(screen.queryByText("Import DTR Entries")).not.toBeInTheDocument();
  });

  it("renders the modal title", () => {
    setup();
    expect(screen.getByText("Import DTR Entries")).toBeInTheDocument();
  });

  it("renders import preview entries count", () => {
    setup();
    expect(screen.getByText("2 entries ready to import")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    setup();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time In")).toBeInTheDocument();
    expect(screen.getByText("Time Out")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
    expect(screen.getByText("OT")).toBeInTheDocument();
    expect(screen.getByText("Late")).toBeInTheDocument();
  });

  it("renders preview row data", () => {
    setup();
    expect(screen.getByText("2025-01-15")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("17:00")).toBeInTheDocument();
  });

  it("shows more entries message when preview exceeds 20", () => {
    const longPreview = Array.from({ length: 25 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      hoursWorked: 8,
    }));
    setup({ importPreview: longPreview });
    expect(screen.getByText("...and 5 more entries")).toBeInTheDocument();
  });

  it("renders error list when errors exist", () => {
    setup({ importErrors: ["Error 1", "Error 2"] });
    expect(screen.getByText("2 error(s) found:")).toBeInTheDocument();
    expect(screen.getByText("Error 1")).toBeInTheDocument();
    expect(screen.getByText("Error 2")).toBeInTheDocument();
  });

  it("hides error list when no errors", () => {
    setup({ importErrors: [] });
    expect(screen.queryByText("error(s) found:")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(merged.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onImport when Import button is clicked", () => {
    const merged = setup();
    fireEvent.click(screen.getByText("Import 2 Entries"));
    expect(merged.onImport).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const merged = setup();
    const backdrop = document.querySelector(".fixed.inset-0.bg-black\\/50");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(merged.onClose).toHaveBeenCalledTimes(1);
  });
});
