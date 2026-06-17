import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Edit,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Company } from "@/types";
import type { Department, Section } from "@/types";
import type { SortConfig } from "@/hooks/useTableSort";

interface CompanyTableProps {
  companies: Company[];
  loading: boolean;
  searchQuery: string;
  sortConfig: SortConfig<Company> | null;
  canEdit: (department: Department, section: Section) => boolean;
  canDelete: (department: Department, section: Section) => boolean;
  onSearchChange: (query: string) => void;
  onEdit: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  onSoftDelete: (company: Company) => void;
  onRestore: (company: Company) => void;
  onPermanentDelete: (id: string) => void;
  onSort: (key: keyof Company) => void;
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentSort: SortConfig<Company> | null;
  onSort: (key: string) => void;
}) {
  return (
    <th
      className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentSort?.key === sortKey ? (
          currentSort.direction === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </th>
  );
}

export function CompanyTable({
  companies,
  loading,
  searchQuery,
  sortConfig,
  canEdit,
  canDelete,
  onSearchChange,
  onEdit,
  onToggleStatus,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
  onSort,
}: CompanyTableProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardContent>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader
                label="Name"
                sortKey="name"
                currentSort={sortConfig}
                onSort={(key) => onSort(key as keyof Company)}
              />
              <SortableHeader
                label="Address"
                sortKey="address"
                currentSort={sortConfig}
                onSort={(key) => onSort(key as keyof Company)}
              />
              <SortableHeader
                label="TIN"
                sortKey="tin"
                currentSort={sortConfig}
                onSort={(key) => onSort(key as keyof Company)}
              />
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Workdays
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Columns
              </th>
              <SortableHeader
                label="Status"
                sortKey="isActive"
                currentSort={sortConfig}
                onSort={(key) => onSort(key as keyof Company)}
              />
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No companies found
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.address || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.tin || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.defaultWorkdays || 22}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.columnGroup ? (
                        Object.entries(c.columnGroup)
                          .filter(([, v]) => v)
                          .map(([key]) => (
                            <span
                              key={key}
                              className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                              {key}
                            </span>
                          ))
                      ) : (
                        <span className="text-xs text-gray-400">All</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        c.isDeleted
                          ? "bg-red-100 text-red-800"
                          : c.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {c.isDeleted
                        ? "Archived"
                        : c.isActive
                          ? "Active"
                          : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.isDeleted ? (
                        <>
                          <ConfirmDialog
                            title="Restore Company"
                            message={`Restore ${c.name}? It will be marked as active again.`}
                            confirmText="Restore"
                            variant="info"
                            onConfirm={() => onRestore(c)}
                          >
                            {(open) => (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={open}
                                title="Restore"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </ConfirmDialog>
                          {canDelete("system", "companies") && (
                            <ConfirmDialog
                              title="Permanently Delete Company"
                              message={`Permanently delete ${c.name}? This action cannot be undone and all associated data will be lost.`}
                              confirmText="Delete Permanently"
                              onConfirm={() => onPermanentDelete(c.id)}
                            >
                              {(open) => (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={open}
                                  title="Permanent delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </ConfirmDialog>
                          )}
                        </>
                      ) : (
                        <>
                          {canEdit("system", "companies") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(c)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <ConfirmDialog
                            title={c.isActive ? "Deactivate Company" : "Activate Company"}
                            message={`${c.isActive ? "Deactivate" : "Activate"} ${c.name}?`}
                            confirmText={c.isActive ? "Deactivate" : "Activate"}
                            variant={c.isActive ? "warning" : "info"}
                            onConfirm={() => onToggleStatus(c)}
                          >
                            {(open) => (
                              <Button variant="ghost" size="sm" onClick={open}>
                                {c.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            )}
                          </ConfirmDialog>
                          {canDelete("system", "companies") && (
                            <ConfirmDialog
                              title="Archive Company"
                              message={`Archive ${c.name}? It can be restored later.`}
                              confirmText="Archive"
                              variant="warning"
                              onConfirm={() => onSoftDelete(c)}
                            >
                              {(open) => (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={open}
                                  title="Archive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </ConfirmDialog>
                          )}
                        </>
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
