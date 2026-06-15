import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import type { CompanyInfo } from "./PayrollOutputView.types";
import { formatCurrency, PrintFooter, PrintHeader } from "./shared";

export function JournalMode({
  totals,
  company,
  payroll,
  monthName,
}: {
  totals: {
    totalBasic: number;
    totalEarnings: number;
    totalBenefitsER: number;
    totalBenefitsEE: number;
    totalDeductions: number;
    totalNet: number;
  };
  company?: CompanyInfo;
  payroll: { name: string; month: number; year: number };
  monthName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal Entry</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          {monthName} {payroll.year} - Accounting summary
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <PrintHeader
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Account
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Debit
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Credit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Salaries & Wages Expense
              </td>
              <td className="px-4 py-2 text-right text-sm font-semibold">
                {formatCurrency(totals.totalBasic)}
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Earnings Expense
              </td>
              <td className="px-4 py-2 text-right text-sm font-semibold">
                {formatCurrency(totals.totalEarnings)}
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Employer Benefits Expense
              </td>
              <td className="px-4 py-2 text-right text-sm font-semibold">
                {formatCurrency(totals.totalBenefitsER)}
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Withholding Tax Payable
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
              <td className="px-4 py-2 text-right text-sm">
                {formatCurrency(0.0)}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Employee Benefits Payable
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
              <td className="px-4 py-2 text-right text-sm">
                {formatCurrency(totals.totalBenefitsEE)}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Other Deductions Payable
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
              <td className="px-4 py-2 text-right text-sm">
                {formatCurrency(totals.totalDeductions)}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                Salaries & Wages Payable
              </td>
              <td className="px-4 py-2 text-right text-sm">-</td>
              <td className="px-4 py-2 text-right text-sm font-semibold">
                {formatCurrency(totals.totalNet)}
              </td>
            </tr>
            <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
              <td className="px-4 py-2 text-sm">Total</td>
              <td className="px-4 py-2 text-right text-sm">
                {formatCurrency(
                  totals.totalBasic +
                    totals.totalEarnings +
                    totals.totalBenefitsER,
                )}
              </td>
              <td className="px-4 py-2 text-right text-sm">
                {formatCurrency(
                  totals.totalBenefitsEE +
                    totals.totalDeductions +
                    totals.totalNet,
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <PrintFooter company={company} />
      </CardContent>
    </Card>
  );
}
