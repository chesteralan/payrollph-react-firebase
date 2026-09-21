import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTemplatesPage } from "./useTemplatesPage";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: vi.fn(() => true),
    canAdd: vi.fn(() => true),
    canEdit: vi.fn(() => true),
    canDelete: vi.fn(() => true),
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe("useTemplatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTemplatesPage());

    expect(result.current).toBeDefined();
    expect(result.current.templates).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.showWizard).toBe(false);
    expect(result.current.editingId).toBeNull();
    expect(result.current.wizardStep).toBe(0);
  });

  it("should expose wizard form state", () => {
    const { result } = renderHook(() => useTemplatesPage());

    expect(result.current.basicForm).toEqual({
      name: "",
      description: "",
      printFormat: "register",
      groupBy: "group",
    });
    expect(result.current.selectedGroups).toEqual([]);
    expect(result.current.selectedPositions).toEqual([]);
    expect(result.current.selectedAreas).toEqual([]);
    expect(result.current.selectedStatuses).toEqual([]);
    expect(result.current.selectedEarnings).toEqual([]);
    expect(result.current.selectedDeductions).toEqual([]);
    expect(result.current.selectedBenefits).toEqual([]);
    expect(result.current.selectedPrintColumns).toEqual([
      "basic", "earnings", "gross", "deductions", "benefits", "net",
    ]);
  });

  it("should expose lookup data", () => {
    const { result } = renderHook(() => useTemplatesPage());

    expect(result.current.groups).toEqual([]);
    expect(result.current.positions).toEqual([]);
    expect(result.current.areas).toEqual([]);
    expect(result.current.statuses).toEqual([]);
    expect(result.current.earningsList).toEqual([]);
    expect(result.current.deductionsList).toEqual([]);
    expect(result.current.benefitsList).toEqual([]);
    expect(result.current.printFormats).toEqual([]);
  });

  it("should expose action functions", () => {
    const { result } = renderHook(() => useTemplatesPage());

    expect(typeof result.current.openWizard).toBe("function");
    expect(typeof result.current.closeWizard).toBe("function");
    expect(typeof result.current.handleClone).toBe("function");
    expect(typeof result.current.handleDelete).toBe("function");
    expect(typeof result.current.handleSubmit).toBe("function");
    expect(typeof result.current.toggleItem).toBe("function");
  });

  it("should expose setters", () => {
    const { result } = renderHook(() => useTemplatesPage());

    expect(typeof result.current.setWizardStep).toBe("function");
    expect(typeof result.current.setBasicForm).toBe("function");
    expect(typeof result.current.setSelectedGroups).toBe("function");
    expect(typeof result.current.setSelectedPositions).toBe("function");
    expect(typeof result.current.setSelectedAreas).toBe("function");
    expect(typeof result.current.setSelectedStatuses).toBe("function");
    expect(typeof result.current.setSelectedEarnings).toBe("function");
    expect(typeof result.current.setSelectedDeductions).toBe("function");
    expect(typeof result.current.setSelectedBenefits).toBe("function");
    expect(typeof result.current.setSelectedPrintColumns).toBe("function");
  });

  it("should expose permissions", () => {
    const { result } = renderHook(() => useTemplatesPage());

    expect(typeof result.current.canView).toBe("function");
    expect(typeof result.current.canAdd).toBe("function");
    expect(typeof result.current.canEdit).toBe("function");
    expect(typeof result.current.canDelete).toBe("function");
  });
});
