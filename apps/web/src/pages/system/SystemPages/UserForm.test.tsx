import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { UserForm } from "./UserForm";
import { renderWithProviders } from "@/test/page-test-utils";

const defaultProps = {
  editingId: null as string | null,
  formData: {
    username: "",
    email: "",
    displayName: "",
    password: "",
  },
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("UserForm", () => {
  it("renders add form when no editing id", () => {
    renderWithProviders(<UserForm {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /add user/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders edit form when editing id is provided", () => {
    renderWithProviders(
      <UserForm
        {...defaultProps}
        editingId="abc123"
        formData={{
          username: "jdoe",
          email: "jdoe@test.com",
          displayName: "John Doe",
          password: "",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /edit user/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("jdoe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jdoe@test.com")).toBeInTheDocument();
  });

  it("hides password field when editing", () => {
    renderWithProviders(
      <UserForm {...defaultProps} editingId="abc123" formData={{
        username: "jdoe",
        email: "jdoe@test.com",
        displayName: "John Doe",
        password: "",
      }} />,
    );
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });
});
