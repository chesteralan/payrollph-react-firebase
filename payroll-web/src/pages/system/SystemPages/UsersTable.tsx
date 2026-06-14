import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { CheckSquare, ChevronDown, ChevronsUpDown, ChevronUp, Edit, Shield, Square, Trash2 } from "lucide-react";
import type { Department, Section, UserAccount, UserRestriction } from "@/types";
import type { SortConfig } from "@/hooks/useTableSort";

interface UserWithRestrictions extends UserAccount {
  restrictions?: UserRestriction[];
  role?: string;
}

interface UsersTableProps {
  sortedUsers: UserWithRestrictions[];
  searchQuery: string;
  loading: boolean;
  selectedIds: Set<string>;
  sortConfig: SortConfig<UserWithRestrictions> | null;
  canEdit: (department: Department, section: Section) => boolean;
  canDelete: (department: Department, section: Section) => boolean;
  onSearchChange: (value: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (key: keyof UserWithRestrictions) => void;
  onEditRestrictions: (userId: string) => void;
  onToggleStatus: (user: UserAccount) => void;
  onEdit: (user: UserWithRestrictions) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({
  sortedUsers,
  searchQuery,
  loading,
  selectedIds,
  sortConfig,
  canEdit: canEditUser,
  canDelete: canDeleteUser,
  onSearchChange,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onEditRestrictions,
  onToggleStatus,
  onEdit,
  onDelete,
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search users by name, email, or role..."
          />
          <span className="text-sm text-gray-500 ml-auto">
            {sortedUsers.length} user
            {sortedUsers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={onToggleSelectAll}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {selectedIds.size === sortedUsers.length &&
                  sortedUsers.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                onClick={() => onSort("username")}
              >
                <div className="flex items-center gap-1">
                  Username
                  {sortConfig?.key === "username" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                onClick={() => onSort("displayName")}
              >
                <div className="flex items-center gap-1">
                  Display Name
                  {sortConfig?.key === "displayName" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                onClick={() => onSort("email")}
              >
                <div className="flex items-center gap-1">
                  Email
                  {sortConfig?.key === "email" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                onClick={() => onSort("isActive")}
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  {sortConfig?.key === "isActive" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={
                    selectedIds.has(user.id)
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4">
                    <button
                      onClick={() => onToggleSelect(user.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {selectedIds.has(user.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.displayName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRestrictions(user.id)}
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(user)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      {canEditUser("system", "users") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteUser("system", "users") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
