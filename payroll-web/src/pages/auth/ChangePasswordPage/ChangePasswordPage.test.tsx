import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { ChangePasswordPage } from "./ChangePasswordPage";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChangePasswordPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByText(/update your account password/i)).toBeInTheDocument();
  });
});
