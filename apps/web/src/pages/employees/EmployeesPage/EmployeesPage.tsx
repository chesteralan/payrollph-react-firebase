import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { useTableSort } from "@/hooks/useTableSort";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { SearchBar } from "@/components/ui/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import {
  CheckSquare,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Edit,
  Eye,
  Plus,
  Search,
  Square,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { Employee, EmployeeGroup } from "@/types";
import type { NameRecord } from "@/pages/lists/NamesListPage/NamesListPage.types";

interface EmployeeRowProps {
  emp: Employee & { name?: string };
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleStatus: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string, code: string) => void;
  onView: (id: string) => void;
  canEditEmployee: boolean;
  canDeleteEmployee: boolean;
}

const EmployeeRow = React.memo(function EmployeeRow({
  emp,
  isSelected,
  onToggleSelect,
  onToggleStatus,
  onEdit,
  onDelete,
  onView,
  canEditEmployee,
  canDeleteEmployee,
}: EmployeeRowProps) {
  return (
    <tr className={isSelected ? "bg-blue-50" : "hover:bg-gray-50"}>
      <td className="px-4">
        <button
          onClick={() => onToggleSelect(emp.id)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {emp.employeeCode}
        </div>
        {emp.name && <div className="text-xs text-gray-500">{emp.name}</div>}
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onToggleStatus(emp)}
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
            emp.isActive
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {emp.isActive ? (
            <UserCheck className="w-3 h-3" />
          ) : (
            <UserX className="w-3 h-3" />
          )}
          {emp.isActive ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "-"}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(emp.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          {canEditEmployee && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(emp)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteEmployee && (
            <ConfirmDialog
              title="Archive Employee"
              message={`Archive ${emp.employeeCode}? It can be restored from Trash.`}
              confirmText="Archive"
              variant="danger"
              onConfirm={() => onDelete(emp.id, emp.employeeCode)}
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
  );
});

export function EmployeesPage() {
  const { currentCompanyId } = useAuth();
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [employees, setEmployees] = useState<(Employee & { name?: string })[]>(
    [],
  );
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeCode: "",
    nameId: "",
    groupId: "",
    positionId: "",
    areaId: "",
    statusId: "",
    hireDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<
    "active" | "inactive" | "terminated"
  >("active");
  const [names, setNames] = useState<NameRecord[]>([]);
  const [nameSearchQuery, setNameSearchQuery] = useState("");
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState<NameRecord | null>(null);
  const nameDropdownRef = useRef<HTMLDivElement>(null);

  const fetchGroups = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "groups")));
    setGroups(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeeGroup[],
    );
  }, []);

  const fetchNames = useCallback(async () => {
    const snap = await getDocs(collection(db, "names"));
    setNames(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NameRecord[]);
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    const snap = await getDocs(
      query(
        collection(db, "employees"),
        where("companyId", "==", currentCompanyId),
      ),
    );

    const all = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as (Employee & { name?: string; deletedAt?: unknown })[];
    setEmployees(all.filter((e) => !e.deletedAt));
    setLoading(false);
  }, [currentCompanyId]);

  useEffect(() => {
    if (currentCompanyId) {
      fetchEmployees();
      fetchGroups();
      fetchNames();
    }
  }, [currentCompanyId, fetchEmployees, fetchGroups, fetchNames]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nameDropdownRef.current &&
        !nameDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNameDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    const data = {
      ...formData,
      companyId: currentCompanyId,
      isActive: true,
      updatedAt: new Date(),
    };

    if (editingId) {
      await updateDoc(doc(db, "employees", editingId), data);
      addToast({
        type: "success",
        title: "Employee updated",
        message: `${formData.employeeCode} has been updated`,
      });
    } else {
      await addDoc(collection(db, "employees"), {
        ...data,
        createdAt: new Date(),
      });
      addToast({
        type: "success",
        title: "Employee created",
        message: `${formData.employeeCode} has been added`,
      });
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      employeeCode: "",
      nameId: "",
      groupId: "",
      positionId: "",
      areaId: "",
      statusId: "",
      hireDate: "",
    });
    fetchEmployees();
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
      employeeCode: employee.employeeCode,
      nameId: employee.nameId,
      groupId: employee.groupId || "",
      positionId: employee.positionId || "",
      areaId: employee.areaId || "",
      statusId: employee.statusId || "",
      hireDate: employee.hireDate
        ? new Date(employee.hireDate).toISOString().split("T")[0] || ""
        : "",
    });
    const nameRecord = names.find((n) => n.id === employee.nameId);
    setSelectedName(nameRecord || null);
    setNameSearchQuery("");
    setShowForm(true);
  };

  const handleDelete = async (id: string, code: string) => {
    await updateDoc(doc(db, "employees", id), {
      deletedAt: serverTimestamp(),
      isActive: false,
      updatedAt: new Date(),
    });
    addToast({
      type: "success",
      title: "Employee archived",
      message: `${code} has been moved to trash`,
    });
    fetchEmployees();
  };

  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = !employee.isActive;
    await updateDoc(doc(db, "employees", employee.id), {
      isActive: newStatus,
      updatedAt: new Date(),
    });
    addToast({
      type: "info",
      title: "Status updated",
      message: `${employee.employeeCode} is now ${newStatus ? "active" : "inactive"}`,
    });
    fetchEmployees();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === sortedEmployees.length
        ? new Set()
        : new Set(sortedEmployees.map((e) => e.id)),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatusUpdate = async () => {
    setBulkStatusLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "employees", id), {
          isActive: bulkStatusValue === "active",
          updatedAt: new Date(),
        });
      });
      await batch.commit();
      addToast({
        type: "success",
        title: `Updated ${selectedIds.size} employee(s) to ${bulkStatusValue}`,
      });
      setShowBulkStatus(false);
      clearSelection();
      fetchEmployees();
    } catch {
      addToast({ type: "error", title: "Bulk status update failed" });
    }
    setBulkStatusLoading(false);
  };

  const handleBulkDelete = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) =>
        batch.update(doc(db, "employees", id), {
          deletedAt: serverTimestamp(),
          isActive: false,
          updatedAt: new Date(),
        }),
      );
      await batch.commit();
      addToast({
        type: "success",
        title: `Archived ${selectedIds.size} employee(s)`,
      });
      clearSelection();
      fetchEmployees();
    } catch {
      addToast({ type: "error", title: "Bulk archive failed" });
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchQuery === "" ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.nameId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        groups
          .find((g) => g.id === emp.groupId)
          ?.name.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && emp.isActive) ||
        (statusFilter === "inactive" && !emp.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter, groups]);

  const filteredNames = useMemo(() => {
    if (nameSearchQuery === "") return names.slice(0, 20);
    const q = nameSearchQuery.toLowerCase();
    return names
      .filter(
        (n) =>
          n.firstName.toLowerCase().includes(q) ||
          n.lastName.toLowerCase().includes(q) ||
          (n.middleName || "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [names, nameSearchQuery]);

  const handleSelectName = (name: NameRecord) => {
    setSelectedName(name);
    setFormData({ ...formData, nameId: name.id });
    setNameSearchQuery("");
    setShowNameDropdown(false);
  };

  const handleClearName = () => {
    setSelectedName(null);
    setFormData({ ...formData, nameId: "" });
  };

  const {
    items: sortedEmployees,
    handleSort,
    sortConfig,
  } = useTableSort(
    filteredEmployees.map((emp) => ({
      ...emp,
      sortName: emp.name || emp.nameId || "",
    })),
    "employeeCode",
  );

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  if (!canView("employees", "employees")) {
    return <div className="text-center py-12 text-gray-500">Access denied</div>;
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        {canAdd("employees", "employees") && (
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
                employeeCode: "",
                nameId: "",
                groupId: "",
                positionId: "",
                areaId: "",
                statusId: "",
                hireDate: "",
              });
              setSelectedName(null);
              setNameSearchQuery("");
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-800">
            {selectedCount} employee{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            {canEdit("employees", "employees") && (
              <Button size="sm" onClick={() => setShowBulkStatus(true)}>
                Change Status
              </Button>
            )}
            {canDelete("employees", "employees") && (
              <ConfirmDialog
                title="Bulk Archive"
                message={`Archive ${selectedCount} selected employee${selectedCount !== 1 ? "s" : ""}? They can be restored from Trash.`}
                confirmText="Archive All"
                variant="warning"
                onConfirm={handleBulkDelete}
              >
                {(open) => (
                  <Button size="sm" variant="danger" onClick={open}>
                    Archive
                  </Button>
                )}
              </ConfirmDialog>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <Sheet
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Employee" : "Add Employee"}
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="employee-form">
              {editingId ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="employeeCode"
            label="Employee Code"
            value={formData.employeeCode}
            onChange={(e) =>
              setFormData({ ...formData, employeeCode: e.target.value })
            }
            required
          />
          <div ref={nameDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            {selectedName ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <span className="flex-1 text-sm">
                  {selectedName.firstName} {selectedName.middleName || ""}{" "}
                  {selectedName.lastName}
                  {selectedName.suffix ? `, ${selectedName.suffix}` : ""}
                </span>
                <button
                  type="button"
                  onClick={handleClearName}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search names..."
                  value={nameSearchQuery}
                  onChange={(e) => {
                    setNameSearchQuery(e.target.value);
                    setShowNameDropdown(true);
                  }}
                  onFocus={() => setShowNameDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}
            {showNameDropdown && !selectedName && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredNames.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No names found
                  </div>
                ) : (
                  filteredNames.map((name) => (
                    <button
                      key={name.id}
                      type="button"
                      onClick={() => handleSelectName(name)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {name.firstName} {name.middleName || ""} {name.lastName}
                      {name.suffix ? `, ${name.suffix}` : ""}
                    </button>
                  ))
                )}
              </div>
            )}
            <input type="hidden" name="nameId" value={formData.nameId} />
          </div>
          <Input
            id="hireDate"
            label="Hire Date"
            type="date"
            value={formData.hireDate}
            onChange={(e) =>
              setFormData({ ...formData, hireDate: e.target.value })
            }
          />
        </form>
      </Sheet>

      <Sheet
        isOpen={showBulkStatus}
        onClose={() => setShowBulkStatus(false)}
        title={`Change Status for ${selectedCount} Employee${selectedCount !== 1 ? "s" : ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowBulkStatus(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={bulkStatusLoading}
            >
              {bulkStatusLoading ? "Updating..." : "Apply Changes"}
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Status
          </label>
          <select
            value={bulkStatusValue}
            onChange={(e) =>
              setBulkStatusValue(
                e.target.value as "active" | "inactive" | "terminated",
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </Sheet>

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search employees by name, code, or group..."
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="text-sm text-gray-500 ml-auto">
              {sortedEmployees.length} employee
              {sortedEmployees.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {selectedIds.size === sortedEmployees.length &&
                      sortedEmployees.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort("employeeCode")}
                  >
                    <div className="flex items-center gap-1">
                      Code
                      {sortConfig?.key === "employeeCode" ? (
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
                    onClick={() => handleSort("isActive")}
                  >
                    <div className="flex items-center gap-1">
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
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort("hireDate")}
                  >
                    <div className="flex items-center gap-1">
                      Hire Date
                      {sortConfig?.key === "hireDate" ? (
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
                    <td colSpan={5} className="px-0 py-0">
                      <TableSkeleton rows={10} cols={5} />
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No employees found
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <EmployeeRow
                      key={emp.id}
                      emp={emp}
                      isSelected={selectedIds.has(emp.id)}
                      onToggleSelect={toggleSelect}
                      onToggleStatus={handleToggleStatus}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={(id) => navigate(`/employees/${id}`)}
                      canEditEmployee={canEdit("employees", "employees")}
                      canDeleteEmployee={canDelete("employees", "employees")}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={sortedEmployees.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
