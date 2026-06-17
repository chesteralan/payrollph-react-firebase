import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Printer } from "lucide-react";

import type { ProcessingRow } from "./PayrollOutputView.types";
import { formatCurrency } from "./shared";

interface PayslipModeProps {
  rows: ProcessingRow[];
  filteredRows: ProcessingRow[];
  selectedEmployee: string | null;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<string | null>>;
  getEmployeeEarnings: (
    row: ProcessingRow,
  ) => { name: string; amount: number }[];
  getEmployeeDeductions: (
    row: ProcessingRow,
  ) => { name: string; amount: number }[];
  getEmployeeBenefits: (
    row: ProcessingRow,
  ) => { name: string; employeeShare: number; employerShare: number }[];
  getEmployeeNet: (row: ProcessingRow) => number;
  payroll: { name: string; month: number; year: number };
  monthName: string;
}

export function PayslipMode({
  rows,
  filteredRows,
  selectedEmployee,
  setSelectedEmployee,
  getEmployeeEarnings,
  getEmployeeDeductions,
  getEmployeeBenefits,
  getEmployeeNet,
  payroll,
  monthName,
}: PayslipModeProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {selectedEmployee && (
          <Button variant="secondary" onClick={() => setSelectedEmployee(null)}>
            Back to All Payslips
          </Button>
        )}
        {!selectedEmployee && (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const payslipHtml = filteredRows
                  .map((row) => {
                    const earnings = getEmployeeEarnings(row);
                    const deductions = getEmployeeDeductions(row);
                    const benefits = getEmployeeBenefits(row);
                    const totalEarnings = earnings.reduce(
                      (s, e) => s + e.amount,
                      0,
                    );
                    const totalDeductions = deductions.reduce(
                      (s, d) => s + d.amount,
                      0,
                    );
                    const totalBenefitsEE = benefits.reduce(
                      (s, b) => s + b.employeeShare,
                      0,
                    );
                    const gross = row.salaryAmount + totalEarnings;
                    const net = gross - totalDeductions - totalBenefitsEE;
                    return `
                  <div class="payslip" style="page-break-after:always;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin-bottom:16px;font-family:system-ui;">
                    <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:16px;">
                      <div><h2 style="margin:0;">Payslip</h2><p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${monthName} ${payroll.year}</p></div>
                      <div style="text-align:right;font-size:14px;"><div style="font-weight:500;">${row.employeeCode}</div><div>${row.lastName}${row.firstName ? ", " + row.firstName : ""}</div></div>
                    </div>
                    <div style="margin-bottom:16px;">
                      <h3 style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Earnings</h3>
                      <div style="font-size:14px;">
                        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Basic Salary</span><span style="font-weight:500;">${formatCurrency(row.salaryAmount)}</span></div>
                        ${earnings.map((e) => `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${e.name}</span><span>${formatCurrency(e.amount)}</span></div>`).join("")}
                        <div style="display:flex;justify-content:space-between;padding:8px 0 4px;border-top:1px solid #e5e7eb;font-weight:600;"><span>Total Earnings</span><span>${formatCurrency(row.salaryAmount + totalEarnings)}</span></div>
                      </div>
                    </div>
                    <div style="margin-bottom:16px;">
                      <h3 style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Deductions</h3>
                      <div style="font-size:14px;">
                        ${deductions.map((d) => `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${d.name}</span><span>${formatCurrency(d.amount)}</span></div>`).join("")}
                        ${benefits.map((b) => `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${b.name} (EE)</span><span>${formatCurrency(b.employeeShare)}</span></div>`).join("")}
                        <div style="display:flex;justify-content:space-between;padding:8px 0 4px;border-top:1px solid #e5e7eb;font-weight:600;"><span>Total Deductions</span><span>${formatCurrency(totalDeductions + totalBenefitsEE)}</span></div>
                      </div>
                    </div>
                    <div style="background:#f9fafb;padding:16px;border-radius:8px;display:flex;justify-content:space-between;font-size:18px;font-weight:bold;"><span>Net Pay</span><span>${formatCurrency(net)}</span></div>
                  </div>`;
                  })
                  .join("");
                printWindow.document.write(
                  `<!DOCTYPE html><html><head><title>Payslips - ${payroll.name}</title><style>@media print{.payslip{page-break-after:always;}}body{margin:0;padding:16px;}</style></head><body><h1>${payroll.name} - ${monthName} ${payroll.year}</h1>${payslipHtml}</body></html>`,
                );
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print All ({filteredRows.length})
            </Button>
          </>
        )}
      </div>

      {selectedEmployee ? (
        <div className="max-w-2xl mx-auto">
          {rows
            .filter((r) => r.nameId === selectedEmployee)
            .map((row) => {
              const earnings = getEmployeeEarnings(row);
              const deductions = getEmployeeDeductions(row);
              const benefits = getEmployeeBenefits(row);
              const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0);
              const totalDeductions = deductions.reduce(
                (s, d) => s + d.amount,
                0,
              );
              const totalBenefitsEE = benefits.reduce(
                (s, b) => s + b.employeeShare,
                0,
              );
              const gross = row.salaryAmount + totalEarnings;
              const net = gross - totalDeductions - totalBenefitsEE;

              return (
                <Card key={row.nameId} className="print:shadow-none">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">Payslip</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {monthName} {payroll.year}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{row.employeeCode}</div>
                        <div>
                          {row.lastName}
                          {row.firstName ? `, ${row.firstName}` : ""}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        Earnings
                      </h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Basic Salary</span>
                          <span className="font-medium">
                            {formatCurrency(row.salaryAmount)}
                          </span>
                        </div>
                        {earnings.map((e) => (
                          <div
                            key={e.name}
                            className="flex justify-between text-sm"
                          >
                            <span>{e.name}</span>
                            <span>{formatCurrency(e.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                          <span>Total Earnings</span>
                          <span>
                            {formatCurrency(row.salaryAmount + totalEarnings)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        Deductions
                      </h3>
                      <div className="space-y-1">
                        {deductions.map((d) => (
                          <div
                            key={d.name}
                            className="flex justify-between text-sm"
                          >
                            <span>{d.name}</span>
                            <span>{formatCurrency(d.amount)}</span>
                          </div>
                        ))}
                        {benefits.map((b) => (
                          <div
                            key={b.name}
                            className="flex justify-between text-sm"
                          >
                            <span>{b.name} (Employee Share)</span>
                            <span>{formatCurrency(b.employeeShare)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                          <span>Total Deductions</span>
                          <span>
                            {formatCurrency(totalDeductions + totalBenefitsEE)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Pay</span>
                        <span>{formatCurrency(net)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Employee Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((row) => (
                <button
                  key={row.nameId}
                  onClick={() => setSelectedEmployee(row.nameId)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 text-left transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {row.employeeCode}
                  </div>
                  <div className="text-sm text-gray-500">
                    {row.lastName}
                    {row.firstName ? `, ${row.firstName}` : ""}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mt-2">
                    Net: {formatCurrency(getEmployeeNet(row))}
                  </div>
                </button>
              ))}
            </div>
            {rows.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No employees in this payroll.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
