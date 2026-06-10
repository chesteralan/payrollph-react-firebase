import { useCallback, useState } from "react";

interface BatchReportJob {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
}

export function useBatchReportGeneration() {
  const [jobs, setJobs] = useState<BatchReportJob[]>([]);

  const generateBatch = useCallback(async (reportNames: string[]) => {
    const newJobs: BatchReportJob[] = reportNames.map((name) => ({
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      status: "pending" as const,
    }));
    setJobs((prev) => [...prev, ...newJobs]);

    for (const job of newJobs) {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "running" as const } : j)));
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "completed" as const } : j)));
      } catch {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "failed" as const } : j)));
      }
    }
  }, []);

  return { jobs, generateBatch };
}
