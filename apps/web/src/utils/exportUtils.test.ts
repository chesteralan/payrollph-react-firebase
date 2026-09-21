import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  generateCSVBlob,
  generateJSONBlob,
  downloadBlob,
} from "./exportUtils";

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
    it("should have 9 columns", () => {
      expect(employeeExportColumns).toHaveLength(9);
    });

    it("should include key columns", () => {
      const headers = employeeExportColumns.map((c) => c.header);
      expect(headers).toContain("ID");
      expect(headers).toContain("Name");
      expect(headers).toContain("Email");
      expect(headers).toContain("Status");
      expect(headers).toContain("Department");
      expect(headers).toContain("Phone");
      expect(headers).toContain("Date Hired");
    });

    it("should have width defined for all columns", () => {
      for (const col of employeeExportColumns) {
        expect(col.width).toBeGreaterThan(0);
      }
    });

    it("should have unique keys", () => {
      const keys = employeeExportColumns.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe("payrollExportColumns", () => {
    it("should have 8 columns", () => {
      expect(payrollExportColumns).toHaveLength(8);
    });

    it("should include financial columns", () => {
      const headers = payrollExportColumns.map((c) => c.header);
      expect(headers).toContain("Gross Pay");
      expect(headers).toContain("Net Pay");
      expect(headers).toContain("Employees");
      expect(headers).toContain("Month");
      expect(headers).toContain("Year");
    });

    it("should have unique keys", () => {
      const keys = payrollExportColumns.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
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

    it("should have description column", () => {
      expect(groupExportColumns.some((c) => c.key === "description")).toBe(
        true,
      );
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

describe("generateCSVBlob", () => {
  it("should return a Blob with type text/csv", () => {
    const data = [{ id: 1, name: "Alice" }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
    ];
    const blob = generateCSVBlob(data, columns);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("should produce correct CSV headers", async () => {
    const data = [{ id: 1, name: "Alice" }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe("ID,Name\n1,Alice");
  });

  it("should handle multiple rows", async () => {
    const data = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    const lines = text.split("\n");
    expect(lines).toHaveLength(4); // header + 3 rows
    expect(lines[0]).toBe("ID,Name");
    expect(lines[1]).toBe("1,Alice");
    expect(lines[2]).toBe("2,Bob");
    expect(lines[3]).toBe("3,Charlie");
  });

  it("should return empty CSV with only headers for empty data", async () => {
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
    ];
    const blob = generateCSVBlob([], columns);
    const text = await blob.text();
    expect(text).toBe("ID,Name");
  });

  it("should map null and undefined values to empty strings", async () => {
    const data = [{ id: 1, name: null, email: undefined }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe("ID,Name,Email\n1,,");
  });

  it("should quote fields containing commas", async () => {
    const data = [{ id: 1, note: "hello, world" }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Note", key: "note" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe('ID,Note\n1,"hello, world"');
  });

  it("should escape double quotes inside fields", async () => {
    const data = [{ id: 1, note: 'say "hi"' }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Note", key: "note" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe('ID,Note\n1,"say ""hi"""');
  });

  it("should quote fields containing newlines", async () => {
    const data = [{ id: 1, note: "line1\nline2" }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Note", key: "note" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe('ID,Note\n1,"line1\nline2"');
  });

  it("should convert numeric values to strings", async () => {
    const data = [{ id: 42, salary: 50000.5 }];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Salary", key: "salary" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe("ID,Salary\n42,50000.5");
  });

  it("should handle boolean values", async () => {
    const data = [{ active: true, inactive: false }];
    const columns = [
      { header: "Active", key: "active" },
      { header: "Inactive", key: "inactive" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe("Active,Inactive\ntrue,false");
  });

  it("should handle keys not present in the row", async () => {
    const data = [{ id: 1 }] as Record<string, unknown>[];
    const columns = [
      { header: "ID", key: "id" },
      { header: "Missing", key: "missing" },
    ];
    const blob = generateCSVBlob(data, columns);
    const text = await blob.text();
    expect(text).toBe("ID,Missing\n1,");
  });
});

describe("generateJSONBlob", () => {
  it("should return a Blob with type application/json", () => {
    const data = [{ id: 1, name: "Alice" }];
    const blob = generateJSONBlob(data);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("should produce pretty-printed JSON with 2-space indentation", async () => {
    const data = [{ id: 1, name: "Alice" }];
    const blob = generateJSONBlob(data);
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed).toEqual(data);
    expect(text).toContain("  ");
  });

  it("should handle empty array", async () => {
    const blob = generateJSONBlob([]);
    const text = await blob.text();
    expect(text).toBe("[]");
  });

  it("should serialize complex nested objects", async () => {
    const data = [
      {
        id: 1,
        meta: { department: "Engineering", roles: ["dev", "lead"] },
      },
    ];
    const blob = generateJSONBlob(data);
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed[0].meta.department).toBe("Engineering");
    expect(parsed[0].meta.roles).toEqual(["dev", "lead"]);
  });

  it("should handle large datasets", async () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
    }));
    const blob = generateJSONBlob(data);
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed).toHaveLength(100);
  });

  it("should handle null and undefined values", async () => {
    const data = [{ id: 1, name: null, extra: undefined }] as Record<
      string,
      unknown
    >[];
    const blob = generateJSONBlob(data);
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].name).toBeNull();
    expect(parsed[0]).not.toHaveProperty("extra");
  });
});

describe("downloadBlob", () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        el.click = clickSpy;
      }
      return el;
    });
    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => undefined as unknown as Node);
    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => undefined as unknown as Node);
    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a blob URL and revoke it after download", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    downloadBlob(blob, "test.txt");

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should create an anchor element with correct attributes", () => {
    let capturedAnchor: HTMLAnchorElement | undefined;
    appendChildSpy.mockImplementation((node: Node) => {
      capturedAnchor = node as HTMLAnchorElement;
      return node;
    });

    const blob = new Blob(["data"], { type: "text/csv" });
    downloadBlob(blob, "report.csv");

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(capturedAnchor).toBeDefined();
    expect(capturedAnchor!.href).toBe("blob:mock-url");
    expect(capturedAnchor!.download).toBe("report.csv");
  });

  it("should append anchor to body, click it, then remove it", () => {
    const blob = new Blob(["data"]);
    downloadBlob(blob, "file.txt");

    expect(appendChildSpy).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(removeChildSpy).toHaveBeenCalledOnce();
  });

  it("should handle different filename extensions", () => {
    let capturedAnchor: HTMLAnchorElement | undefined;
    appendChildSpy.mockImplementation((node: Node) => {
      capturedAnchor = node as HTMLAnchorElement;
      return node;
    });

    const blob = new Blob(["data"]);
    downloadBlob(blob, "export.json");

    expect(capturedAnchor).toBeDefined();
    expect(capturedAnchor!.download).toBe("export.json");
  });

  it("should handle empty blob", () => {
    const blob = new Blob([]);
    expect(() => downloadBlob(blob, "empty.txt")).not.toThrow();
  });
});

describe("exportToCSV", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("should trigger download with .csv extension", () => {
    let capturedAnchor: HTMLAnchorElement | undefined;
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = vi.fn();
      return el;
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
      capturedAnchor = node as HTMLAnchorElement;
      return node;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => undefined as unknown as Node,
    );

    exportToCSV([{ id: 1 }], [{ header: "ID", key: "id" }], "myreport");
    expect(capturedAnchor).toBeDefined();
    expect(capturedAnchor!.download).toBe("myreport.csv");
  });
});

describe("exportToJson", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("should trigger download with .json extension", () => {
    let capturedAnchor: HTMLAnchorElement | undefined;
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = vi.fn();
      return el;
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
      capturedAnchor = node as HTMLAnchorElement;
      return node;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => undefined as unknown as Node,
    );

    exportToJson([{ id: 1 }], "myexport");
    expect(capturedAnchor).toBeDefined();
    expect(capturedAnchor!.download).toBe("myexport.json");
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
    const dataMissingKeys = [{ id: 1 }];
    exportToXLS(dataMissingKeys, {
      filename: "test",
      columns: mockColumns,
    });

    const formattedData = mockJsonToSheet.mock.calls[0][0];
    expect(formattedData).toEqual([{ ID: 1, Name: undefined }]);
  });

  it("should handle single column export", () => {
    const singleCol = [{ header: "ID", key: "id" }];
    exportToXLS([{ id: 42 }], { filename: "single", columns: singleCol });

    const formattedData = mockJsonToSheet.mock.calls[0][0];
    expect(formattedData).toEqual([{ ID: 42 }]);
  });

  it("should handle includeTimestamp explicitly set to true", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    exportToXLS(mockData, {
      filename: "test",
      columns: mockColumns,
      includeTimestamp: true,
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(Object),
      "test_2025-01-01.xlsx",
    );
    vi.useRealTimers();
  });
});
