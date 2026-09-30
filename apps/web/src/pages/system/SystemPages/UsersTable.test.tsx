import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { UsersTable } from "./UsersTable";
import { renderWithProviders } from "@/test/page-test-utils";
import type { SortConfig } from "@/hooks/useTableSort";

const defaultProps = {
  sortedUsers: [
    {
      id: "1",
      username: "jdoe",
      email: "jdoe@test.com",
      displayName: "John Doe",
      isActive: true,
    },
    {
      id: "2",
      username: "asmith",
      email: "asmith@test.com",
      displayName: "Alice Smith",
      isActive: false,
    },
  ] as any[],
  searchQuery: "",
  loading: false,
  selectedIds: new Set<string>(),
  sortConfig: null as SortConfig<any> | null,
  canEdit: () => true,
  canDelete: () => true,
  onSearchChange: vi.fn(),
  onToggleSelect: vi.fn(),
  onToggleSelectAll: vi.fn(),
  onSort: vi.fn(),
  onEditRestrictions: vi.fn(),
  onToggleStatus: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("UsersTable", () => {
  it("renders the search bar", () => {
    renderWithProviders(<UsersTable {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
  });

  it("displays user count", () => {
    renderWithProviders(<UsersTable {...defaultProps} />);
    expect(screen.getByText("2 users")).toBeInTheDocument();
  });

  it("renders user data in the table", () => {
    renderWithProviders(<UsersTable {...defaultProps} />);
    expect(screen.getByText("jdoe")).toBeInTheDocument();
    expect(screen.getByText("jdoe@test.com")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderWithProviders(<UsersTable {...defaultProps} loading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows empty state", () => {
    renderWithProviders(<UsersTable {...defaultProps} sortedUsers={[]} />);
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });
});
