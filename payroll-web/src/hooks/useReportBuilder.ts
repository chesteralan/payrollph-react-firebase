import { useState, useCallback } from "react";

interface ReportBuilderField {
  key: string;
  label: string;
  category: string;
  selected: boolean;
}

export function useReportBuilder() {
  const [fields, setFields] = useState<ReportBuilderField[]>([
    { key: "employeeCode", label: "Employee Code", category: "Basic", selected: true },
    { key: "name", label: "Full Name", category: "Basic", selected: true },
    { key: "position", label: "Position", category: "Employment", selected: false },
    { key: "department", label: "Department", category: "Employment", selected: false },
    { key: "basicSalary", label: "Basic Salary", category: "Compensation", selected: true },
    { key: "grossPay", label: "Gross Pay", category: "Compensation", selected: false },
    { key: "netPay", label: "Net Pay", category: "Compensation", selected: true },
    { key: "earnings", label: "Total Earnings", category: "Compensation", selected: false },
    { key: "deductions", label: "Total Deductions", category: "Compensation", selected: false },
    { key: "sss", label: "SSS", category: "Contributions", selected: false },
    { key: "philhealth", label: "PhilHealth", category: "Contributions", selected: false },
    { key: "hdmf", label: "HDMF", category: "Contributions", selected: false },
  ]);

  const toggleField = useCallback((key: string) => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, selected: !f.selected } : f)));
  }, []);

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const selectedFields = fields.filter((f) => f.selected);
  const categories = [...new Set(fields.map((f) => f.category))];

  return { fields, selectedFields, categories, toggleField, moveField };
}
