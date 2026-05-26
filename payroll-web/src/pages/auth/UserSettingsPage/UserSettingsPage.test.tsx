import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { UserSettingsPage } from "./UserSettingsPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserSettingsPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<UserSettingsPage />);
    expect(
      screen.getByRole("heading", { name: /user settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /preferences/i }),
    ).toBeInTheDocument();
  });

  it("renders form inputs for settings", () => {
    renderWithProviders(<UserSettingsPage />);
    // These are label elements in the DOM
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Items Per Page")).toBeInTheDocument();
    expect(screen.getByText("Default Currency")).toBeInTheDocument();
    expect(screen.getByText("Language / Locale")).toBeInTheDocument();
    // Save settings button
    expect(
      screen.getByRole("button", { name: /save settings/i }),
    ).toBeInTheDocument();
  });
});
