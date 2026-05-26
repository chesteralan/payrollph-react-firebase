import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { AttendanceReportPage } from "./AttendanceReportPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AttendanceReportPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<AttendanceReportPage />);
    expect(screen.getByText("Attendance Report")).toBeInTheDocument();
  });
});
