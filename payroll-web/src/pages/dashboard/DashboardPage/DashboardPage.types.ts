export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayrolls: number;
  pendingPayrolls: number;
  totalCompanies: number;
  recentActivities: number;
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
