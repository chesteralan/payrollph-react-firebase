import { useMemo } from "react";

interface UseRoleBasedViewOptions {
  userRole: string;
  adminViews: string[];
  operatorViews: string[];
}

export function useRoleBasedView({
  userRole,
  adminViews,
  operatorViews,
}: UseRoleBasedViewOptions) {
  return useMemo(() => {
    const isAdmin = userRole === "admin" || userRole === "superadmin";
    return {
      isAdmin,
      allowedViews: isAdmin ? adminViews : operatorViews,
      canAccess: (view: string) =>
        isAdmin
          ? adminViews.includes(view)
          : operatorViews.includes(view),
      canEdit: isAdmin,
      canDelete: isAdmin,
      canExport: true,
    };
  }, [userRole, adminViews, operatorViews]);
}
