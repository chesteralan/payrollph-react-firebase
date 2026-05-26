import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import * as useAuthModule from "@/hooks/useAuth";
import * as usePermissionsModule from "@/hooks/usePermissions";

/**
 * Helper to render Sidebar inside a MemoryRouter
 */
function renderSidebar(props?: { isOpen?: boolean; onClose?: () => void }, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar isOpen={props?.isOpen ?? true} onClose={props?.onClose} />
    </MemoryRouter>,
  );
}

function createMockAuth(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: "user-1",
      email: "admin@test.com",
      username: "admin",
      displayName: "Admin User",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    firebaseUser: { uid: "user-1", email: "admin@test.com" } as any,
    currentCompanyId: "company-1",
    loading: false,
    sessionExpiring: false,
    restrictions: [],
    userCompanies: [],
    settings: null,
    login: vi.fn(),
    logout: vi.fn(async () => {}),
    changePassword: vi.fn(),
    resetPassword: vi.fn(),
    setCurrentCompanyId: vi.fn(),
    hasPermission: vi.fn(() => true),
    refreshSession: vi.fn(),
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(useAuthModule, "useAuth").mockReturnValue(createMockAuth());

  // Default: all permissions granted
  vi.spyOn(usePermissionsModule, "usePermissions").mockReturnValue({
    canView: vi.fn(() => true),
    canAdd: vi.fn(() => true),
    canEdit: vi.fn(() => true),
    canDelete: vi.fn(() => true),
    can: vi.fn(() => true),
  });
});

describe("Sidebar", () => {
  describe("Structure & Branding", () => {
    it("renders the app name and version", () => {
      renderSidebar();
      expect(screen.getByText("SMB Payroll")).toBeInTheDocument();
      expect(screen.getByText("v2.0")).toBeInTheDocument();
    });

    it("renders the main navigation region", () => {
      renderSidebar();
      expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
    });

    it("renders the user display name and email", () => {
      renderSidebar();
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    });

    it("renders the logout button", () => {
      renderSidebar();
      expect(screen.getByLabelText("Logout")).toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    it("renders top-level nav items", () => {
      renderSidebar();
      // Top-level items (those without children as root, or the root parents)
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Employees")).toBeInTheDocument();
      expect(screen.getByText("Lists")).toBeInTheDocument();
      expect(screen.getByText("Payroll")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();
    });

    it("initially does NOT show child items until expanded", () => {
      renderSidebar();
      // Child items should NOT be visible initially (sections are collapsed)
      expect(screen.queryByText("Employee Registry")).not.toBeInTheDocument();
      expect(screen.queryByText("Payroll Runs")).not.toBeInTheDocument();
    });

    it("expands child items when section header is clicked", async () => {
      renderSidebar();
      const employeesBtn = screen.getByLabelText("Employees section");
      await userEvent.click(employeesBtn);

      // Child items should now be visible
      expect(screen.getByText("Employee Registry")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("Groups")).toBeInTheDocument();
      expect(screen.getByText("Positions")).toBeInTheDocument();
      expect(screen.getByText("Areas")).toBeInTheDocument();
    });

    it("expands multiple sections independently", async () => {
      renderSidebar();
      await userEvent.click(screen.getByLabelText("Employees section"));
      await userEvent.click(screen.getByLabelText("Payroll section"));

      expect(screen.getByText("Employee Registry")).toBeInTheDocument();
      expect(screen.getByText("Payroll Runs")).toBeInTheDocument();
      expect(screen.getByText("New Payroll")).toBeInTheDocument();
    });
  });

  describe("Active State", () => {
    it("marks the Dashboard link as active when at root path", () => {
      renderSidebar(undefined, ["/"]);

      // Dashboard is a direct link (no children)
      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink).toHaveAttribute("aria-current", "page");
    });

    it("marks a parent section as active when a child route matches", () => {
      renderSidebar(undefined, ["/employees"]);

      // The Employees section should be highlighted (isChildActive)
      const employeesBtn = screen.getByLabelText("Employees section");
      // When isChildActive, it has bg-sidebar-active class
      expect(employeesBtn.className).toContain("bg-sidebar-active");
    });

    it("marks a child link as active when its path matches", async () => {
      renderSidebar(undefined, ["/employees/groups"]);

      // Expand Employees section
      await userEvent.click(screen.getByLabelText("Employees section"));

      // Groups should have aria-current="page"
      const groupsLink = screen.getByText("Groups").closest("a");
      expect(groupsLink).toHaveAttribute("aria-current", "page");
    });

    it("does NOT mark non-matching links as active", () => {
      renderSidebar(undefined, ["/payroll"]);

      // Dashboard should not be active
      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink).not.toHaveAttribute("aria-current", "page");
    });
  });

  describe("Permission Visibility", () => {
    it("hides nav items when user lacks view permission", () => {
      vi.spyOn(usePermissionsModule, "usePermissions").mockReturnValue({
        canView: vi.fn(() => false),
        canAdd: vi.fn(() => false),
        canEdit: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        can: vi.fn(() => false),
      });

      renderSidebar();
      // With no permissions, the Dashboard item (which has no department/section) should still show
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      // But Employees section should be hidden because it has department set
      expect(screen.queryByText("Employees")).not.toBeInTheDocument();
      expect(screen.queryByText("Payroll")).not.toBeInTheDocument();
    });

    it("hides specific child items when user lacks permission for that section", async () => {
      const canViewMock = vi.fn((department: string, section: string) => {
        // User can view Employees > Calendar and Employees > Groups, but not Employees > Positions
        if (department === "employees" && section === "positions") return false;
        return true;
      });

      vi.spyOn(usePermissionsModule, "usePermissions").mockReturnValue({
        canView: canViewMock,
        canAdd: vi.fn(() => true),
        canEdit: vi.fn(() => true),
        canDelete: vi.fn(() => true),
        can: vi.fn(() => true),
      });

      renderSidebar(undefined, ["/employees"]);

      // Expand employees
      const employeesBtn = screen.getByLabelText("Employees section");
      act(() => {
        employeesBtn.click();
      });

      // Items with permission should be visible
      expect(screen.getByText("Employee Registry")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("Groups")).toBeInTheDocument();
      // Positions should be hidden
      expect(screen.queryByText("Positions")).not.toBeInTheDocument();
    });

    it("hides entire parent section when all children are permission-restricted", () => {
      const canViewMock = vi.fn(() => false);

      vi.spyOn(usePermissionsModule, "usePermissions").mockReturnValue({
        canView: canViewMock,
        canAdd: vi.fn(() => true),
        canEdit: vi.fn(() => true),
        canDelete: vi.fn(() => true),
        can: vi.fn(() => true),
      });

      renderSidebar();
      // System section (which has department="system") should be hidden entirely
      expect(screen.queryByText("System")).not.toBeInTheDocument();
    });

    it("shows Dashboard even when permissions are restricted (no department check)", () => {
      vi.spyOn(usePermissionsModule, "usePermissions").mockReturnValue({
        canView: vi.fn(() => false),
        canAdd: vi.fn(() => false),
        canEdit: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        can: vi.fn(() => false),
      });

      renderSidebar();
      // Dashboard has no department/section, so it always shows
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("Logout", () => {
    it("calls logout function when logout button is clicked", async () => {
      const logout = vi.fn(async () => {});
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue(
        createMockAuth({ logout }),
      );

      renderSidebar();
      const logoutBtn = screen.getByLabelText("Logout");
      await userEvent.click(logoutBtn);

      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mobile Behavior", () => {
    it("renders with translate-x-0 when isOpen is true", () => {
      const { container } = renderSidebar({ isOpen: true });
      const sidebar = container.querySelector('[class*="translate-x-0"]');
      expect(sidebar).toBeInTheDocument();
    });

    it("renders with -translate-x-full when isOpen is false", () => {
      const { container } = renderSidebar({ isOpen: false });
      const sidebar = container.querySelector('[class*="-translate-x-full"]');
      expect(sidebar).toBeInTheDocument();
    });

    it("calls onClose when mobile close button is clicked", async () => {
      const onClose = vi.fn();
      renderSidebar({ isOpen: true, onClose });

      const closeBtn = screen.getByLabelText("Close sidebar menu");
      await userEvent.click(closeBtn);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when a nav link is clicked", async () => {
      const onClose = vi.fn();
      renderSidebar({ isOpen: true, onClose });

      // Dashboard is a direct link
      const dashboardLink = screen.getByText("Dashboard");
      await userEvent.click(dashboardLink);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
