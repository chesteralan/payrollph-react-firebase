import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

const mockedUseAuth = vi.mocked(useAuth);

function renderWithRouter(initialEntries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when user is authenticated", () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: "test-user", email: "test@example.com" },
      loading: false,
    } as any);

    renderWithRouter();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should redirect to /login when user is not authenticated", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);

    renderWithRouter();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should show loading spinner when auth is loading", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as any);

    renderWithRouter();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should show loading spinner while loading even if user exists", () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: "test-user" },
      loading: true,
    } as any);

    renderWithRouter();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should not redirect when user is loading", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as any);

    renderWithRouter();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
