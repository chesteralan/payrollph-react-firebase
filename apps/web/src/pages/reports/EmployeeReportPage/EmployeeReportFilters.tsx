import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EmployeeArea, EmployeeGroup, EmployeePosition } from "@/types";
import type { EmployeeReportFilters as FilterType } from "./useEmployeeReport";

interface EmployeeReportFiltersProps {
  filters: FilterType;
  loading: boolean;
  groups: EmployeeGroup[];
  positions: EmployeePosition[];
  areas: EmployeeArea[];
  onFilterChange: (filters: FilterType) => void;
  onGenerate: () => void;
}

export function EmployeeReportFilters({
  filters,
  loading,
  groups,
  positions,
  areas,
  onFilterChange,
  onGenerate,
}: EmployeeReportFiltersProps) {
  const setFilter = (key: keyof FilterType, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilter("status", e.target.value as FilterType["status"])
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.groupId}
              onChange={(e) => setFilter("groupId", e.target.value)}
            >
              <option value="">All Groups</option>
              {groups
                .filter((g) => g.isActive)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.positionId}
              onChange={(e) => setFilter("positionId", e.target.value)}
            >
              <option value="">All Positions</option>
              {positions
                .filter((p) => p.isActive)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.areaId}
              onChange={(e) => setFilter("areaId", e.target.value)}
            >
              <option value="">All Areas</option>
              {areas
                .filter((a) => a.isActive)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={onGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
