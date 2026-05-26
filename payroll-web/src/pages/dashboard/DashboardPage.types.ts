export interface DashboardStats {
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
