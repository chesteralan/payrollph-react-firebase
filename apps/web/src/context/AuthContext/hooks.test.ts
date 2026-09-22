import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import React from "react";
import { AuthStoreContext } from "./hooks";
import {
  useCurrentCompanyId,
  useCurrentUser,
  useAuthLoading,
  useUserPermissions,
} from "./hooks";
import { ValueStore } from "@/utils/valueStore";
import type { UserAccount, UserRestriction } from "@/types";

function createStoreMocks(overrides = {}) {
  return {
    user: new ValueStore<UserAccount | null>(null),
    currentCompanyId: new ValueStore<string | null>(null),
    loading: new ValueStore<boolean>(true),
    restrictions: new ValueStore<UserRestriction[]>([]),
    ...overrides,
  };
}

function createWrapper(stores: ReturnType<typeof createStoreMocks>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      AuthStoreContext.Provider,
      { value: stores },
      children,
    );
  };
}

describe("useCurrentCompanyId", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useCurrentCompanyId());
    }).toThrow("useCurrentCompanyId must be used within AuthProvider");
  });

  it("returns initial null value", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCurrentCompanyId(), { wrapper });
    expect(result.current).toBeNull();
  });

  it("updates when store value changes", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCurrentCompanyId(), { wrapper });

    act(() => {
      stores.currentCompanyId.set("company-123");
    });

    expect(result.current).toBe("company-123");
  });
});

describe("useCurrentUser", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useCurrentUser());
    }).toThrow("useCurrentUser must be used within AuthProvider");
  });

  it("returns initial null value", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    expect(result.current).toBeNull();
  });

  it("updates when user is set", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    const mockUser: UserAccount = {
      id: "user-1",
      email: "test@example.com",
      username: "testuser",
      displayName: "Test User",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      stores.user.set(mockUser);
    });

    expect(result.current).toEqual(mockUser);
  });
});

describe("useAuthLoading", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useAuthLoading());
    }).toThrow("useAuthLoading must be used within AuthProvider");
  });

  it("returns initial true value", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useAuthLoading(), { wrapper });
    expect(result.current).toBe(true);
  });

  it("updates when loading changes", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useAuthLoading(), { wrapper });

    act(() => {
      stores.loading.set(false);
    });

    expect(result.current).toBe(false);
  });
});

describe("useUserPermissions", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useUserPermissions());
    }).toThrow("useUserPermissions must be used within AuthProvider");
  });

  it("returns empty restrictions and hasPermission function", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useUserPermissions(), { wrapper });

    expect(result.current.restrictions).toEqual([]);
    expect(typeof result.current.hasPermission).toBe("function");
  });

  it("hasPermission returns false when no matching restriction", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useUserPermissions(), { wrapper });

    expect(
      result.current.hasPermission("payroll", "payroll", "view"),
    ).toBe(false);
  });

  it("hasPermission returns correct values based on restrictions", () => {
    const restrictions: UserRestriction[] = [
      {
        id: "r1",
        userId: "u1",
        department: "payroll",
        section: "payroll",
        canView: true,
        canAdd: true,
        canEdit: false,
        canDelete: false,
      },
    ];

    const stores = createStoreMocks({
      restrictions: new ValueStore<UserRestriction[]>(restrictions),
    });
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useUserPermissions(), { wrapper });

    expect(
      result.current.hasPermission("payroll", "payroll", "view"),
    ).toBe(true);
    expect(
      result.current.hasPermission("payroll", "payroll", "add"),
    ).toBe(true);
    expect(
      result.current.hasPermission("payroll", "payroll", "edit"),
    ).toBe(false);
    expect(
      result.current.hasPermission("payroll", "payroll", "delete"),
    ).toBe(false);
  });

  it("hasPermission returns false for unmatched department/section", () => {
    const restrictions: UserRestriction[] = [
      {
        id: "r1",
        userId: "u1",
        department: "payroll",
        section: "payroll",
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    ];

    const stores = createStoreMocks({
      restrictions: new ValueStore<UserRestriction[]>(restrictions),
    });
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useUserPermissions(), { wrapper });

    expect(
      result.current.hasPermission("employees", "employees", "view"),
    ).toBe(false);
  });
});
