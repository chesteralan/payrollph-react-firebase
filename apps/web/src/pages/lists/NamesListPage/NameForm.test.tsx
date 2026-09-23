import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { NameForm } from "./NameForm";
import { renderWithProviders } from "@/test/page-test-utils";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canAdd: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

const defaultProps = {
  editingId: null,
  formData: {
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
  },
  onUpdate: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("NameForm", () => {
  it("renders add form when no editing id", () => {
    renderWithProviders(<NameForm {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /add name/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/middle name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/suffix/i)).toBeInTheDocument();
  });

  it("renders edit form when editing id is provided", () => {
    renderWithProviders(
      <NameForm
        {...defaultProps}
        editingId="abc123"
        formData={{
          firstName: "John",
          middleName: "M",
          lastName: "Doe",
          suffix: "Jr.",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /edit name/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
  });
});
