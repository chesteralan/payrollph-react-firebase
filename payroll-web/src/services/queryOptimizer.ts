import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

export const INDEX_SUGGESTIONS = [
  { collection: "payroll", fields: ["companyId", "createdAt"], description: "Payroll list by company" },
  { collection: "payroll", fields: ["companyId", "status"], description: "Payroll status filtering" },
  { collection: "employees", fields: ["companyId", "isActive"], description: "Active employees by company" },
  { collection: "employees", fields: ["companyId", "nameId"], description: "Employee lookup by name" },
  { collection: "payroll_inclusive_dates", fields: ["payrollId"], description: "Dates by payroll" },
  { collection: "payroll_groups", fields: ["payrollId"], description: "Groups by payroll" },
  { collection: "payroll_employees", fields: ["payrollId"], description: "Employees by payroll" },
  { collection: "user_companies", fields: ["userId"], description: "User company access" },
  { collection: "system_audit", fields: ["userId", "timestamp"], description: "Audit log by user" },
  { collection: "system_audit", fields: ["action", "timestamp"], description: "Audit log by action" },
];

export async function suggestMissingIndexes() {
  const missing: string[] = [];
  for (const suggestion of INDEX_SUGGESTIONS) {
    try {
      const testQuery = query(
        collection(db, suggestion.collection),
        ...suggestion.fields.map((f) => where(f, "==", "__test__")),
      );
      await getDocs(testQuery);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("index")) {
        missing.push(
          `${suggestion.collection}: ${suggestion.fields.join(", ")} — ${suggestion.description}`,
        );
      }
    }
  }
  return missing;
}

export async function estimateCollectionSize(collectionName: string): Promise<number> {
  try {
    const snap = await getDocs(query(collection(db, collectionName)));
    return snap.size;
  } catch {
    return -1;
  }
}
