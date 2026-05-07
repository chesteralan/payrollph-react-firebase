import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Pagination } from "../../components/ui/Pagination";
import {
  Plus,
  Trash2,
  Lock,
  Unlock,
  ArrowRight,
  Search,
  Eye,
  Copy,
} from "lucide-react";
import type { Payroll } from "../../types";

export function PayrollRunsPage() {
  const { currentCompanyId } = useAuth();
  const { canView, canAdd, canDelete } = usePermissions();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "locked" | "published"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchPayrolls = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    const snap = await getDocs(
      query(
        collection(db, "payroll"),
        where("companyId", "==", currentCompanyId),
      ),
    );
    setPayrolls(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Payroll[]);
    setLoading(false);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (currentCompanyId) fetchPayrolls();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompanyId]);

  const toggleLock = async (payroll: Payroll) => {
    await updateDoc(doc(db, "payroll", payroll.id), {
      isLocked: !payroll.isLocked,
    });
    addToast({
      type: "info",
      title: payroll.isLocked ? "Payroll unlocked" : "Payroll locked",
      message: `${payroll.name} is now ${payroll.isLocked ? "editable" : "locked"}`,
    });
    fetchPayrolls();
  };

  const handlePublish = async (payroll: Payroll) => {
    if (!confirm(`Publish ${payroll.name}? This action cannot be undone.`))
      return;
    await updateDoc(doc(db, "payroll", payroll.id), {
      status: "published",
      isLocked: true,
    });
    addToast({
      type: "success",
      title: "Payroll published",
      message: `${payroll.name} has been published`,
    });
    fetchPayrolls();
  };

  const handleClone = async (payroll: Payroll) => {
    const nextMonth = payroll.month === 12 ? 1 : payroll.month + 1;
    const nextYear = payroll.month === 12 ? payroll.year + 1 : payroll.year;
    const monthName = new Date(0, nextMonth - 1).toLocaleString("default", {
      month: "long",
    });

    const newPayroll = {
      companyId: payroll.companyId,
      name: `${payroll.name} - ${monthName} ${nextYear}`,
      month: nextMonth,
      year: nextYear,
      status: "draft" as const,
      isActive: true,
      isLocked: false,
      printFormat: payroll.printFormat || "",
      groupBy: payroll.groupBy || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, "payroll"), newPayroll);
    addToast({
      type: "success",
      title: "Payroll cloned",
      message: `Created ${newPayroll.name}`,
    });
    fetchPayrolls();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this payroll?")) {
      await deleteDoc(doc(db, "payroll", id));
      addToast({ type: "success", title: "Payroll deleted" });
      fetchPayrolls();
    }
  };

  const filteredPayrolls = useMemo(() => {
    return payrolls
      .filter((p) => {
        const matchesSearch =
          searchQuery === "" ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = statusFilter === "all";
        if (statusFilter === "published")
          matchesStatus = p.status === "published";
        else if (statusFilter === "locked")
          matchesStatus = p.isLocked && p.status !== "published";
        else if (statusFilter === "draft") matchesStatus = !p.isLocked;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [payrolls, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
  const paginatedPayrolls = filteredPayrolls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  if (!canView("payroll", "payroll"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    locked: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
        {canAdd("payroll", "payroll") && (
          <Button onClick={() => navigate("/payroll/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Payroll
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payrolls..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "draft" | "locked" | "published",
                )
              }
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="locked">Locked</option>
              <option value="published">Published</option>
            </select>
            <span className="text-sm text-gray-500 ml-auto">
              {filteredPayrolls.length} payroll
              {filteredPayrolls.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
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
              ) : paginatedPayrolls.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No payroll runs found
                  </td>
                </tr>
              ) : (
                paginatedPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td
                      className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer"
                      onClick={() => navigate(`/payroll/${p.id}`)}
                    >
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(0, p.month - 1).toLocaleString("default", {
                        month: "long",
                      })}{" "}
                      {p.year}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.status || "draft"]}`}
                      >
                        {p.status || "draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/payroll/${p.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {p.status !== "published" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClone(p)}
                              title="Clone payroll"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLock(p)}
                            >
                              {p.isLocked ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </Button>
                            {p.isLocked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublish(p)}
                                title="Publish payroll"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {canDelete("payroll", "payroll") && !p.isLocked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
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
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredPayrolls.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
