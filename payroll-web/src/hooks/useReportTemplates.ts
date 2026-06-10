import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useReportTemplates() {
  const [templates, setTemplates] = useState<{ id: string; name: string; config: unknown }[]>([]);

  const saveTemplate = useCallback(async (name: string, config: unknown) => {
    const ref = await addDoc(collection(db, "report_templates"), {
      name, config, createdAt: serverTimestamp(),
    });
    setTemplates((prev) => [...prev, { id: ref.id, name, config }]);
    return ref.id;
  }, []);

  const loadTemplates = useCallback(async () => {
    const snap = await getDocs(collection(db, "report_templates"));
    setTemplates(snap.docs.map((d) => ({ id: d.id, name: d.data().name as string, config: d.data().config })));
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    return templates.find((t) => t.id === templateId)?.config || null;
  }, [templates]);

  return { templates, saveTemplate, loadTemplates, applyTemplate };
}
