import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { WizardContent } from "./TemplatesPage.wizard";
import { renderWithProviders } from "@/test/page-test-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultBasicForm = {
  name: "Test Template",
  description: "A test template",
  printFormat: "register",
  groupBy: "group",
};

const defaultProps = {
  wizardStep: 0,
  setWizardStep: vi.fn(),
  editingId: null,
  basicForm: defaultBasicForm,
  setBasicForm: vi.fn(),
  selectedGroups: [],
  selectedPositions: [],
  selectedAreas: [],
  selectedStatuses: [],
  selectedEarnings: [],
  selectedDeductions: [],
  selectedBenefits: [],
  selectedPrintColumns: [],
  groups: [],
  positions: [],
  areas: [],
  statuses: [],
  earningsList: [],
  deductionsList: [],
  benefitsList: [],
  printFormats: [],
  onToggle: vi.fn(),
  setSelectedGroups: vi.fn(),
  setSelectedPositions: vi.fn(),
  setSelectedAreas: vi.fn(),
  setSelectedStatuses: vi.fn(),
  setSelectedEarnings: vi.fn(),
  setSelectedDeductions: vi.fn(),
  setSelectedBenefits: vi.fn(),
  setSelectedPrintColumns: vi.fn(),
  handleSubmit: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describe("WizardContent", () => {
  it("renders Create Template heading", () => {
    renderWithProviders(<WizardContent {...defaultProps} />);
    expect(screen.getByText("Create Template")).toBeInTheDocument();
  });

  it("renders Edit Template heading when editing", () => {
    renderWithProviders(
      <WizardContent {...defaultProps} editingId="t1" />,
    );
    expect(screen.getByText("Edit Template")).toBeInTheDocument();
  });

  it("renders step 0 basic info fields", () => {
    renderWithProviders(<WizardContent {...defaultProps} />);
    expect(screen.getByLabelText("Template Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByText("Print Format")).toBeInTheDocument();
    expect(screen.getByText("Default Group By")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBe(2);
  });

  it("renders wizard step indicators", () => {
    renderWithProviders(<WizardContent {...defaultProps} />);
    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("Groups & Filters")).toBeInTheDocument();
  });

  it("renders Previous and Next buttons", () => {
    renderWithProviders(<WizardContent {...defaultProps} />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables Previous on first step", () => {
    renderWithProviders(<WizardContent {...defaultProps} wizardStep={0} />);
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("renders Create Template button on last step", () => {
    renderWithProviders(
      <WizardContent {...defaultProps} wizardStep={4} />,
    );
    expect(screen.getAllByText("Create Template").length).toBeGreaterThanOrEqual(2);
  });
});
