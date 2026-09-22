import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { UserImportCard } from "./UserImportCard";
import { renderWithProviders } from "@/test/page-test-utils";

const defaultProps = {
  csvPreview: [],
  csvFileName: "",
  importStats: null,
  importing: false,
  fileInputRef: { current: null },
  onFileSelect: vi.fn(),
  onImport: vi.fn(),
  onReset: vi.fn(),
};

describe("UserImportCard", () => {
  it("renders the import card heading", () => {
    renderWithProviders(<UserImportCard {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /import users from csv/i }),
    ).toBeInTheDocument();
  });

  it("shows upload prompt when no CSV loaded", () => {
    renderWithProviders(<UserImportCard {...defaultProps} />);
    expect(
      screen.getByText(/upload a csv file/i),
    ).toBeInTheDocument();
  });

  it("shows select file button when no CSV loaded", () => {
    renderWithProviders(<UserImportCard {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /select file/i }),
    ).toBeInTheDocument();
  });

  it("shows import complete when importStats provided", () => {
    renderWithProviders(
      <UserImportCard
        {...defaultProps}
        importStats={{ success: 5, failed: 1, duplicates: 0 }}
      />,
    );
    expect(
      screen.getByText(/import complete/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/successfully imported/i),
    ).toBeInTheDocument();
  });
});
