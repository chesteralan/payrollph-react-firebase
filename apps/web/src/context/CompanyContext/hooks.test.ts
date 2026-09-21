import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import React from "react";
import { CompanyStoreContext } from "./hooks";
import { useCurrentCompany, useCompanies, useCompanyLoading } from "./hooks";
import { ValueStore } from "@/utils/valueStore";
import type { Company } from "@/types";

function createStoreMocks(overrides = {}) {
  return {
    selectedCompany: new ValueStore<Company | null>(null),
    companies: new ValueStore<Company[]>([]),
    loading: new ValueStore<boolean>(true),
    ...overrides,
  };
}

function createWrapper(stores: ReturnType<typeof createStoreMocks>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      CompanyStoreContext.Provider,
      { value: stores },
      children,
    );
  };
}

const mockCompany: Company = {
  id: "company-1",
  name: "Acme Corp",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("useCurrentCompany", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useCurrentCompany());
    }).toThrow("useCurrentCompany must be used within CompanyProvider");
  });

  it("returns initial null value", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCurrentCompany(), { wrapper });
    expect(result.current).toBeNull();
  });

  it("updates when selected company changes", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCurrentCompany(), { wrapper });

    act(() => {
      stores.selectedCompany.set(mockCompany);
    });

    expect(result.current).toEqual(mockCompany);
  });
});

describe("useCompanies", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useCompanies());
    }).toThrow("useCompanies must be used within CompanyProvider");
  });

  it("returns initial empty array", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCompanies(), { wrapper });
    expect(result.current).toEqual([]);
  });

  it("updates when companies list changes", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCompanies(), { wrapper });

    act(() => {
      stores.companies.set([mockCompany]);
    });

    expect(result.current).toEqual([mockCompany]);
  });
});

describe("useCompanyLoading", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useCompanyLoading());
    }).toThrow("useCompanyLoading must be used within CompanyProvider");
  });

  it("returns initial true value", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCompanyLoading(), { wrapper });
    expect(result.current).toBe(true);
  });

  it("updates when loading changes", () => {
    const stores = createStoreMocks();
    const wrapper = createWrapper(stores);
    const { result } = renderHook(() => useCompanyLoading(), { wrapper });

    act(() => {
      stores.loading.set(false);
    });

    expect(result.current).toBe(false);
  });
});
