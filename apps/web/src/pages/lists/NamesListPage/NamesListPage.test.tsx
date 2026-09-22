import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { NamesListPage } from "./NamesListPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: vi.fn(() => true),
    canAdd: vi.fn(() => true),
    canEdit: vi.fn(() => true),
    canDelete: vi.fn(() => true),
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTableSort", () => ({
  useTableSort: (items: unknown[]) => ({
    items,
    handleSort: vi.fn(),
    sortConfig: { key: "lastName", direction: "asc" as const },
  }),
}));

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("NamesListPage", () => {
  it("renders without crashing", () => {
    addMockDocs("names", []);
    addMockDocs("groups", []);
    addMockDocs("positions", []);
    addMockDocs("areas", []);
    addMockDocs("statuses", []);
    renderWithProviders(<NamesListPage />);
    expect(
      screen.getByRole("heading", { name: /names list/i }),
    ).toBeInTheDocument();
  });

  it("shows action buttons", () => {
    addMockDocs("names", []);
    addMockDocs("groups", []);
    addMockDocs("positions", []);
    addMockDocs("areas", []);
    addMockDocs("statuses", []);
    renderWithProviders(<NamesListPage />);
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
    expect(screen.getByText("Import CSV")).toBeInTheDocument();
    expect(screen.getByText("Add Name")).toBeInTheDocument();
  });
});
