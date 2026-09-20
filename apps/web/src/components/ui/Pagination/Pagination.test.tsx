import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("should render page navigation buttons", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("should render page number buttons", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 5")).toBeInTheDocument();
  });

  it("should highlight the current page", () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />,
    );
    const page3 = screen.getByLabelText("Page 3");
    expect(page3).toHaveAttribute("aria-current", "page");
  });

  it("should disable Previous button on first page", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("should disable Next button on last page", () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("should call onPageChange when a page button is clicked", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText("Page 3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("should call onPageChange with previous page number", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should call onPageChange with next page number", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("should show ellipsis for many pages", () => {
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />,
    );
    const ellipsis = screen.getAllByText("...");
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);
  });

  it("should return null when totalPages is 1 or less", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("should return null when totalPages is 0", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("should display showing results text when totalItems and itemsPerPage are provided", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Showing 1 to 10 of 50 results/),
    ).toBeInTheDocument();
  });

  it("should adjust showing range on second page", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Showing 11 to 20 of 50 results/),
    ).toBeInTheDocument();
  });

  it("should cap showing range on last partial page", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={45}
        itemsPerPage={10}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Showing 41 to 45 of 45 results/),
    ).toBeInTheDocument();
  });

  it("should not display results text when totalItems is not provided", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.queryByText(/results/)).not.toBeInTheDocument();
  });
});
