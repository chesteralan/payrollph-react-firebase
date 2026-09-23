import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactInfoCard } from "./ContactInfoCard";
import type { EmployeeContact } from "./EmployeeProfilePage.types";

const mockContacts: EmployeeContact[] = [
  {
    id: "c1",
    employeeId: "e1",
    type: "phone",
    value: "09171234567",
    isPrimary: true,
  },
  {
    id: "c2",
    employeeId: "e1",
    type: "email",
    value: "test@example.com",
    isPrimary: false,
  },
  {
    id: "c3",
    employeeId: "e1",
    type: "address",
    value: "123 Main St",
    isPrimary: false,
  },
];

const defaultProps = {
  contacts: mockContacts,
  showContactForm: false,
  contactForm: { type: "phone" as const, value: "", isPrimary: false },
  onContactFormChange: vi.fn(),
  onShowContactFormChange: vi.fn(),
  onAddContact: vi.fn(),
  onDeleteContact: vi.fn(),
};

function setup(props?: Partial<typeof defaultProps>) {
  return { ...defaultProps, ...props };
}

describe("ContactInfoCard", () => {
  it("renders the card title", () => {
    render(<ContactInfoCard {...setup()} />);
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
  });

  it("renders all contacts", () => {
    render(<ContactInfoCard {...setup()} />);
    expect(screen.getByText("09171234567")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("displays primary label for primary contacts", () => {
    render(<ContactInfoCard {...setup()} />);
    expect(screen.getByText(/phone.*Primary/)).toBeInTheDocument();
  });

  it("shows empty state when no contacts", () => {
    render(<ContactInfoCard {...setup({ contacts: [] })} />);
    expect(
      screen.getByText("No contact information added yet."),
    ).toBeInTheDocument();
  });

  it("shows Add Contact button when form is hidden", () => {
    render(<ContactInfoCard {...setup({ showContactForm: false })} />);
    expect(screen.getByText("Add Contact")).toBeInTheDocument();
  });

  it("hides Add Contact button when form is shown", () => {
    render(<ContactInfoCard {...setup({ showContactForm: true })} />);
    expect(screen.queryByText("Add Contact")).not.toBeInTheDocument();
  });

  it("calls onShowContactFormChange(true) when Add Contact is clicked", () => {
    const onShow = vi.fn();
    render(<ContactInfoCard {...setup({ onShowContactFormChange: onShow })} />);
    fireEvent.click(screen.getByText("Add Contact"));
    expect(onShow).toHaveBeenCalledWith(true);
  });

  it("renders the contact form when showContactForm is true", () => {
    render(<ContactInfoCard {...setup({ showContactForm: true })} />);
    expect(screen.getByText("Add")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onContactFormChange when type select changes", () => {
    const onChange = vi.fn();
    render(
      <ContactInfoCard
        {...setup({ showContactForm: true, onContactFormChange: onChange })}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Phone"), {
      target: { value: "email" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onShowContactFormChange(false) when Cancel is clicked", () => {
    const onShow = vi.fn();
    render(
      <ContactInfoCard
        {...setup({ showContactForm: true, onShowContactFormChange: onShow })}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onShow).toHaveBeenCalledWith(false);
  });

  it("calls onDeleteContact with contact id when delete is clicked", () => {
    const onDelete = vi.fn();
    render(<ContactInfoCard {...setup({ onDeleteContact: onDelete })} />);
    const deleteButtons = screen.getAllByRole("button");
    const trashButtons = deleteButtons.filter(
      (btn) => btn.querySelector("svg") !== null && !btn.textContent?.trim(),
    );
    fireEvent.click(trashButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("c1");
  });
});
