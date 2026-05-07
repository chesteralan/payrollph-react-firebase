import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Users,
  FileText,
  Calendar,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Skeleton, TableSkeleton } from "../../components/ui/Skeleton";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayrolls: number;
  publishedPayrolls: number;
  totalCompanies: number;
  upcomingPayrolls: { name: string; month: number; year: number; id: string }[];
  recentPayrolls: {
    name: string;
    month: number;
    year: number;
    status: string;
    id: string;
    updatedAt: Date;
  }[];
}

export function DashboardPage() {
  const { user, currentCompanyId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayrolls: 0,
    publishedPayrolls: 0,
    totalCompanies: 0,
    upcomingPayrolls: [],
    recentPayrolls: [],
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);

    try {
      const [employeesSnap, payrollsSnap, companiesSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "employees"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "payroll"),
            where("companyId", "==", currentCompanyId),
            orderBy("createdAt", "desc"),
            limit(10),
          ),
        ),
        getDocs(collection(db, "companies")),
      ]);

      const employees = employeesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as { id: string; isActive?: boolean }[];
      const payrolls = payrollsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as {
        id: string;
        name: string;
        month: number;
        year: number;
        status?: string;
        updatedAt?: Date;
      }[];
      const companies = companiesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const activeEmployees = employees.filter((e) => e.isActive).length;
      const publishedPayrolls = payrolls.filter(
        (p) => p.status === "published",
      ).length;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const upcomingPayrolls = payrolls
        .filter(
          (p) =>
            (p.year > currentYear ||
              (p.year === currentYear && p.month >= currentMonth)) &&
            p.status !== "published",
        )
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          name: p.name,
          month: p.month,
          year: p.year,
        }));

      const recentPayrolls = payrolls.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        month: p.month,
        year: p.year,
        status: p.status || "draft",
        updatedAt: p.updatedAt || new Date(),
      }));

      setStats({
        totalEmployees: employees.length,
        activeEmployees,
        totalPayrolls: payrolls.length,
        publishedPayrolls,
        totalCompanies: companies.length,
        upcomingPayrolls,
        recentPayrolls,
      });
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    if (currentCompanyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboard();
    }
  }, [currentCompanyId, loadDashboard]);

  const getMonthName = (month: number) =>
    new Date(0, month - 1).toLocaleString("default", { month: "long" });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    locked: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
  };

  const statCards = [
    {
      label: "Total Employees",
      value: stats.totalEmployees,
      subtext: `${stats.activeEmployees} active`,
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-500",
      action: () => navigate("/employees"),
    },
    {
      label: "Payroll Runs",
      value: stats.totalPayrolls,
      subtext: `${stats.publishedPayrolls} published`,
      icon: <FileText className="w-5 h-5" />,
      color: "bg-purple-500",
      action: () => navigate("/payroll"),
    },
    {
      label: "Companies",
      value: stats.totalCompanies,
      subtext: "Active companies",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-green-500",
      action: () => navigate("/system/companies"),
    },
    {
      label: "Quick Actions",
      value: null,
      subtext: "Create new payroll",
      icon: <Plus className="w-5 h-5" />,
      color: "bg-primary-600",
      action: () => navigate("/payroll/new"),
      isAction: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-12 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-0">
              <TableSkeleton rows={5} columns={3} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <TableSkeleton rows={5} columns={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.displayName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className={
              card.isAction
                ? "cursor-pointer hover:shadow-md transition-shadow"
                : ""
            }
            onClick={card.action}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value !== null ? card.value : ""}
                  </p>
                  {card.subtext && (
                    <p className="text-sm text-gray-400 mt-1">{card.subtext}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent Payrolls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentPayrolls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No payroll runs yet</p>
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => navigate("/payroll/new")}
                >
                  Create First Payroll
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentPayrolls.map((payroll) => (
                  <button
                    key={payroll.id}
                    onClick={() => navigate(`/payroll/${payroll.id}`)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payroll.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getMonthName(payroll.month)} {payroll.year}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[payroll.status]}`}
                    >
                      {payroll.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Upcoming Payrolls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.upcomingPayrolls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No upcoming payrolls</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.upcomingPayrolls.map((payroll) => (
                  <button
                    key={payroll.id}
                    onClick={() => navigate(`/payroll/${payroll.id}`)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payroll.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getMonthName(payroll.month)} {payroll.year}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Pending
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
