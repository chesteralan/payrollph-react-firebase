import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DTRPage } from "./DTRPage";

// Mock the firebase config
vi.mock("@/config/firebase", () => ({
  db: {},
}));

// Mock hooks
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canView: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}));

describe("DTRPage", () => {
  it("renders the DTR page heading", async () => {
    render(
      <BrowserRouter>
        <DTRPage />
      </BrowserRouter>,
    );
    expect(await screen.findByText("Daily Time Record")).toBeTruthy();
  });
});
