import { CheckSquare, ChevronDown, ChevronsUpDown, ChevronUp, Edit, Square, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { NameRecord } from "./NamesListPage.types";
import type { SortDirection } from "@/hooks/useTableSort";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface NamesTableProps {
  names: (NameRecord & { fullName: string })[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIds: Set<string>;
  sortConfig: SortConfig | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  onEdit: (name: NameRecord) => void;
  onDelete: (id: string, fullName: string) => void;
}

export function NamesTable({
  names,
  loading,
  searchQuery,
  onSearchChange,
  selectedIds,
  sortConfig,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onEdit,
  onDelete,
}: NamesTableProps) {
  const { canEdit, canDelete } = usePermissions();
  const allSelected = names.length > 0 && selectedIds.size === names.length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search names..."
        />
        <span className="text-sm text-gray-500 ml-auto">
          {names.length} name{names.length !== 1 ? "s" : ""}
        </span>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">
              <button
                onClick={onToggleSelectAll}
                className="text-gray-500 hover:text-gray-700"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>
            <th
              className="text-left px-2 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
              onClick={() => onSort("fullName")}
            >
              <div className="flex items-center gap-1">
                Name
                {sortConfig?.key === "fullName" ? (
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
                colSpan={3}
                className="px-6 py-4 text-center text-gray-500"
              >
                Loading...
              </td>
            </tr>
          ) : names.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-6 py-4 text-center text-gray-500"
              >
                No names found
              </td>
            </tr>
          ) : (
            names.map((n) => (
              <tr
                key={n.id}
                className={
                  selectedIds.has(n.id) ? "bg-blue-50" : "hover:bg-gray-50"
                }
              >
                <td className="px-4">
                  <button
                    onClick={() => onToggleSelect(n.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {selectedIds.has(n.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-2 py-4 text-sm text-gray-900">
                  {n.firstName} {n.middleName || ""} {n.lastName}
                  {n.suffix ? `, ${n.suffix}` : ""}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canEdit("lists", "names") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(n)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete("lists", "names") && (
                      <ConfirmDialog
                        title="Archive Name"
                        message={`Archive ${n.firstName} ${n.lastName}? It can be restored from Trash.`}
                        confirmText="Archive"
                        variant="danger"
                        onConfirm={() =>
                          onDelete(n.id, `${n.firstName} ${n.lastName}`)
                        }
                      >
                        {(open) => (
                          <Button variant="ghost" size="sm" onClick={open}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </ConfirmDialog>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


