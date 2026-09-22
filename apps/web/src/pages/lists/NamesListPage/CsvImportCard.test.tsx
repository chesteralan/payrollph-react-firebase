import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CsvImportCard } from "./CsvImportCard";
import { renderWithProviders } from "@/test/page-test-utils";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

const defaultProps = {
  csvPreview: [],
  csvFileName: "",
  importStats: null,
  importing: false,
  onFileSelect: vi.fn(),
  onImport: vi.fn(),
  onReset: vi.fn(),
};

describe("CsvImportCard", () => {
  it("renders upload prompt when empty", () => {
    renderWithProviders(<CsvImportCard {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /import names from csv/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/upload a csv file/i)).toBeInTheDocument();
  });

  it("renders preview table when csv data is present", () => {
    const preview = [
      { firstName: "John", middleName: "", lastName: "Doe", suffix: "", isValid: true },
    ];
    renderWithProviders(
      <CsvImportCard {...defaultProps} csvPreview={preview} csvFileName="test.csv" />,
    );
    expect(screen.getByText("test.csv")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
  });

  it("shows import stats when available", () => {
    const stats = { success: 5, failed: 1, duplicates: 2 };
    renderWithProviders(
      <CsvImportCard {...defaultProps} importStats={stats} />,
    );
    expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
