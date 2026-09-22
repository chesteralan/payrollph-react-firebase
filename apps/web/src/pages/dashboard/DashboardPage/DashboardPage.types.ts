export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayrolls: number;
  pendingPayrolls: number;
  totalCompanies: number;
  recentActivities: number;
  publishedPayrolls: number;
  recentPayrolls: Array<{ id: string; name: string; status: string; month: number; year: number }>;
  upcomingPayrolls: Array<{ id: string; name: string; status: string; month: number; year: number }>;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  gridPosition: { x: number; y: number; w: number; h: number };
}

export interface DashboardMetrics {
  totalEmployees: number;
  activePayrolls: number;
  pendingApprovals: number;
  upcomingDeadlines: number;
}
