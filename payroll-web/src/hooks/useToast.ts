import { useContext } from "react";
import { ToastContext } from "../components/ui/Toast/toast-context";

/**
 * Hook to access the global toast notification system.
 * Must be used within a ToastProvider.
 *
 * @returns The ToastContext containing:
 *  - `toast(data)` — Show a toast notification (`{ title, description, variant?: 'success'|'error'|'warning'|'info' }`)
 *  - `success(title, description?)` — Shorthand for success toast
 *  - `error(title, description?)` — Shorthand for error toast
 *  - `warning(title, description?)` — Shorthand for warning toast
 *  - `info(title, description?)` — Shorthand for info toast
 *  - `dismiss(id)` — Dismiss a specific toast
 *  - `toasts` — Current list of active toasts
 *
 * @throws {Error} If used outside of a ToastProvider
 *
 * @example
 * ```tsx
 * const { toast, success, error } = useToast();
 * success('Saved!', 'Employee record updated successfully');
 * error('Failed', 'Unable to save changes');
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
