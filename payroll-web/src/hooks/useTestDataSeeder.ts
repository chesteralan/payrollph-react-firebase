import { useState, useCallback } from "react";
import { db } from "@/config/firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";

interface SeedingConfig {
  employees: number;
  names: number;
  payrolls: number;
}

export function useTestDataSeeder() {
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState("");

  const seed = useCallback(async (config: SeedingConfig) => {
    setSeeding(true);
    const results = { employees: 0, names: 0, payrolls: 0 };

    for (let i = 0; i < config.names; i++) {
      setProgress(`Seeding names: ${i + 1}/${config.names}`);
      await addDoc(collection(db, "names"), {
        firstName: `Test${i}`,
        lastName: `User${i}`,
        createdAt: serverTimestamp(),
      });
      results.names++;
    }

    for (let i = 0; i < config.employees; i++) {
      setProgress(`Seeding employees: ${i + 1}/${config.employees}`);
      await addDoc(collection(db, "employees"), {
        employeeCode: `EMP${String(i + 1).padStart(4, "0")}`,
        isActive: true,
        companyId: "company-1",
        createdAt: serverTimestamp(),
      });
      results.employees++;
    }

    setSeeding(false);
    setProgress(`Seeded: ${results.names} names, ${results.employees} employees`);
    return results;
  }, []);

  const cleanup = useCallback(async (collectionName: string) => {
    setProgress(`Cleaning up ${collectionName}...`);
    setSeeding(true);
    const { getDocs, query, limit } = await import("firebase/firestore");
    const snap = await getDocs(query(collection(db, collectionName), limit(500)));
    const { deleteDoc } = await import("firebase/firestore");
    const promises = snap.docs.map((d) => deleteDoc(doc(db, collectionName, d.id)));
    await Promise.all(promises);
    setSeeding(false);
    setProgress(`Cleaned ${snap.size} docs from ${collectionName}`);
  }, []);

  return { seed, cleanup, seeding, progress };
}
