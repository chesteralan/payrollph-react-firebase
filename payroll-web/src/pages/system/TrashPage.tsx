import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { usePermissions } from "../../hooks/usePermissions";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import {
  Trash2,
  RotateCcw,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { useTableSort } from "../../hooks/useTableSort";

import type { TrashItem, TrashCollectionDef } from "./TrashPage.types";

const COLLECTIONS = [
  { key: "companies", label: "Companies", nameField: "name" },
  { key: "employees", label: "Employees", nameField: "employeeCode" },
  { key: "names", label: "Names", nameField: "firstName" },
  { key: "payrolls", label: "Payrolls", nameField: "name" },
  { key: "templates", label: "Templates", nameField: "name" },
];

export function TrashPage() {
  const { canView, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const allItems: TrashItem[] = [];

      for (const col of COLLECTIONS) {
        try {
          const q = query(
            collection(db, col.key),
            where("deletedAt", "!=", null),
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            let name: string;
            if (col.key === "names") {
              name =
                `${data.firstName || ""} ${data.middleName || ""} ${data.lastName || ""}`.trim();
            } else {
              name =
                data[col.nameField] ||
                data.name ||
                data.employeeCode ||
                "Unknown";
            }
            allItems.push({
              id: d.id,
              collection: col.key,
              collectionLabel: col.label,
              name,
              deletedAt: data.deletedAt?.toDate?.() || null,
              rawDeletedAt: data.deletedAt,
            });
          });
        } catch {
          // Collection might not exist or have deleted items
        }
      }

      if (!cancelled) {
        setItems(allItems);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const allItems: TrashItem[] = [];

    for (const col of COLLECTIONS) {
      try {
        const q = query(
          collection(db, col.key),
          where("deletedAt", "!=", null),
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          const data = d.data();
          let name: string;
          if (col.key === "names") {
            name =
              `${data.firstName || ""} ${data.middleName || ""} ${data.lastName || ""}`.trim();
          } else {
            name =
              data[col.nameField] ||
              data.name ||
              data.employeeCode ||
              "Unknown";
          }
          allItems.push({
            id: d.id,
            collection: col.key,
            collectionLabel: col.label,
            name,
            deletedAt: data.deletedAt?.toDate?.() || null,
            rawDeletedAt: data.deletedAt,
          });
        });
      } catch {
        // Collection might not exist or have deleted items
      }
    }

    setItems(allItems);
    setLoading(false);
  }, []);

  const handleRestore = async (item: TrashItem) => {
    await updateDoc(doc(db, item.collection, item.id), {
      deletedAt: null,
      isActive: true,
    });
    addToast({
      type: "success",
      title: "Restored",
      message: `${item.name} has been restored`,
    });
    reload();
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    await deleteDoc(doc(db, item.collection, item.id));
    addToast({
      type: "success",
      title: "Permanently deleted",
      message: `${item.name} has been permanently deleted`,
    });
    reload();
  };

  const filtered = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.collectionLabel.toLowerCase().includes(q)
    );
  });

  const {
    items: sortedItems,
    handleSort,
    sortConfig,
  } = useTableSort(
    filtered.map((i) => ({
      ...i,
      sortName: i.name,
      sortDate: i.rawDeletedAt || 0,
    })),
    "sortDate",
  );

  if (!canView("system", "companies"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Trash</h1>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trash..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("collectionLabel")}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {sortConfig?.key === "collectionLabel" ? (
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
                  onClick={() => handleSort("sortName")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortConfig?.key === "sortName" ? (
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
                  onClick={() => handleSort("sortDate")}
                >
                  <div className="flex items-center gap-1">
                    Deleted
                    {sortConfig?.key === "sortDate" ? (
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
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Trash is empty
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={`${item.collection}-${item.id}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.collectionLabel}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.deletedAt
                        ? item.deletedAt.toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit("system", "companies") && (
                          <ConfirmDialog
                            title="Restore Item"
                            message={`Restore ${item.name} from ${item.collectionLabel}?`}
                            confirmText="Restore"
                            variant="info"
                            onConfirm={() => handleRestore(item)}
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
                        )}
                        {canDelete("system", "companies") && (
                          <ConfirmDialog
                            title="Permanently Delete"
                            message={`Permanently delete ${item.name}? This cannot be undone.`}
                            confirmText="Delete Permanently"
                            variant="danger"
                            onConfirm={() => handlePermanentDelete(item)}
                          >
                            {(open) => (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={open}
                                title="Delete permanently"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
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
        </CardContent>
      </Card>
    </div>
  );
}
