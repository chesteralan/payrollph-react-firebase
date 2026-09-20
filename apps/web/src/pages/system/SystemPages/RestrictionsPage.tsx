import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/Card";

export function RestrictionsPage() {
  const { canView } = usePermissions();
  if (!canView("system", "users"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Restrictions</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 mb-4">
            Use the "Manage Permissions" button (shield icon) in the User
            Accounts page to configure department and section permissions for
            each user.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
