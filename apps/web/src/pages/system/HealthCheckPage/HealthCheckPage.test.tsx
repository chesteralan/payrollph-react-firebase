import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { HealthCheckPage } from "./HealthCheckPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
}, 10000);

describe("HealthCheckPage", () => {
  it("renders without crashing", { timeout: 15000 }, () => {
    addMockDocs("_health_check", []);
    addMockDocs("user_accounts", []);
    addMockDocs("names", []);
    addMockDocs("employees", []);
    addMockDocs("employee_groups", []);
    addMockDocs("employee_positions", []);
    addMockDocs("employee_areas", []);
    addMockDocs("earnings", []);
    addMockDocs("deductions", []);
    addMockDocs("benefits", []);
    addMockDocs("payroll", []);
    addMockDocs("payroll_templates", []);
    addMockDocs("payroll_inclusive_dates", []);
    addMockDocs("payroll_groups", []);
    addMockDocs("payroll_employees", []);
    addMockDocs("salaries", []);
    addMockDocs("dtr_entries", []);
    addMockDocs("companies", []);
    addMockDocs("system_audit", []);
    addMockDocs("backups", []);

    renderWithProviders(<HealthCheckPage />);

    // The heading shows immediately (not dependent on loading)
    expect(
      screen.getByRole("heading", { name: /system health check/i }),
    ).toBeInTheDocument();
  });
});
