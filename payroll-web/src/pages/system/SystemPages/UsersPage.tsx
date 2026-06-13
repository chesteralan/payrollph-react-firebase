import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchBar } from "@/components/ui/SearchBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { useTableSort } from "@/hooks/useTableSort";
import {
  AlertCircle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Edit,
  Plus,
  Save,
  Shield,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  Department,
  Section,
  UserAccount,
  UserRestriction,
} from "@/types";
import { DEPARTMENTS } from "./SystemPages.constants";

export function UsersPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [users, setUsers] = useState<
    (UserAccount & { restrictions?: UserRestriction[] })[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
  });
  const [editingRestrictions, setEditingRestrictions] = useState<string | null>(
    null,
  );
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvPreview, setCsvPreview] = useState<
    {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      department: string;
      section: string;
      isValid: boolean;
      error?: string;
    }[]
  >([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    success: number;
    failed: number;
    duplicates: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const [usersSnap, restrictionsSnap] = await Promise.all([
      getDocs(collection(db, "user_accounts")),
      getDocs(collection(db, "user_accounts_restrictions")),
    ]);
    const usersList = usersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as UserAccount[];
    const restrictionsList = restrictionsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as UserRestriction[];
    const usersWithRestrictions = usersList.map((u) => ({
      ...u,
      restrictions: restrictionsList.filter((r) => r.userId === u.id),
    }));
    setUsers(usersWithRestrictions);
    setLoading(false);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchUsers();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const filteredUsers = useMemo(() => {
    if (searchQuery === "") return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const {
    items: sortedUsers,
    handleSort,
    sortConfig,
  } = useTableSort(filteredUsers, "username");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      username: formData.username,
      email: formData.email,
      displayName: formData.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (editingId) {
      await updateDoc(doc(db, "user_accounts", editingId), data);
    } else {
      await addDoc(collection(db, "user_accounts"), data);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({ username: "", email: "", displayName: "", password: "" });
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this user?")) {
      await deleteDoc(doc(db, "user_accounts", id));
      fetchUsers();
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    await updateDoc(doc(db, "user_accounts", user.id), {
      isActive: !user.isActive,
    });
    fetchUsers();
  };

  const toggleRestriction = async (
    userId: string,
    department: Department,
    section: Section,
    action: string,
  ) => {
    const existing = restrictions.find(
      (r) =>
        r.userId === userId &&
        r.department === department &&
        r.section === section,
    );
    const currentAction =
      action === "view"
        ? "canView"
        : action === "add"
          ? "canAdd"
          : action === "edit"
            ? "canEdit"
            : "canDelete";

    if (existing) {
      const updated = {
        ...existing,
        [currentAction]: !existing[currentAction as keyof UserRestriction],
      };
      await updateDoc(
        doc(db, "user_accounts_restrictions", existing.id),
        updated,
      );
    } else {
      await addDoc(collection(db, "user_accounts_restrictions"), {
        userId,
        department,
        section,
        canView: action === "view",
        canAdd: action === "add",
        canEdit: action === "edit",
        canDelete: action === "delete",
      });
    }
    fetchUsers();
  };

  const startEditRestrictions = async (userId: string) => {
    setEditingRestrictions(userId);
    const snap = await getDocs(
      query(
        collection(db, "user_accounts_restrictions"),
        where("userId", "==", userId),
      ),
    );
    setRestrictions(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserRestriction[],
    );
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
      prev.size === sortedUsers.length
        ? new Set()
        : new Set(sortedUsers.map((u) => u.id)),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportStats(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      const startIndex = lines[0].toLowerCase().includes("email") ? 1 : 0;

      const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));

      const validRoles = ["admin", "manager", "user"];
      const validDepartments = [
        "payroll",
        "employees",
        "lists",
        "reports",
        "system",
      ];
      const validSections = [
        "payroll",
        "templates",
        "employees",
        "calendar",
        "groups",
        "positions",
        "areas",
        "names",
        "benefits",
        "earnings",
        "deductions",
        "13month",
        "companies",
        "terms",
        "users",
        "audit",
        "database",
      ];

      const preview: {
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        department: string;
        section: string;
        isValid: boolean;
        error?: string;
      }[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(",").map((c) => c.trim());

        let email = "",
          firstName = "",
          lastName = "",
          role = "user",
          department = "",
          section = "";
        let isValid = true;
        let error = "";

        if (columns.length >= 3) {
          email = columns[0] || "";
          firstName = columns[1] || "";
          lastName = columns[2] || "";
          if (columns.length >= 4) role = columns[3] || "user";
          if (columns.length >= 5) department = columns[4] || "";
          if (columns.length >= 6) section = columns[5] || "";

          if (!email || !firstName || !lastName) {
            isValid = false;
            error = "Email, firstName, and lastName required";
          } else if (!email.includes("@")) {
            isValid = false;
            error = "Invalid email format";
          } else if (existingEmails.has(email.toLowerCase())) {
            isValid = false;
            error = "Duplicate email";
          } else if (role && !validRoles.includes(role.toLowerCase())) {
            isValid = false;
            error = "Invalid role (must be admin, manager, or user)";
          } else if (
            department &&
            !validDepartments.includes(department.toLowerCase() as Department)
          ) {
            isValid = false;
            error = "Invalid department";
          } else if (
            section &&
            !validSections.includes(section.toLowerCase() as Section)
          ) {
            isValid = false;
            error = "Invalid section";
          }
        } else {
          isValid = false;
          error = "Invalid format (need at least email, firstName, lastName)";
        }

        preview.push({
          email,
          firstName,
          lastName,
          role: role || "user",
          department,
          section,
          isValid,
          error,
        });
      }

      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = csvPreview.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));

    for (const row of validRows) {
      const emailLower = row.email.toLowerCase();
      if (existingEmails.has(emailLower)) {
        duplicates++;
        continue;
      }
      try {
        await addDoc(collection(db, "user_accounts"), {
          email: row.email,
          username: row.email.split("@")[0],
          displayName: `${row.firstName} ${row.lastName}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: row.role || "user",
          department: row.department || "",
          section: row.section || "",
        });
        existingEmails.add(emailLower);
        success++;
      } catch {
        failed++;
      }
    }

    setImportStats({ success, failed, duplicates });
    setImporting(false);
    fetchUsers();
  };

  const resetImport = () => {
    setShowImport(false);
    setCsvPreview([]);
    setCsvFileName("");
    setImportStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setBulkLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "user_accounts", id), {
          isActive,
          updatedAt: new Date(),
        });
      });
      await batch.commit();
      addToast({
        type: "success",
        title: `${isActive ? "Activated" : "Deactivated"} ${selectedIds.size} user(s)`,
      });
      clearSelection();
      fetchUsers();
    } catch {
      addToast({ type: "error", title: "Bulk status update failed" });
    }
    setBulkLoading(false);
  };

  const handleBulkDelete = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => batch.delete(doc(db, "user_accounts", id)));
      await batch.commit();
      addToast({
        type: "success",
        title: `Deleted ${selectedIds.size} user(s)`,
      });
      clearSelection();
      fetchUsers();
    } catch {
      addToast({ type: "error", title: "Bulk delete failed" });
    }
  };

  if (!canView("system", "users"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          {canAdd("system", "users") && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-800">
            {selectedCount} user{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            {canEdit("system", "users") && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate(true)}
                  disabled={bulkLoading}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => handleBulkStatusUpdate(false)}
                  disabled={bulkLoading}
                >
                  Deactivate
                </Button>
              </>
            )}
            {canDelete("system", "users") && (
              <ConfirmDialog
                title="Bulk Delete Users"
                message={`Delete ${selectedCount} selected user${selectedCount !== 1 ? "s" : ""}? This cannot be undone.`}
                confirmText="Delete All"
                variant="danger"
                onConfirm={handleBulkDelete}
              >
                {(open) => (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={open}
                    disabled={bulkLoading}
                  >
                    Delete
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

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="username"
                  label="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <Input
                  id="displayName"
                  label="Display Name"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                />
                {!editingId && (
                  <Input
                    id="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
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
            </form>
          </CardContent>
        </Card>
      )}

      {showImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Users from CSV</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetImport}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!csvPreview.length && !importStats && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload a CSV file with user data
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: email, firstName, lastName, role, department, section
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            )}

            {csvFileName && csvPreview.length > 0 && !importStats && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    File: <span className="font-medium">{csvFileName}</span>
                    <span className="ml-2">
                      ({csvPreview.length} rows found)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-green-600">
                      {csvPreview.filter((r) => r.isValid).length} valid
                    </span>
                    <span className="text-sm text-red-600">
                      {csvPreview.filter((r) => !r.isValid).length} invalid
                    </span>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">First Name</th>
                        <th className="text-left px-3 py-2">Last Name</th>
                        <th className="text-left px-3 py-2">Role</th>
                        <th className="text-left px-3 py-2">Department</th>
                        <th className="text-left px-3 py-2">Section</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvPreview.map((row, index) => (
                        <tr
                          key={index}
                          className={row.isValid ? "" : "bg-red-50"}
                        >
                          <td className="px-3 py-2 text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2">{row.email}</td>
                          <td className="px-3 py-2">{row.firstName}</td>
                          <td className="px-3 py-2">{row.lastName}</td>
                          <td className="px-3 py-2">{row.role}</td>
                          <td className="px-3 py-2">{row.department}</td>
                          <td className="px-3 py-2">{row.section}</td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={resetImport}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={
                      importing ||
                      csvPreview.filter((r) => r.isValid).length === 0
                    }
                  >
                    {importing
                      ? "Importing..."
                      : `Import ${csvPreview.filter((r) => r.isValid).length} Users`}
                  </Button>
                </div>
              </div>
            )}

            {importStats && (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Import Complete</h3>
                <p className="text-gray-600 mb-4">
                  Successfully imported{" "}
                  <span className="font-medium text-green-600">
                    {importStats.success}
                  </span>{" "}
                  users
                  {importStats.failed > 0 && (
                    <span>
                      ,{" "}
                      <span className="font-medium text-red-600">
                        {importStats.failed}
                      </span>{" "}
                      failed
                    </span>
                  )}
                  {importStats.duplicates > 0 && (
                    <span>
                      ,{" "}
                      <span className="font-medium text-yellow-600">
                        {importStats.duplicates}
                      </span>{" "}
                      duplicates skipped
                    </span>
                  )}
                </p>
                <Button onClick={resetImport}>Done</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editingRestrictions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manage Permissions</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingRestrictions(null);
                  setRestrictions([]);
                }}
              >
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
                    <>
                      <tr key={dept.key} className="bg-gray-100">
                        <td
                          colSpan={5}
                          className="px-3 py-2 font-semibold capitalize"
                        >
                          {dept.key}
                        </td>
                      </tr>
                      {dept.sections.map((section) => {
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
                                      toggleRestriction(
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
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => {
                  setEditingRestrictions(null);
                  setRestrictions([]);
                  fetchUsers();
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search users by name, email, or role..."
            />
            <span className="text-sm text-gray-500 ml-auto">
              {sortedUsers.length} user{sortedUsers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
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
                  onClick={() => handleSort("username")}
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
                  onClick={() => handleSort("displayName")}
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
                  onClick={() => handleSort("email")}
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
                  onClick={() => handleSort("isActive")}
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
                        onClick={() => toggleSelect(user.id)}
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
                          onClick={() => startEditRestrictions(user.id)}
                          title="Manage Permissions"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        {canEdit("system", "users") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(user.id);
                              setFormData({
                                username: user.username,
                                email: user.email,
                                displayName: user.displayName,
                                password: "",
                              });
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete("system", "users") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
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
    </div>
  );
}
