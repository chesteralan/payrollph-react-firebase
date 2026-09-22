import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DTRHistoryCard } from "./DTRHistoryCard";

describe("DTRHistoryCard", () => {
  it("renders the card title", () => {
    render(<DTRHistoryCard />);
    expect(screen.getByText("DTR History")).toBeInTheDocument();
  });

  it("shows placeholder message", () => {
    render(<DTRHistoryCard />);
    expect(
      screen.getByText(
        "Attendance records will appear here once DTR entries are created.",
      ),
    ).toBeInTheDocument();
  });
});
