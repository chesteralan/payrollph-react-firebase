import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { ToastProvider } from "@/components/ui/Toast";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders aggregates all context providers into a single wrapper
 * to reduce nesting depth in App.tsx and provide a clear provider order.
 *
 * Provider order (logical dependency chain):
 *   1. AuthProvider     – authentication state, user data, permissions
 *   2. CompanyProvider  – company/tenant selection (depends on user identity)
 *   3. ToastProvider    – toast notifications (used by all pages)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <CompanyProvider>
        <ToastProvider>{children}</ToastProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}
