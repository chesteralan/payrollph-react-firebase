import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonalInfoSection } from "./PersonalInfoSection";

const defaultForm = {
  sss: "34-1234567-8",
  tin: "123-456-789-000",
  philhealth: "12-345678901-2",
  hdmf: "1234-5678-9012",
  bankName: "BDO",
  bankAccount: "1234567890",
  dateOfBirth: "1990-05-15",
  gender: "male" as const,
  civilStatus: "single" as const,
};

const defaultProps = {
  profileForm: defaultForm,
  onProfileFormChange: vi.fn(),
  onSaveProfile: vi.fn(),
  saving: false,
};

function setup(props?: Partial<typeof defaultProps>) {
  return { ...defaultProps, ...props };
}

describe("PersonalInfoSection", () => {
  it("renders the card title", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
  });

  it("renders SSS input with correct value", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByLabelText("SSS Number")).toHaveValue("34-1234567-8");
  });

  it("renders TIN input with correct value", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByLabelText("TIN")).toHaveValue("123-456-789-000");
  });

  it("renders PhilHealth input with correct value", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByLabelText("PhilHealth")).toHaveValue("12-345678901-2");
  });

  it("renders HDMF input with correct value", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByLabelText("HDMF (Pag-IBIG)")).toHaveValue("1234-5678-9012");
  });

  it("renders bank name and account inputs", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByLabelText("Bank Name")).toHaveValue("BDO");
    expect(screen.getByLabelText("Bank Account Number")).toHaveValue("1234567890");
  });

  it("renders date of birth input", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByDisplayValue("1990-05-15")).toBeInTheDocument();
  });

  it("renders gender select with correct value", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByDisplayValue("Male")).toBeInTheDocument();
  });

  it("renders civil status select with correct value", () => {
    render(<PersonalInfoSection {...setup()} />);
    expect(screen.getByDisplayValue("Single")).toBeInTheDocument();
  });

  it("calls onProfileFormChange when SSS input changes", () => {
    const onChange = vi.fn();
    render(<PersonalInfoSection {...setup({ onProfileFormChange: onChange })} />);
    fireEvent.change(screen.getByLabelText("SSS Number"), {
      target: { value: "00-0000000-0" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onSaveProfile when Save button is clicked", () => {
    const onSave = vi.fn();
    render(<PersonalInfoSection {...setup({ onSaveProfile: onSave })} />);
    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables Save button when saving", () => {
    render(<PersonalInfoSection {...setup({ saving: true })} />);
    expect(screen.getByText("Saving...")).toBeDisabled();
  });

  it("shows Saving... text when saving", () => {
    render(<PersonalInfoSection {...setup({ saving: true })} />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("calls onProfileFormChange when gender select changes", () => {
    const onChange = vi.fn();
    render(<PersonalInfoSection {...setup({ onProfileFormChange: onChange })} />);
    fireEvent.change(screen.getByDisplayValue("Male"), {
      target: { value: "female" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onProfileFormChange when civil status select changes", () => {
    const onChange = vi.fn();
    render(<PersonalInfoSection {...setup({ onProfileFormChange: onChange })} />);
    fireEvent.change(screen.getByDisplayValue("Single"), {
      target: { value: "married" },
    });
    expect(onChange).toHaveBeenCalled();
  });
});
