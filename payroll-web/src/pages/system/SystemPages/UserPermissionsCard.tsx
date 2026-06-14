import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, Save, X } from "lucide-react";
import type { Department, Section, UserRestriction } from "@/types";
import { DEPARTMENTS } from "./SystemPages.constants";

interface UserPermissionsCardProps {
  editingRestrictions: string;
  restrictions: UserRestriction[];
  onToggleRestriction: (
    userId: string,
    department: Department,
    section: Section,
    action: string,
  ) => void;
  onClose: () => void;
}

export function UserPermissionsCard({
  editingRestrictions,
  restrictions,
  onToggleRestriction,
  onClose,
}: UserPermissionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manage Permissions</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 sticky left-0 bg-gray-50">
                  Department / Section
                </th>
                <th className="text-center px-3 py-2">View</th>
                <th className="text-center px-3 py-2">Add</th>
                <th className="text-center px-3 py-2">Edit</th>
                <th className="text-center px-3 py-2">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEPARTMENTS.map((dept) => (
                <tr key={dept.key} className="bg-gray-100">
                  <td
                    colSpan={5}
                    className="px-3 py-2 font-semibold capitalize"
                  >
                    {dept.key}
                  </td>
                </tr>
              ))}
              {DEPARTMENTS.flatMap((dept) =>
                dept.sections.map((section) => {
                  const restriction = restrictions.find(
                    (r) =>
                      r.department === dept.key && r.section === section,
                  );
                  return (
                    <tr
                      key={`${dept.key}-${section}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 pl-6 capitalize">
                        {section}
                      </td>
                      {["view", "add", "edit", "delete"].map((action) => {
                        const actionKey =
                          action === "view"
                            ? "canView"
                            : action === "add"
                              ? "canAdd"
                              : action === "edit"
                                ? "canEdit"
                                : "canDelete";
                        const isChecked = restriction
                          ? !!restriction[
                              actionKey as keyof UserRestriction
                            ]
                          : false;
                        return (
                          <td
                            key={action}
                            className="px-3 py-2 text-center"
                          >
                            <button
                              onClick={() =>
                                onToggleRestriction(
                                  editingRestrictions,
                                  dept.key,
                                  section,
                                  action,
                                )
                              }
                              className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                                isChecked
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {isChecked ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>
            <Save className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
