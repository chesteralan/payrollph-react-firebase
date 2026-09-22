import type { EmployeeBreakdown } from "./EarningsDeductionsReportPage.types";

interface EmployeeBreakdownTableProps {
  employeeBreakdowns: EmployeeBreakdown[];
  totalEarnings: number;
  totalDeductions: number;
  totalBenefitsEE: number;
  totalBenefitsER: number;
  formatCurrency: (value: number) => string;
}

export function EmployeeBreakdownTable({
  employeeBreakdowns,
  totalEarnings,
  totalDeductions,
  totalBenefitsEE,
  totalBenefitsER,
  formatCurrency,
}: EmployeeBreakdownTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Employee
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Group
            </th>
            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Earnings
            </th>
            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Deductions
            </th>
            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Benefits
            </th>
            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Net
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {employeeBreakdowns.map((emp, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {emp.employeeCode} - {emp.firstName} {emp.lastName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {emp.groupName}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {formatCurrency(emp.totalEarnings)}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {formatCurrency(emp.totalDeductions)}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {formatCurrency(emp.totalBenefits)}
              </td>
              <td className="px-6 py-4 text-sm text-right font-semibold">
                {formatCurrency(emp.totalEarnings - emp.totalDeductions)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
            <td className="px-6 py-4" colSpan={2}>
              Total
            </td>
            <td className="px-6 py-4 text-right">
              {formatCurrency(totalEarnings)}
            </td>
            <td className="px-6 py-4 text-right">
              {formatCurrency(totalDeductions)}
            </td>
            <td className="px-6 py-4 text-right">
              {formatCurrency(totalBenefitsEE + totalBenefitsER)}
            </td>
            <td className="px-6 py-4 text-right">
              {formatCurrency(totalEarnings - totalDeductions)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
