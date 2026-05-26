import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CompanySelectPage } from "./CompanySelectPage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CompanySelectPage", () => {
  it("renders without crashing and shows the heading", () => {
    render(
      <MemoryRouter>
        <CompanySelectPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Select Company")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <MemoryRouter>
        <CompanySelectPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Choose a company to continue"),
    ).toBeInTheDocument();
  });
});
