import { useMemo } from "react";

const QUERY_PATTERNS = [
  { collection: "payroll", fields: ["companyId", "createdAt", "status"], queries: ["List payrolls by company sorted by date", "Filter payrolls by status"] },
  { collection: "employees", fields: ["companyId", "isActive", "nameId"], queries: ["Active employees by company", "Employee lookup by name"] },
  { collection: "payroll_employees", fields: ["payrollId", "nameId"], queries: ["Employees in a payroll", "Employee payroll history"] },
  { collection: "system_audit", fields: ["userId", "timestamp", "action"], queries: ["Audit log by user sorted by date", "Audit log by action type"] },
  { collection: "payroll_inclusive_dates", fields: ["payrollId", "date"], queries: ["Dates for a payroll period"] },
  { collection: "payroll_groups", fields: ["payrollId", "order"], queries: ["Groups for a payroll sorted by order"] },
];

export function useCompositeIndexSuggestions() {
  const suggestions = useMemo(
    () =>
      QUERY_PATTERNS.map((pattern) => ({
        collection: pattern.collection,
        fields: pattern.fields,
        queryDescriptions: pattern.queries,
        indexDefinition: `CREATE INDEX \`${pattern.collection}_${pattern.fields.join("_")}\` ON COLLECTION \`${pattern.collection}\` (${pattern.fields.map((f) => `\`${f}\``).join(", ")})`,
      })),
    [],
  );

  return { suggestions };
}
