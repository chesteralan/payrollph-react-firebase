import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  WizardBasicInfoStep,
  WizardLayoutStep,
  WizardHeaderFooterStep,
  WizardColumnsStep,
  WizardReviewStep,
  ToggleField,
} from "./PrintFormatsPage.wizard";

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultBasicForm = {
  name: "Test Format",
  description: "A test format",
  outputType: "register",
};

const defaultLayoutForm = {
  paperSize: "A4",
  orientation: "portrait",
  fontSize: "md" as const,
};

const defaultHeaderForm = {
  showHeader: true,
  showFooter: false,
  headerHtml: "",
  footerHtml: "",
  showCompanyLogo: true,
  showCompanyName: true,
  showCompanyAddress: false,
  showCompanyTIN: false,
  showTitle: true,
  showPeriod: false,
  showSignatureLines: false,
  signatureLabels: [],
};

describe("ToggleField", () => {
  it("renders label and checkbox", () => {
    render(
      <ToggleField label="Test Toggle" checked={false} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Test Toggle")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders checked state", () => {
    render(
      <ToggleField label="Test Toggle" checked={true} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});

describe("WizardBasicInfoStep", () => {
  it("renders name and description inputs", () => {
    render(
      <WizardBasicInfoStep
        basicForm={defaultBasicForm}
        setBasicForm={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Format Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("renders output type select", () => {
    render(
      <WizardBasicInfoStep
        basicForm={defaultBasicForm}
        setBasicForm={vi.fn()}
      />,
    );
    expect(screen.getByText("Output Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

describe("WizardLayoutStep", () => {
  it("renders paper size, orientation, and font size selects", () => {
    render(
      <WizardLayoutStep
        layoutForm={defaultLayoutForm}
        setLayoutForm={vi.fn()}
      />,
    );
    expect(screen.getByText("Paper Size")).toBeInTheDocument();
    expect(screen.getByText("Orientation")).toBeInTheDocument();
    expect(screen.getByText("Font Size")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBe(3);
  });
});

describe("WizardHeaderFooterStep", () => {
  it("renders toggle fields", () => {
    render(
      <WizardHeaderFooterStep
        headerForm={defaultHeaderForm}
        setHeaderForm={vi.fn()}
      />,
    );
    expect(screen.getByText("Show Header")).toBeInTheDocument();
    expect(screen.getByText("Show Footer")).toBeInTheDocument();
    expect(screen.getByText("Company Logo")).toBeInTheDocument();
    expect(screen.getByText("Report Title")).toBeInTheDocument();
  });

  it("renders signature labels input when showSignatureLines is true", () => {
    render(
      <WizardHeaderFooterStep
        headerForm={{
          ...defaultHeaderForm,
          showSignatureLines: true,
          signatureLabels: ["Prepared by"],
        }}
        setHeaderForm={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Signature Labels (comma-separated)"),
    ).toBeInTheDocument();
  });

  it("renders header HTML textarea when showHeader is true", () => {
    render(
      <WizardHeaderFooterStep
        headerForm={{ ...defaultHeaderForm, showHeader: true }}
        setHeaderForm={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Custom Header HTML (optional)"),
    ).toBeInTheDocument();
  });

  it("renders footer HTML textarea when showFooter is true", () => {
    render(
      <WizardHeaderFooterStep
        headerForm={{ ...defaultHeaderForm, showFooter: true }}
        setHeaderForm={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Custom Footer HTML (optional)"),
    ).toBeInTheDocument();
  });
});

describe("WizardColumnsStep", () => {
  it("renders column selection buttons", () => {
    render(
      <WizardColumnsStep
        selectedColumns={[]}
        setSelectedColumns={vi.fn()}
        includeTotals={false}
        setIncludeTotals={vi.fn()}
      />,
    );
    expect(screen.getByText("Basic Salary")).toBeInTheDocument();
    expect(screen.getByText("Earnings")).toBeInTheDocument();
    expect(screen.getByText("Net Pay")).toBeInTheDocument();
  });

  it("renders include totals checkbox", () => {
    render(
      <WizardColumnsStep
        selectedColumns={[]}
        setSelectedColumns={vi.fn()}
        includeTotals={false}
        setIncludeTotals={vi.fn()}
      />,
    );
    expect(screen.getByText("Include totals row")).toBeInTheDocument();
  });
});

describe("WizardReviewStep", () => {
  it("renders format summary with provided data", () => {
    render(
      <WizardReviewStep
        basicForm={defaultBasicForm}
        layoutForm={defaultLayoutForm}
        headerForm={defaultHeaderForm}
        selectedColumns={["basic", "earnings"]}
        includeTotals={true}
      />,
    );
    expect(screen.getByText("Format Summary")).toBeInTheDocument();
    expect(screen.getByText("Test Format")).toBeInTheDocument();
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
  });
});
