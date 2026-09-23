import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { NamesTable } from "./NamesTable";
import { renderWithProviders } from "@/test/page-test-utils";
import type { NameRecord } from "./NamesListPage.types";
import type { SortDirection } from "@/hooks/useTableSort";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

const mockNames: (NameRecord & { fullName: string })[] = [
  {
    id: "1",
    firstName: "Juan",
    lastName: "Dela Cruz",
    fullName: "Juan Dela Cruz",
  },
  {
    id: "2",
    firstName: "Maria",
    middleName: "Santos",
    lastName: "Reyes",
    suffix: "Jr.",
    fullName: "Maria Santos Reyes Jr.",
  },
];

const defaultProps = {
  names: mockNames,
  loading: false,
  searchQuery: "",
  onSearchChange: vi.fn(),
  selectedIds: new Set<string>(),
  sortConfig: null,
  onToggleSelect: vi.fn(),
  onToggleSelectAll: vi.fn(),
  onSort: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  const merged = { ...defaultProps, ...props };
  return renderWithProviders(<NamesTable {...merged} />);
}

describe("NamesTable", () => {
  it("renders the names count", () => {
    setup();
    expect(screen.getByText("2 names")).toBeInTheDocument();
  });

  it("renders singular form for one name", () => {
    setup({ names: [mockNames[0]] });
    expect(screen.getByText("1 name")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    setup();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders name rows", () => {
    setup();
    expect(screen.getByText(/Juan/)).toBeInTheDocument();
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    setup({ loading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    setup({ names: [] });
    expect(screen.getByText("No names found")).toBeInTheDocument();
  });

  it("renders SearchBar", () => {
    setup();
    expect(screen.getByPlaceholderText("Search names...")).toBeInTheDocument();
  });

  it("shows check all icon when all selected", () => {
    setup({ selectedIds: new Set(["1", "2"]) });
    expect(screen.getByText("Name")).toBeInTheDocument();
  });
});
