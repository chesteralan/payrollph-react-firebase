import { useState, useCallback } from "react";

const HELP_ARTICLES = [
  { id: "create-payroll", title: "Creating a Payroll Run", module: "payroll" },
  { id: "add-employee", title: "Adding an Employee", module: "employees" },
  { id: "generate-report", title: "Generating Reports", module: "reports" },
  { id: "manage-users", title: "Managing User Accounts", module: "system" },
  { id: "setup-company", title: "Setting Up a Company", module: "system" },
  { id: "dtr-entry", title: "Daily Time Record Entry", module: "dtr" },
  { id: "export-data", title: "Exporting Payroll Data", module: "payroll" },
  { id: "calendar-holidays", title: "Managing Holidays", module: "system" },
];

export function useSearchableHelp() {
  const [results, setResults] = useState<{ id: string; title: string; module: string }[]>([]);
  const [context, setContext] = useState<string>("all");

  const search = useCallback(
    (query_text: string) => {
      const filtered = HELP_ARTICLES.filter(
        (a) =>
          (context === "all" || a.module === context) &&
          (a.title.toLowerCase().includes(query_text.toLowerCase())),
      );
      setResults(filtered);
    },
    [context],
  );

  const setContextModule = useCallback((module: string) => {
    setContext(module);
  }, []);

  return { results, search, setContextModule, context };
}
