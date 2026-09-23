import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentsCard } from "./DocumentsCard";
import type { EmployeeDocument } from "./EmployeeProfilePage.types";

const mockDocuments: EmployeeDocument[] = [
  {
    id: "d1",
    employeeId: "e1",
    fileName: "resume.pdf",
    fileType: "application/pdf",
    fileSize: 102400,
    fileUrl: "https://example.com/resume.pdf",
    uploadedAt: "2024-01-15T00:00:00Z",
    category: "ID",
    notes: "Government ID",
  },
  {
    id: "d2",
    employeeId: "e1",
    fileName: "contract.pdf",
    fileType: "application/pdf",
    fileSize: 204800,
    fileUrl: "https://example.com/contract.pdf",
    uploadedAt: "2024-02-10T00:00:00Z",
    category: "Contract",
  },
];

const defaultProps = {
  documents: mockDocuments,
  selectedFile: null as File | null,
  uploading: false,
  uploadProgress: 0,
  docCategory: "ID" as const,
  docNotes: "",
  onFileSelect: vi.fn(),
  onDocCategoryChange: vi.fn(),
  onDocNotesChange: vi.fn(),
  onUpload: vi.fn(),
  onDeleteDocument: vi.fn(),
  formatFileSize: (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`,
};

function setup(props?: Partial<typeof defaultProps>) {
  return { ...defaultProps, ...props };
}

describe("DocumentsCard", () => {
  it("renders the card title", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("renders upload section heading", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("Upload New Document")).toBeInTheDocument();
  });

  it("renders document list heading", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("Uploaded Documents")).toBeInTheDocument();
  });

  it("shows file name in upload area when a file is selected", () => {
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(<DocumentsCard {...setup({ selectedFile: file })} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("shows default prompt when no file is selected", () => {
    render(<DocumentsCard {...setup({ selectedFile: null })} />);
    expect(
      screen.getByText("Click to select a file or drag and drop"),
    ).toBeInTheDocument();
  });

  it("renders document table with file names", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
  });

  it("displays document category badges", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Contract")).toBeInTheDocument();
  });

  it("shows document notes", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("Government ID")).toBeInTheDocument();
  });

  it("formats file sizes using formatFileSize", () => {
    render(<DocumentsCard {...setup()} />);
    expect(screen.getByText("100 KB")).toBeInTheDocument();
    expect(screen.getByText("200 KB")).toBeInTheDocument();
  });

  it("shows empty state when no documents", () => {
    render(<DocumentsCard {...setup({ documents: [] })} />);
    expect(screen.getByText("No documents uploaded yet.")).toBeInTheDocument();
  });

  it("shows upload progress when uploading", () => {
    render(
      <DocumentsCard {...setup({ uploading: true, uploadProgress: 50 })} />,
    );
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows category select and notes input when file is selected", () => {
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(<DocumentsCard {...setup({ selectedFile: file })} />);
    expect(screen.getAllByText("Category").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Notes (Optional)")).toBeInTheDocument();
  });

  it("shows Upload Document button when file is selected", () => {
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(<DocumentsCard {...setup({ selectedFile: file })} />);
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
  });

  it("calls onUpload when Upload Document is clicked", () => {
    const onUpload = vi.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(<DocumentsCard {...setup({ selectedFile: file, onUpload })} />);
    fireEvent.click(screen.getByText("Upload Document"));
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it("disables upload button when uploading", () => {
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(
      <DocumentsCard {...setup({ selectedFile: file, uploading: true })} />,
    );
    const buttons = screen.getAllByText("Uploading...");
    const uploadButton = buttons.find((el) => el.tagName === "BUTTON");
    expect(uploadButton).toBeDisabled();
  });

  it("calls onDocNotesChange when notes input changes", () => {
    const onChange = vi.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(
      <DocumentsCard
        {...setup({ selectedFile: file, onDocNotesChange: onChange })}
      />,
    );
    fireEvent.change(
      screen.getByPlaceholderText("Add notes about this document"),
      {
        target: { value: "new note" },
      },
    );
    expect(onChange).toHaveBeenCalledWith("new note");
  });

  it("calls onDocCategoryChange when category select changes", () => {
    const onChange = vi.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    render(
      <DocumentsCard
        {...setup({ selectedFile: file, onDocCategoryChange: onChange })}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("ID"), {
      target: { value: "Contract" },
    });
    expect(onChange).toHaveBeenCalledWith("Contract");
  });

  it("renders download links with correct href", () => {
    render(<DocumentsCard {...setup()} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "https://example.com/resume.pdf");
    expect(links[0]).toHaveAttribute("target", "_blank");
  });
});
