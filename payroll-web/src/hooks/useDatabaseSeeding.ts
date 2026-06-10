import { useCallback, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface SeedConfig {
  companies: number;
  employees: number;
  payrolls: number;
}

export function useDatabaseSeeding() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");

  const seed = useCallback(async (config: SeedConfig) => {
    setRunning(true);
    const results = { companies: 0, employees: 0, payrolls: 0 };

    for (let i = 0; i < config.companies; i++) {
      setProgress(`Creating company ${i + 1}/${config.companies}`);
      await addDoc(collection(db, "companies"), {
        name: `Test Company ${i + 1}`,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      results.companies++;
    }

    for (let i = 0; i < config.employees; i++) {
      setProgress(`Creating employee ${i + 1}/${config.employees}`);
      await addDoc(collection(db, "employees"), {
        employeeCode: `EMP${String(i + 1).padStart(4, "0")}`,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      results.employees++;
    }

    setRunning(false);
    setProgress(`Created ${results.companies} companies, ${results.employees} employees`);
    return results;
  }, []);

  return { seed, running, progress };
}
