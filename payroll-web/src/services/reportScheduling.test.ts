import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFirestoreMocks,
  addMockDocs,
  clearMockDocs,
} from "../__mocks__/firebase";

// Mock dependencies: email and reportGenerator (both are relative imports)
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// reportGenerator.ts doesn't exist yet, so mock it as a virtual module
vi.mock("./reportGenerator", () => ({
  generateReportData: vi.fn().mockResolvedValue([
    { name: "Alice", salary: 50000 },
    { name: "Bob", salary: 60000 },
  ]),
}));

// Extend base firestore mocks — keep doc returning a path string (base mock behavior)
vi.mock("firebase/firestore", () => ({
  ...createFirestoreMocks(),
}));

import {
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  toggleScheduleStatus,
  calculateNextRun,
  processDueReports,
} from "./reportScheduling";
import {
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { sendEmail } from "./email";
import { generateReportData } from "./reportGenerator";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

const baseReport = (overrides: Record<string, unknown> = {}) => ({
  id: "report-1",
  name: "Monthly Payroll Summary",
  description: "Monthly payroll report",
  reportType: "payroll_summary",
  frequency: "monthly",
  dayOfMonth: 1,
  time: "08:00",
  recipients: ["admin@example.com"],
  deliveryMethod: "email",
  format: "xlsx",
  isActive: true,
  nextRun: new Date("2099-01-01"),
  createdBy: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("calculateNextRun", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed "now"
    vi.setSystemTime(new Date("2024-06-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate next run for daily frequency", () => {
    const next = calculateNextRun("daily", undefined, undefined, "09:00");
    expect(next.getDate()).toBe(16); // tomorrow
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(0);
  });

  it("should calculate next run for weekly frequency", () => {
    // June 15, 2024 is a Saturday (day 6)
    // Weekly with dayOfWeek = 1 should be next Monday
    const next = calculateNextRun("weekly", 1, undefined, "10:00");
    // Monday = 1, next Monday from Saturday = in 2 days
    expect(next.getDay()).toBe(1); // Monday
    expect(next.getHours()).toBe(10);
  });

  it("should calculate next run for monthly frequency", () => {
    const next = calculateNextRun("monthly", undefined, 1, "08:00");
    // Should be July 1
    expect(next.getMonth()).toBe(6); // July (0-indexed)
    expect(next.getDate()).toBe(1);
    expect(next.getHours()).toBe(8);
  });

  it("should calculate next run for quarterly frequency", () => {
    // June 15 is Q2, next quarter starts July 1
    const next = calculateNextRun("quarterly", undefined, 1, "00:00");
    expect(next.getMonth()).toBe(6); // July
    expect(next.getDate()).toBe(1);
  });

  it("should default time to 08:00 when not provided", () => {
    const next = calculateNextRun("daily");
    expect(next.getHours()).toBe(8);
    expect(next.getMinutes()).toBe(0);
  });

  it("should default dayOfWeek to Monday (1) for weekly frequency", () => {
    // June 15, 2024 is Saturday
    const next = calculateNextRun("weekly", undefined, undefined, "12:00");
    expect(next.getDay()).toBe(1); // Monday
  });

  it("should default dayOfMonth to 1 for monthly frequency", () => {
    const next = calculateNextRun("monthly", undefined, undefined, "00:00");
    expect(next.getDate()).toBe(1);
  });

  it("should handle quarterly with non-default dayOfMonth", () => {
    const next = calculateNextRun("quarterly", undefined, 15, "09:30");
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(30);
  });
});

describe("createScheduledReport", () => {
  it("should create a scheduled report and return its id", async () => {
    const id = await createScheduledReport({
      name: "Weekly Report",
      reportType: "payroll_summary",
      frequency: "weekly",
      dayOfWeek: 1,
      time: "09:00",
      recipients: ["user@example.com"],
      deliveryMethod: "email",
      format: "xlsx",
      isActive: true,
      createdBy: "user-1",
    });

    expect(id).toBe("mock-id");
  });

  it("should call addDoc with the correct data including calculated nextRun", async () => {
    const { addDoc: addDocFn } = await import("firebase/firestore");

    await createScheduledReport({
      name: "Daily Report",
      reportType: "attendance",
      frequency: "daily",
      time: "06:00",
      recipients: ["test@example.com"],
      deliveryMethod: "dashboard",
      format: "csv",
      isActive: true,
      createdBy: "user-1",
    });

    expect(addDocFn).toHaveBeenCalledWith(
      "scheduled_reports",
      expect.objectContaining({
        name: "Daily Report",
        frequency: "daily",
        nextRun: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });
});

describe("getScheduledReports", () => {
  it("should return scheduled reports for a company", async () => {
    addMockDocs("scheduled_reports", [
      baseReport({ id: "r1", name: "Report 1" }),
      baseReport({ id: "r2", name: "Report 2" }),
    ]);

    const reports = await getScheduledReports("company-1");

    expect(reports).toHaveLength(2);
    expect(reports[0].name).toBe("Report 1");
    expect(reports[1].name).toBe("Report 2");
  });

  it("should return empty array when no reports exist", async () => {
    const reports = await getScheduledReports("company-1");
    expect(reports).toEqual([]);
  });

  it("should query by companyId", async () => {
    addMockDocs("scheduled_reports", [baseReport({ id: "r1" })]);

    await getScheduledReports("company-1");

    expect(where).toHaveBeenCalledWith("companyId", "==", "company-1");
  });
});

describe("updateScheduledReport", () => {
  it("should update the scheduled report with new data", async () => {
    await updateScheduledReport("report-1", { name: "Updated Name" });

    expect(updateDoc).toHaveBeenCalledWith(
      "scheduled_reports/report-1",
      expect.objectContaining({
        name: "Updated Name",
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("should recalculate nextRun when frequency changes", async () => {
    await updateScheduledReport("report-1", {
      frequency: "daily",
      time: "10:00",
    });

    expect(updateDoc).toHaveBeenCalledWith(
      "scheduled_reports/report-1",
      expect.objectContaining({
        frequency: "daily",
        nextRun: expect.any(Date),
      }),
    );
  });

  it("should not include nextRun when frequency is not changing", async () => {
    await updateScheduledReport("report-1", { name: "Just Name Change" });

    const callArg = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(callArg.nextRun).toBeUndefined();
  });
});

describe("deleteScheduledReport", () => {
  it("should delete the scheduled report", async () => {
    await deleteScheduledReport("report-1");

    expect(deleteDoc).toHaveBeenCalledWith("scheduled_reports/report-1");
  });
});

describe("toggleScheduleStatus", () => {
  it("should activate a scheduled report", async () => {
    await toggleScheduleStatus("report-1", true);

    expect(updateDoc).toHaveBeenCalledWith(
      "scheduled_reports/report-1",
      expect.objectContaining({
        isActive: true,
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("should deactivate a scheduled report", async () => {
    await toggleScheduleStatus("report-1", false);

    expect(updateDoc).toHaveBeenCalledWith(
      "scheduled_reports/report-1",
      expect.objectContaining({
        isActive: false,
        updatedAt: expect.any(Date),
      }),
    );
  });
});

describe("exportToXlsx", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-xlsx-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  const getExportToXlsx = async () => {
    const mod = await import("./reportScheduling");
    return mod.default.exportToXlsx;
  };

  it("should return a blob URL for xlsx data", async () => {
    const exportToXlsx = await getExportToXlsx();
    const data = [{ name: "Alice", salary: 50000 }];
    const url = await exportToXlsx(data, "test-report");
    expect(url).toBe("blob:mock-xlsx-url");
  });

  it("should handle empty data", async () => {
    const exportToXlsx = await getExportToXlsx();
    const url = await exportToXlsx([], "empty-report");
    expect(url).toBe("blob:mock-xlsx-url");
  });

  it("should handle large datasets", async () => {
    const exportToXlsx = await getExportToXlsx();
    const data = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Employee ${i}`,
    }));
    const url = await exportToXlsx(data, "large-report");
    expect(url).toBe("blob:mock-xlsx-url");
  });

  it("should handle data with various value types", async () => {
    const exportToXlsx = await getExportToXlsx();
    const data = [
      { id: 1, name: "Alice", salary: 50000.5, active: true, tags: null },
    ];
    const url = await exportToXlsx(data, "mixed-types");
    expect(url).toBe("blob:mock-xlsx-url");
  });
});

describe("exportToCsv", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-csv-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  const getExportToCsv = async () => {
    const mod = await import("./reportScheduling");
    return mod.default.exportToCsv;
  };

  it("should return a blob URL for csv data", async () => {
    const exportToCsv = await getExportToCsv();
    const data = [{ name: "Alice", salary: 50000 }];
    const url = await exportToCsv(data, "test-report");
    expect(url).toBe("blob:mock-csv-url");
  });

  it("should handle empty data", async () => {
    const exportToCsv = await getExportToCsv();
    const url = await exportToCsv([], "empty-report");
    expect(url).toBe("blob:mock-csv-url");
  });

  it("should handle large datasets", async () => {
    const exportToCsv = await getExportToCsv();
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Employee ${i}`,
    }));
    const url = await exportToCsv(data, "large-report");
    expect(url).toBe("blob:mock-csv-url");
  });

  it("should produce valid CSV output", async () => {
    const exportToCsv = await getExportToCsv();
    const data = [
      { name: "Alice", salary: 50000 },
      { name: "Bob", salary: 60000 },
    ];
    const url = await exportToCsv(data, "test");
    // If URL.createObjectURL was called with a Blob, the export succeeded
    expect(URL.createObjectURL).toHaveBeenCalledWith(
      expect.any(Blob),
    );
    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(blob.type).toBe("text/csv");
  });
});

describe("processDueReports", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-07-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should process due reports that are active and past nextRun", async () => {
    addMockDocs("scheduled_reports", [
      baseReport({
        id: "r1",
        name: "Due Report",
        isActive: true,
        nextRun: new Date("2024-07-14T08:00:00Z"), // past due
        frequency: "daily",
        time: "08:00",
        recipients: ["admin@example.com"],
        format: "xlsx",
      }),
    ]);

    await processDueReports();

    expect(generateReportData).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  it("should skip inactive reports (verify where clause is applied)", async () => {
    const { where } = await import("firebase/firestore");

    addMockDocs("scheduled_reports", [
      baseReport({
        id: "r1",
        name: "Inactive Report",
        isActive: false,
        nextRun: new Date("2024-07-14T08:00:00Z"),
      }),
    ]);

    await processDueReports();

    // Verify the query constraints are applied (the mock ignores them, but source code builds them correctly)
    expect(where).toHaveBeenCalledWith("isActive", "==", true);
  });

  it("should handle errors gracefully and log failure", async () => {
    const { addDoc: addDocFn } = await import("firebase/firestore");

    addMockDocs("scheduled_reports", [
      baseReport({
        id: "r1",
        name: "Failing Report",
        isActive: true,
        nextRun: new Date("2024-07-14T08:00:00Z"),
      }),
    ]);

    vi.mocked(generateReportData).mockRejectedValueOnce(
      new Error("Data generation failed"),
    );

    await processDueReports();

    // Should have logged a failed run
    expect(addDocFn).toHaveBeenCalledWith(
      "report_runs",
      expect.objectContaining({
        status: "failed",
        errorMessage: "Data generation failed",
      }),
    );
  });

  it("should do nothing when there are no due reports", async () => {
    await processDueReports();

    expect(generateReportData).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should update lastRun and recalculate nextRun after successful processing", async () => {
    addMockDocs("scheduled_reports", [
      baseReport({
        id: "r1",
        name: "Due Report",
        isActive: true,
        nextRun: new Date("2024-07-14T08:00:00Z"),
        frequency: "daily",
        time: "08:00",
        recipients: ["test@example.com"],
        format: "csv",
      }),
    ]);

    await processDueReports();

    // Should have updated the schedule with new run times
    expect(updateDoc).toHaveBeenCalledWith(
      "scheduled_reports/r1",
      expect.objectContaining({
        lastRun: expect.any(Date),
        nextRun: expect.any(Date),
      }),
    );
  });

  it("should send email to each recipient", async () => {
    addMockDocs("scheduled_reports", [
      baseReport({
        id: "r1",
        name: "Report",
        isActive: true,
        nextRun: new Date("2024-07-14T08:00:00Z"),
        recipients: ["a@test.com", "b@test.com"],
        deliveryMethod: "email",
        format: "xlsx",
      }),
    ]);

    await processDueReports();

    // Should send email to both recipients
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("should not send email when deliveryMethod is dashboard only", async () => {
    addMockDocs("scheduled_reports", [
      baseReport({
        id: "r1",
        name: "Dashboard Report",
        isActive: true,
        nextRun: new Date("2024-07-14T08:00:00Z"),
        deliveryMethod: "dashboard",
        format: "xlsx",
      }),
    ]);

    await processDueReports();

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
