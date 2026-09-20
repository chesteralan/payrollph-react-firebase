import type { BenefitSummary } from "./EarningsDeductionsReportPage.types";

interface BenefitsSummaryTableProps {
  benefitSummaries: BenefitSummary[];
  totalBenefitsEE: number;
  totalBenefitsER: number;
  formatCurrency: (value: number) => string;
}

export function BenefitsSummaryTable({
  benefitSummaries,
  totalBenefitsEE,
  totalBenefitsER,
  formatCurrency,
}: BenefitsSummaryTableProps) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            Benefit Type
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            EE Share
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            ER Share
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            Total
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
            Employees
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {benefitSummaries.map((b, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-6 py-4 text-sm text-gray-900">{b.name}</td>
            <td className="px-6 py-4 text-sm text-right">
              {formatCurrency(b.totalEE)}
            </td>
            <td className="px-6 py-4 text-sm text-right">
              {formatCurrency(b.totalER)}
            </td>
            <td className="px-6 py-4 text-sm text-right font-semibold">
              {formatCurrency(b.totalEE + b.totalER)}
            </td>
            <td className="px-6 py-4 text-sm text-right">
              {b.employeeCount}
            </td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
          <td className="px-6 py-4">Total</td>
          <td className="px-6 py-4 text-right">
            {formatCurrency(totalBenefitsEE)}
          </td>
          <td className="px-6 py-4 text-right">
            {formatCurrency(totalBenefitsER)}
          </td>
          <td className="px-6 py-4 text-right">
            {formatCurrency(totalBenefitsEE + totalBenefitsER)}
          </td>
          <td className="px-6 py-4 text-right"></td>
        </tr>
      </tbody>
    </table>
  );
}
