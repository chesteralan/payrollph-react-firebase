import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useCompany } from "./useCompany";
import type { Company } from "../types";

// The hook imports CompanyContext from @/context/CompanyContext, but that barrel
// re-exports only CompanyProvider (not CompanyContext). We mock the module to
// provide the same CompanyContext that the real @/context/company exports, so
// our test wrapper's Provider matches the hook's useContext.
vi.mock("@/context/CompanyContext", async (importOriginal) => {
  const mod = await importOriginal();
  const { CompanyContext: RealCtx } = await import("@/context/company");
  return { ...mod, CompanyContext: RealCtx };
});

import { CompanyContext, type CompanyContextType } from "@/context/company";

function createWrapper(contextValue: CompanyContextType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      CompanyContext.Provider,
      { value: contextValue },
      children,
    );
  };
}

const mockCompanies: Company[] = [
  {
    id: "company-1",
    name: "Acme Corp",
    address: "123 Main St",
    tin: "123-456-789",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "company-2",
    name: "Globex Inc",
    address: "456 Oak Ave",
    tin: "987-654-321",
    isActive: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-06-01"),
  },
];

describe("useCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide company context", () => {
    const { result } = renderHook(() => useCompany(), {
      wrapper: createWrapper({
        companies: [],
        selectedCompany: null,
        selectCompany: vi.fn(),
        loading: false,
      }),
    });

    expect(result.current).toBeDefined();
    expect(result.current.companies).toEqual([]);
    expect(result.current.selectedCompany).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.selectCompany).toBe("function");
  });

  it("should throw error when used outside CompanyProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCompany());
    }).toThrow("useCompany must be used within CompanyProvider");

    consoleSpy.mockRestore();
  });

  it("should provide company list from context", () => {
    const { result } = renderHook(() => useCompany(), {
      wrapper: createWrapper({
        companies: mockCompanies,
        selectedCompany: null,
        selectCompany: vi.fn(),
        loading: false,
      }),
    });

    expect(result.current.companies).toHaveLength(2);
    expect(result.current.companies[0].name).toBe("Acme Corp");
    expect(result.current.companies[1].name).toBe("Globex Inc");
  });

  it("should provide selected company", () => {
    const { result } = renderHook(() => useCompany(), {
      wrapper: createWrapper({
        companies: [],
        selectedCompany: mockCompanies[0],
        selectCompany: vi.fn(),
        loading: false,
      }),
    });

    expect(result.current.selectedCompany).not.toBeNull();
    expect(result.current.selectedCompany?.id).toBe("company-1");
    expect(result.current.selectedCompany?.name).toBe("Acme Corp");
  });

  it("should call selectCompany from context", () => {
    const selectCompany = vi.fn();
    const { result } = renderHook(() => useCompany(), {
      wrapper: createWrapper({
        companies: [],
        selectedCompany: null,
        selectCompany,
        loading: false,
      }),
    });

    result.current.selectCompany(mockCompanies[1]);

    expect(selectCompany).toHaveBeenCalledTimes(1);
    expect(selectCompany).toHaveBeenCalledWith(mockCompanies[1]);
  });

  it("should indicate loading state", () => {
    const { result } = renderHook(() => useCompany(), {
      wrapper: createWrapper({
        companies: [],
        selectedCompany: null,
        selectCompany: vi.fn(),
        loading: true,
      }),
    });

    expect(result.current.loading).toBe(true);
  });

  it("should handle no companies gracefully", () => {
    const { result } = renderHook(() => useCompany(), {
      wrapper: createWrapper({
        companies: [],
        selectedCompany: null,
        selectCompany: vi.fn(),
        loading: false,
      }),
    });

    expect(result.current.companies).toHaveLength(0);
    expect(result.current.selectedCompany).toBeNull();
  });

  it("should update when context value changes", () => {
    // Use a mutable container that the wrapper reads from so we can update
    // the value without creating a new wrapper component.
    const valueRef = {
      current: {
        companies: [] as Company[],
        selectedCompany: null as Company | null,
        selectCompany: vi.fn(),
        loading: false,
      },
    };
    function UpdatableWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        CompanyContext.Provider,
        { value: valueRef.current },
        children,
      );
    }

    const { result, rerender } = renderHook(() => useCompany(), {
      wrapper: UpdatableWrapper,
    });

    expect(result.current.companies).toHaveLength(0);

    // Update the mutable ref and force a re-render
    valueRef.current = {
      companies: mockCompanies,
      selectedCompany: mockCompanies[0],
      selectCompany: vi.fn(),
      loading: false,
    };
    rerender();

    expect(result.current.companies).toHaveLength(2);
    expect(result.current.selectedCompany?.name).toBe("Acme Corp");
  });
});
