import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { renderWithProviders, createMockAuthContextValue } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ForgotPasswordPage", () => {
  it("renders without crashing", () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows success message after submitting email", async () => {
    const resetPasswordMock = vi.fn().mockResolvedValue(undefined);
    const authValue = createMockAuthContextValue({
      resetPassword: resetPasswordMock,
    });
    renderWithProviders(<ForgotPasswordPage />, { authValue });

    const input = screen.getByLabelText("Email Address");
    const button = screen.getByRole("button", { name: /send reset link/i });

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(input, { target: { value: "user@test.com" } });
    fireEvent.click(button);

    expect(
      await screen.findByText(/Password reset email sent/i),
    ).toBeInTheDocument();
  });
});
