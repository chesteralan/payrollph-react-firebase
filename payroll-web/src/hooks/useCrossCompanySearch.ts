import { useCallback, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useCrossCompanySearch() {
  const [results, setResults] = useState<{ companyId: string; companyName: string; items: { id: string; label: string }[] }[]>([]);

  const search = useCallback(async (query_text: string) => {
    if (!query_text.trim()) { setResults([]); return; }

    const companiesSnap = await getDocs(collection(db, "companies"));
    const companyResults: typeof results = [];

    for (const companyDoc of companiesSnap.docs) {
      const companyId = companyDoc.id;
      const companyName = companyDoc.data().name as string;
      const employeesSnap = await getDocs(
        query(collection(db, "employees"), where("companyId", "==", companyId)),
      );
      const matches = employeesSnap.docs
        .filter((d) => {
          const data = d.data();
          return String(data.employeeCode || "").toLowerCase().includes(query_text.toLowerCase());
        })
        .map((d) => ({ id: d.id, label: `${d.data().employeeCode || ""} - ${companyName}` }));

      if (matches.length > 0) {
        companyResults.push({ companyId, companyName, items: matches });
      }
    }

    setResults(companyResults);
  }, []);

  return { results, search };
}
