import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CustomReportBuilderPage from "./CustomReportBuilderPage";

vi.mock("@/hooks/useCompany", () => ({
  useCompany: () => ({
    companies: [],
    selectedCompany: {
      id: "test-company",
      name: "Test Company",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    selectCompany: vi.fn(),
    loading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomReportBuilderPage", () => {
  it("renders without crashing", () => {
    render(<CustomReportBuilderPage />);
    expect(screen.getByText("Custom Report Builder")).toBeInTheDocument();
  });
});
