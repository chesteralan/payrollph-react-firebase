import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useAuth } from "./useAuth";
import { AuthContext } from "@/context/auth";
import type { AuthContextType } from "@/context/auth";

function createWrapper(contextValue: AuthContextType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AuthContext.Provider,
      { value: contextValue },
      children,
    );
  };
}

const mockAuthValue: AuthContextType = {
  firebaseUser: null,
  user: null,
  restrictions: [],
  userCompanies: [],
  settings: null,
  currentCompanyId: null,
  loading: false,
  sessionExpiring: false,
  login: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  changePassword: vi.fn(async () => {}),
  resetPassword: vi.fn(async () => {}),
  setCurrentCompanyId: vi.fn(),
  hasPermission: vi.fn(() => false),
  refreshSession: vi.fn(),
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide auth context value", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuthValue),
    });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.firebaseUser).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.currentCompanyId).toBeNull();
  });

  it("should throw error when used outside AuthProvider", () => {
    // Suppress console.error for expected error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");

    consoleSpy.mockRestore();
  });

  it("should provide auth methods", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuthValue),
    });

    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
    expect(typeof result.current.changePassword).toBe("function");
    expect(typeof result.current.resetPassword).toBe("function");
    expect(typeof result.current.setCurrentCompanyId).toBe("function");
    expect(typeof result.current.hasPermission).toBe("function");
    expect(typeof result.current.refreshSession).toBe("function");
  });

  it("should return user when authenticated", () => {
    const authedValue: AuthContextType = {
      ...mockAuthValue,
      firebaseUser: { uid: "abc123", email: "test@test.com" } as any,
      user: {
        id: "abc123",
        email: "test@test.com",
        username: "testuser",
        displayName: "Test User",
        isActive: true,
        avatarUrl: "https://example.com/avatar.png",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      loading: false,
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(authedValue),
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe("test@test.com");
    expect(result.current.user?.username).toBe("testuser");
    expect(result.current.loading).toBe(false);
  });

  it("should indicate loading state", () => {
    const loadingValue: AuthContextType = {
      ...mockAuthValue,
      loading: true,
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(loadingValue),
    });

    expect(result.current.loading).toBe(true);
  });
});
