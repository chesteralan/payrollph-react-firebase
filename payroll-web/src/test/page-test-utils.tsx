import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, type RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import { AuthContext, type AuthContextType } from "@/context/auth";
import { ToastContext, type ToastContextType } from "@/components/ui/Toast/toast-context";
import { CompanyContext, type CompanyContextType } from "@/context/company";

export function createMockAuthContextValue(
  overrides: Partial<AuthContextType> = {},
): AuthContextType {
  return {
    firebaseUser: null,
    user: { id: "test-user", email: "test@test.com", displayName: "Test User" },
    restrictions: [],
    userCompanies: [],
    settings: { theme: "light", itemsPerPage: 25, locale: "en-US", defaultCompanyId: "" },
    currentCompanyId: "test-company",
    loading: false,
    sessionExpiring: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    setCurrentCompanyId: vi.fn(),
    hasPermission: vi.fn(() => true),
    refreshSession: vi.fn(),
    ...overrides,
  };
}

export function createMockToastContextValue(
  overrides: Partial<ToastContextType> = {},
): ToastContextType {
  return {
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    ...overrides,
  };
}

export function createMockCompanyContextValue(
  overrides: Partial<CompanyContextType> = {},
): CompanyContextType {
  return {
    companies: [],
    selectedCompany: null,
    selectCompany: vi.fn(),
    loading: false,
    ...overrides,
  };
}

interface RenderOptions {
  authValue?: AuthContextType;
  toastValue?: ToastContextType;
  companyValue?: CompanyContextType;
  routerInitialEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {},
): RenderResult {
  const {
    authValue = createMockAuthContextValue(),
    toastValue = createMockToastContextValue(),
    companyValue = createMockCompanyContextValue(),
    routerInitialEntries = ["/"],
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={routerInitialEntries}>
        <AuthContext.Provider value={authValue}>
          <ToastContext.Provider value={toastValue}>
            <CompanyContext.Provider value={companyValue}>
              {children}
            </CompanyContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
