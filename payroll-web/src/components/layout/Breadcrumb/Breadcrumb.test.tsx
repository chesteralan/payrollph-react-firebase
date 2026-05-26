import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Breadcrumb } from "./Breadcrumb";

/**
 * Helper to render Breadcrumb inside a MemoryRouter with a given path
 */
function renderBreadcrumb(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumb />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Breadcrumb", () => {
  describe("Visibility", () => {
    it("returns null (does not render) when at root path '/'", () => {
      const { container } = renderBreadcrumb("/");
      expect(container.innerHTML).toBe("");
    });

    it("renders breadcrumb for top-level paths like /dashboard (2 segments total = Home + dashboard)", () => {
      renderBreadcrumb("/dashboard");
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    });

    it("renders breadcrumb trail for paths with at least 1 segment after root", () => {
      renderBreadcrumb("/employees/groups");
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    });
  });

  describe("Trail Generation", () => {
    it("shows Home as the first crumb", () => {
      renderBreadcrumb("/employees/groups");
      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("shows correct labels for employee sub-paths", () => {
      renderBreadcrumb("/employees/calendar");
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
    });

    it("maps route segments to human-readable labels using routeLabels", () => {
      renderBreadcrumb("/employees/positions");
      expect(screen.getByText("Positions")).toBeInTheDocument();
    });

    it("shows correct labels for payroll paths", () => {
      renderBreadcrumb("/payroll/templates");
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Templates")).toBeInTheDocument();
    });

    it("shows correct labels for multi-segment report paths", () => {
      renderBreadcrumb("/reports/13th-month");
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("13th Month")).toBeInTheDocument();
    });

    it("shows correct labels for system sub-paths", () => {
      renderBreadcrumb("/system/companies");
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Companies")).toBeInTheDocument();
    });

    it("generates all crumbs for 2-segment paths", () => {
      renderBreadcrumb("/employees/calendar");
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
    });

    it("shows raw segment as label when no route label exists", () => {
      renderBreadcrumb("/custom/page");
      expect(screen.getByText("Home")).toBeInTheDocument();
      // "custom" not in routeLabels, falls through to raw segment
      expect(screen.getByText("custom")).toBeInTheDocument();
    });

    it("shows multi-segment paths with proper labels", () => {
      renderBreadcrumb("/system/company-settings");
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Company Settings")).toBeInTheDocument();
    });

    it("handles /dtr path (single segment after root) — renders breadcrumb", () => {
      renderBreadcrumb("/dtr");
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("DTR")).toBeInTheDocument();
    });
  });

  describe("Link Behavior", () => {
    it("makes the last crumb a non-link (current page indicator)", () => {
      renderBreadcrumb("/employees/groups");
      const lastCrumb = screen.getByText("Groups");
      // The last item should not be wrapped in a link
      expect(lastCrumb.closest("a")).toBeNull();
      // It should be rendered as a plain span (font-medium)
      expect(lastCrumb.className).toContain("font-medium");
    });

    it("makes intermediate crumbs clickable links", () => {
      renderBreadcrumb("/employees/groups");
      const homeLink = screen.getByText("Home");
      expect(homeLink.closest("a")).toHaveAttribute("href", "/");
    });

    it("renders Home icon in the first crumb", () => {
      renderBreadcrumb("/employees/groups");
      const homeIcon = screen.getByTestId("lucide-home");
      expect(homeIcon).toBeInTheDocument();
    });

    it("renders chevron separators between crumbs", () => {
      renderBreadcrumb("/employees/groups");
      // 3 crumbs (Home, Employee Master List, Groups) → 2 chevrons
      const chevrons = screen.getAllByTestId("lucide-chevronright");
      expect(chevrons.length).toBe(2);
    });

    it("renders one chevron for 2-crumb paths (single segment)", () => {
      // /employees → 2 crumbs (Home, Employee Master List) → 1 chevron
      renderBreadcrumb("/employees");
      const chevrons = screen.getAllByTestId("lucide-chevronright");
      expect(chevrons.length).toBe(1);
    });
  });
});
