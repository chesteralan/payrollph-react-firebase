import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { SystemSettingsPage } from "./SystemSettingsPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("SystemSettingsPage", () => {
  it("renders without crashing and shows heading after loading", async () => {
    addMockDocs("system_settings/default", [
      {
        id: "default",
        systemName: "SMB Payroll",
        timezone: "Asia/Manila",
        maintenanceMode: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        passwordRequireSpecialChars: true,
        dataRetentionMonths: 12,
        autoCleanup: false,
        defaultTheme: "system",
        logoUrl: "",
      },
    ]);
    renderWithProviders(<SystemSettingsPage />);
    expect(await screen.findByRole("heading", { name: /system settings/i })).toBeInTheDocument();
  });
});
