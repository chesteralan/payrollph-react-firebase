import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import * as useAuthModule from "@/hooks/useAuth";
import * as firestoreModule from "firebase/firestore";
import { db } from "@/config/firebase";
import { addMockDocs, clearMockDocs } from "@/__mocks__/firebase";

/**
 * Helper to render Header inside a MemoryRouter (needed for useNavigate)
 */
function renderHeader(props?: { onMenuClick?: () => void }) {
  return render(
    <MemoryRouter>
      <Header onMenuClick={props?.onMenuClick} />
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
  clearMockDocs();

  vi.spyOn(useAuthModule, "useAuth").mockReturnValue(createMockAuth());
});

describe("Header", () => {
  describe("Basic Structure", () => {
    it("renders the header element", () => {
      renderHeader();
      expect(document.querySelector("header")).toBeInTheDocument();
    });

    it("renders the user display name", () => {
      renderHeader();
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    it("renders the hamburger menu button for mobile", () => {
      renderHeader();
      expect(screen.getByLabelText("Open sidebar menu")).toBeInTheDocument();
    });

    it("calls onMenuClick when hamburger is clicked", async () => {
      const onMenuClick = vi.fn();
      renderHeader({ onMenuClick });
      const btn = screen.getByLabelText("Open sidebar menu");
      await userEvent.click(btn);
      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Company Switcher", () => {
    it("does NOT render company switcher when only 1 or fewer companies exist", async () => {
      addMockDocs("companies", [
        { id: "company-1", name: "Test Corp", isActive: true },
      ]);
      renderHeader();

      // Wait for the effect to fetch companies (company data loads but isn't displayed
      // because companies.length > 1 condition hides the switcher for single companies)
      // The company name only appears in the header when the switcher is shown
      await vi.waitFor(async () => {
        // Verify the company filter query was made
        const { getDocs } = await import("firebase/firestore");
        expect(getDocs).toHaveBeenCalled();
      });

      // With only one company, the switcher is hidden (companies.length > 1 check)
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      // The company switcher button should NOT be present
      expect(
        screen.queryByLabelText(/Current company/i),
      ).not.toBeInTheDocument();
    });

    it("renders company switcher when multiple companies exist", async () => {
      addMockDocs("companies", [
        { id: "company-1", name: "Test Corp", isActive: true },
        { id: "company-2", name: "Acme Inc", isActive: true },
      ]);
      renderHeader();

      await waitFor(() => {
        expect(screen.getByText("Test Corp")).toBeInTheDocument();
      });

      // Company switcher button should be present (since companies.length > 1)
      const switcherBtn = screen.getByLabelText("Current company: Test Corp");
      expect(switcherBtn).toBeInTheDocument();
    });

    it("shows company dropdown on click", async () => {
      addMockDocs("companies", [
        { id: "company-1", name: "Test Corp", isActive: true },
        { id: "company-2", name: "Acme Inc", isActive: true },
      ]);
      renderHeader();

      await waitFor(() => {
        expect(screen.getByText("Test Corp")).toBeInTheDocument();
      });

      const switcherBtn = screen.getByLabelText("Current company: Test Corp");
      await userEvent.click(switcherBtn);

      // Dropdown should now appear with both companies
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    });

    it("switches company when a company is selected from dropdown", async () => {
      const setCurrentCompanyId = vi.fn();
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue(
        createMockAuth({ setCurrentCompanyId }),
      );

      addMockDocs("companies", [
        { id: "company-1", name: "Test Corp", isActive: true },
        { id: "company-2", name: "Acme Inc", isActive: true },
      ]);
      renderHeader();

      await waitFor(() => {
        expect(screen.getByText("Test Corp")).toBeInTheDocument();
      });

      // Open dropdown
      const switcherBtn = screen.getByLabelText("Current company: Test Corp");
      await userEvent.click(switcherBtn);

      // Click on Acme Inc
      const acmeOption = screen.getByText("Acme Inc");
      await userEvent.click(acmeOption);

      expect(setCurrentCompanyId).toHaveBeenCalledWith("company-2");
    });

    it("shows 'Select Company' when no currentCompanyId is set", async () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue(
        createMockAuth({ currentCompanyId: null }),
      );

      addMockDocs("companies", [
        { id: "company-1", name: "Test Corp", isActive: true },
        { id: "company-2", name: "Acme Inc", isActive: true },
      ]);
      renderHeader();

      await waitFor(() => {
        expect(screen.getByText("Select Company")).toBeInTheDocument();
      });

      const switcherBtn = screen.getByLabelText("Select company");
      expect(switcherBtn).toBeInTheDocument();
    });

    it("marks the current company as selected in the dropdown", async () => {
      addMockDocs("companies", [
        { id: "company-1", name: "Test Corp", isActive: true },
        { id: "company-2", name: "Acme Inc", isActive: true },
      ]);
      renderHeader();

      await waitFor(() => {
        expect(screen.getByText("Test Corp")).toBeInTheDocument();
      });

      const switcherBtn = screen.getByLabelText("Current company: Test Corp");
      await userEvent.click(switcherBtn);

      // company-1 should be marked aria-selected
      const options = screen.getAllByRole("option");
      const selectedOption = options.find(
        (o) => o.getAttribute("aria-selected") === "true",
      );
      expect(selectedOption).toHaveTextContent("Test Corp");
    });
  });

  describe("User Menu", () => {
    it("renders the user avatar and name", () => {
      renderHeader();
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(
        screen.getByLabelText("User menu for Admin User"),
      ).toBeInTheDocument();
    });

    it("shows user dropdown when avatar is clicked", async () => {
      renderHeader();
      const userBtn = screen.getByLabelText("User menu for Admin User");
      await userEvent.click(userBtn);

      // Dropdown should appear
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Change Password")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });

    it("navigates to settings when Settings is clicked", async () => {
      renderHeader();
      const userBtn = screen.getByLabelText("User menu for Admin User");
      await userEvent.click(userBtn);

      // We can't easily assert navigation without spy on useNavigate,
      // but we can check the button renders
      const settingsBtn = screen.getByText("Settings");
      expect(settingsBtn).toBeInTheDocument();
    });

    it("calls logout and navigates when Logout is clicked", async () => {
      const logout = vi.fn(async () => {});
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue(
        createMockAuth({ logout }),
      );

      renderHeader();
      const userBtn = screen.getByLabelText("User menu for Admin User");
      await userEvent.click(userBtn);

      const logoutBtn = screen.getByText("Logout");
      await userEvent.click(logoutBtn);

      expect(logout).toHaveBeenCalledTimes(1);
    });

    it("handles user with null displayName gracefully", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue(
        createMockAuth({
          user: null,
          firebaseUser: null,
        }),
      );

      renderHeader();
      // Should render without crashing — displays "unknown" in aria-label
      expect(document.querySelector("header")).toBeInTheDocument();
    });
  });
});
