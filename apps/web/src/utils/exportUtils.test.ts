import { describe, it, expect, vi } from "vitest";
import {
  employeeExportColumns,
  payrollExportColumns,
  benefitExportColumns,
  earningExportColumns,
  deductionExportColumns,
  groupExportColumns,
  userExportColumns,
  exportToCSV,
  exportToJson,
  exportToXLS,
} from "./exportUtils";

// Shared mock state for xlsx module — hoisted before vi.mock runs
const { mockBookNew, mockJsonToSheet, mockBookAppendSheet, mockWriteFile } =
  vi.hoisted(() => ({
    mockBookNew: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    mockJsonToSheet: vi.fn(() => ({})),
    mockBookAppendSheet: vi.fn(),
    mockWriteFile: vi.fn(),
  }));

vi.mock("xlsx", () => ({
  utils: {
    book_new: mockBookNew,
    json_to_sheet: mockJsonToSheet,
    book_append_sheet: mockBookAppendSheet,
  },
  writeFile: mockWriteFile,
}));

describe("exportUtils column definitions", () => {
  describe("employeeExportColumns", () => {
    it("should have the correct number of columns", () => {
      expect(employeeExportColumns).toHaveLength(9);
    });

    it("should include key columns", () => {
      const headers = employeeExportColumns.map((c) => c.header);
      expect(headers).toContain("ID");
      expect(headers).toContain("Name");
      expect(headers).toContain("Email");
      expect(headers).toContain("Status");
      expect(headers).toContain("Department");
    });

    it("should have width defined for all columns", () => {
      for (const col of employeeExportColumns) {
        expect(col.width).toBeGreaterThan(0);
      }
    });
  });

  describe("payrollExportColumns", () => {
    it("should have the correct number of columns", () => {
      expect(payrollExportColumns).toHaveLength(8);
    });

    it("should include financial columns", () => {
      const headers = payrollExportColumns.map((c) => c.header);
      expect(headers).toContain("Gross Pay");
      expect(headers).toContain("Net Pay");
      expect(headers).toContain("Employees");
    });
  });

  describe("benefitExportColumns", () => {
    it("should have 4 columns", () => {
      expect(benefitExportColumns).toHaveLength(4);
    });

    it("should include Active flag", () => {
      expect(benefitExportColumns.some((c) => c.key === "isActive")).toBe(true);
    });
  });

  describe("earningExportColumns", () => {
    it("should have 4 columns", () => {
      expect(earningExportColumns).toHaveLength(4);
    });

    it("should include Taxable flag", () => {
      expect(earningExportColumns.some((c) => c.key === "isTaxable")).toBe(
        true,
      );
    });
  });

  describe("deductionExportColumns", () => {
    it("should have 4 columns", () => {
      expect(deductionExportColumns).toHaveLength(4);
    });

    it("should include Type field", () => {
      const headers = deductionExportColumns.map((c) => c.header);
      expect(headers).toContain("Type");
    });
  });

  describe("groupExportColumns", () => {
    it("should have 4 columns", () => {
      expect(groupExportColumns).toHaveLength(4);
    });
  });

  describe("userExportColumns", () => {
    it("should have 5 columns", () => {
      expect(userExportColumns).toHaveLength(5);
    });

    it("should include Role and Display Name", () => {
      const headers = userExportColumns.map((c) => c.header);
      expect(headers).toContain("Role");
      expect(headers).toContain("Display Name");
    });
  });
});

describe("exportToCSV", () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and document.createElement for jsdom
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("should generate CSV from simple data", () => {
    const data = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
    ];

    expect(() => exportToCSV(data, columns, "test")).not.toThrow();
  });

  it("should handle empty data array", () => {
    const columns = [{ header: "ID", key: "id" }];
    expect(() => exportToCSV([], columns, "empty")).not.toThrow();
  });

  it("should handle null/undefined values", () => {
    const data = [{ id: 1, name: null, email: undefined }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
    ];
    expect(() => exportToCSV(data, columns, "null-test")).not.toThrow();
  });

  it("should handle special CSV characters (commas, quotes, newlines)", () => {
    const data = [
      { id: 1, note: "contains, comma" },
      { id: 2, note: 'has "quotes"' },
      { id: 3, note: "has\nnewline" },
    ];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Note", key: "note" },
    ];
    expect(() => exportToCSV(data, columns, "special-chars")).not.toThrow();
  });

  it("should handle large datasets", () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      email: `emp${i + 1}@company.com`,
    }));
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
    ];
    expect(() => exportToCSV(data, columns, "large-dataset")).not.toThrow();
  });

  it("should handle numeric values correctly", () => {
    const data = [{ id: 1, salary: 50000.5, rate: 0.1 }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Salary", key: "salary" },
      { header: "Rate", key: "rate" },
    ];
    expect(() => exportToCSV(data, columns, "numeric")).not.toThrow();
  });
});

describe("exportToJson", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("should generate JSON from simple data", () => {
    const data = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    expect(() => exportToJson(data, "test")).not.toThrow();
  });

  it("should handle empty data", () => {
    expect(() => exportToJson([], "empty")).not.toThrow();
  });

  it("should handle complex nested objects", () => {
    const data = [{ id: 1, meta: { department: "Engineering", role: "Dev" } }];
    expect(() => exportToJson(data, "complex")).not.toThrow();
  });

  it("should handle large datasets", () => {
    const data = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      active: i % 2 === 0,
    }));
    expect(() => exportToJson(data, "large")).not.toThrow();
  });
});

describe("exportToXLS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockColumns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Name", key: "name", width: 20 },
  ];

  const mockData = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  it("should create a workbook and call writeFile", () => {
    exportToXLS(mockData, { filename: "test", columns: mockColumns });

    expect(mockBookNew).toHaveBeenCalledOnce();
    expect(mockJsonToSheet).toHaveBeenCalledOnce();
    expect(mockBookAppendSheet).toHaveBeenCalledOnce();
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it("should format data using column headers as output keys", () => {
    exportToXLS(mockData, { filename: "test", columns: mockColumns });

    const formattedData = mockJsonToSheet.mock.calls[0][0];
    expect(formattedData).toEqual([
      { ID: 1, Name: "Alice" },
      { ID: 2, Name: "Bob" },
    ]);
  });

  it("should set column widths on the worksheet", () => {
    exportToXLS(mockData, { filename: "test", columns: mockColumns });

    const ws = mockJsonToSheet.mock.results[0].value;
    expect(ws["!cols"]).toEqual([{ wch: 10 }, { wch: 20 }]);
  });

  it("should use default width of 15 when column width is not specified", () => {
    const columnsNoWidth = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
    ];
    exportToXLS(mockData, { filename: "test", columns: columnsNoWidth });

    const ws = mockJsonToSheet.mock.results[0].value;
    expect(ws["!cols"]).toEqual([{ wch: 15 }, { wch: 15 }]);
  });

  it("should append sheet with default name 'Data' when sheetName is omitted", () => {
    exportToXLS(mockData, { filename: "test", columns: mockColumns });

    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      "Data",
    );
  });

  it("should append sheet with custom sheet name", () => {
    exportToXLS(mockData, {
      filename: "test",
      columns: mockColumns,
      sheetName: "Employees",
    });

    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      "Employees",
    );
  });

  it("should truncate sheet name to 31 characters", () => {
    const longName = "A".repeat(40);
    exportToXLS(mockData, {
      filename: "test",
      columns: mockColumns,
      sheetName: longName,
    });

    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      longName.slice(0, 31),
    );
  });

  it("should include a date timestamp in the filename by default", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));

    exportToXLS(mockData, { filename: "test", columns: mockColumns });

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(Object),
      "test_2024-06-15.xlsx",
    );

    vi.useRealTimers();
  });

  it("should exclude timestamp from filename when includeTimestamp is false", () => {
    exportToXLS(mockData, {
      filename: "test",
      columns: mockColumns,
      includeTimestamp: false,
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(Object),
      "test.xlsx",
    );
  });

  it("should call book_new, json_to_sheet, book_append_sheet, writeFile in order", () => {
    exportToXLS(mockData, { filename: "test", columns: mockColumns });

    // Verify the call order: book_new first, then json_to_sheet, then book_append_sheet, then writeFile
    expect(mockBookNew).toHaveBeenCalledBefore(mockJsonToSheet);
    expect(mockJsonToSheet).toHaveBeenCalledBefore(mockBookAppendSheet);
    expect(mockBookAppendSheet).toHaveBeenCalledBefore(mockWriteFile);
  });

  it("should handle empty data array", () => {
    exportToXLS([], { filename: "empty", columns: mockColumns });

    expect(mockBookNew).toHaveBeenCalledOnce();
    expect(mockJsonToSheet).toHaveBeenCalledWith([]);
    expect(mockBookAppendSheet).toHaveBeenCalledOnce();
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it("should handle data with undefined values", () => {
    const dataWithUndefined = [{ id: 1, name: undefined }];
    exportToXLS(dataWithUndefined, {
      filename: "test",
      columns: mockColumns,
    });

    const formattedData = mockJsonToSheet.mock.calls[0][0];
    expect(formattedData).toEqual([{ ID: 1, Name: undefined }]);
  });

  it("should handle data with missing keys gracefully", () => {
    const dataMissingKeys = [{ id: 1 }]; // missing 'name'
    exportToXLS(dataMissingKeys, {
      filename: "test",
      columns: mockColumns,
    });

    const formattedData = mockJsonToSheet.mock.calls[0][0];
    expect(formattedData).toEqual([{ ID: 1, Name: undefined }]);
  });
});
