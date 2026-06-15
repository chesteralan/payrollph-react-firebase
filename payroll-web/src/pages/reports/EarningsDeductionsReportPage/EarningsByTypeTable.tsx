import type { EarningTypeSummary } from "./EarningsDeductionsReportPage.types";

interface EarningsByTypeTableProps {
  earningSummaries: EarningTypeSummary[];
  totalEarnings: number;
  formatCurrency: (value: number) => string;
}

export function EarningsByTypeTable({
  earningSummaries,
  totalEarnings,
  formatCurrency,
}: EarningsByTypeTableProps) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            Earning Type
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            Employees
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            Total Amount
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {earningSummaries.map((e, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-6 py-4 text-sm text-gray-900">{e.name}</td>
            <td className="px-6 py-4 text-sm text-right">{e.employeeCount}</td>
            <td className="px-6 py-4 text-sm text-right">
              {formatCurrency(e.totalAmount)}
            </td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
          <td className="px-6 py-4">Total</td>
          <td className="px-6 py-4 text-right"></td>
          <td className="px-6 py-4 text-right">
            {formatCurrency(totalEarnings)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
