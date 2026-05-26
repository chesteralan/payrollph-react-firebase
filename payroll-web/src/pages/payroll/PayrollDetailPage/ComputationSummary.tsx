import { formatCurrency } from "@/utils/currency";
import type { ProcessingRow } from "../PayrollDetailPage.types";

interface ComputationSummaryProps {
  rows: ProcessingRow[];
  earningData: Map<string, Map<string, number>>;
  deductionData: Map<string, Map<string, number>>;
  benefitData: Map<string, Map<string, { employeeShare: number; employerShare: number }>>;
  getEmployeeGross: (row: ProcessingRow) => number;
  getEmployeeNet: (row: ProcessingRow) => number;
}

export function ComputationSummary({
  rows,
  earningData,
  deductionData,
  benefitData,
  getEmployeeGross,
  getEmployeeNet,
}: ComputationSummaryProps) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Employee</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Basic</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Earnings</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Deductions</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Benefits (EE)</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Net Pay</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row) => {
          const earnings = Array.from(earningData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0);
          const deductions = Array.from(deductionData.get(row.nameId)?.values() || []).reduce((s, v) => s + v, 0);
          const benefits = Array.from(benefitData.get(row.nameId)?.values() || []).reduce((s, v) => s + v.employeeShare, 0);
          const gross = row.salaryAmount + earnings;
          const net = gross - deductions - benefits;
          return (
            <tr key={row.nameId} className="hover:bg-gray-50">
              <td className="px-4 py-2 sticky left-0 bg-white">
                <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                <div className="text-xs text-gray-500">{row.lastName}</div>
              </td>
              <td className="px-4 py-2 text-right text-sm">{formatCurrency(row.salaryAmount)}</td>
              <td className="px-4 py-2 text-right text-sm text-green-600">{formatCurrency(earnings)}</td>
              <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(gross)}</td>
              <td className="px-4 py-2 text-right text-sm text-red-600">{formatCurrency(deductions)}</td>
              <td className="px-4 py-2 text-right text-sm">{formatCurrency(benefits)}</td>
              <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(net)}</td>
            </tr>
          );
        })}
        {rows.length > 0 && (
          <tr className="bg-gray-50 font-bold">
            <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">Total</td>
            <td className="px-4 py-2 text-right text-sm">
              {formatCurrency(rows.reduce((s, r) => s + r.salaryAmount, 0))}
            </td>
            <td className="px-4 py-2 text-right text-sm text-green-600">
              {formatCurrency(rows.reduce((s, r) => s + Array.from(earningData.get(r.nameId)?.values() || []).reduce((a, v) => a + v, 0), 0))}
            </td>
            <td className="px-4 py-2 text-right text-sm">
              {formatCurrency(rows.reduce((s, r) => s + getEmployeeGross(r), 0))}
            </td>
            <td className="px-4 py-2 text-right text-sm text-red-600">
              {formatCurrency(rows.reduce((s, r) => s + Array.from(deductionData.get(r.nameId)?.values() || []).reduce((a, v) => a + v, 0), 0))}
            </td>
            <td className="px-4 py-2 text-right text-sm">
              {formatCurrency(rows.reduce((s, r) => s + Array.from(benefitData.get(r.nameId)?.values() || []).reduce((a, v) => a + v.employeeShare, 0), 0))}
            </td>
            <td className="px-4 py-2 text-right text-sm">
              {formatCurrency(rows.reduce((s, r) => s + getEmployeeNet(r), 0))}
            </td>
          </tr>
        )}
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No employees in this payroll.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
