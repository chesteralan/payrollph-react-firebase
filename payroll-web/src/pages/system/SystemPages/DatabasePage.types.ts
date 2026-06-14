export interface Backup {
  id: string;
  timestamp: Date;
  collections: string[];
  size: number;
  status: string;
  totalDocuments?: number;
}

export interface VerificationResult {
  name: string;
  status: "Pass" | "Fail" | "Warning";
  details: string;
  issueCount: number;
}

export interface CleanupResult {
  name: string;
  count: number;
  time: number;
  success: boolean;
}
