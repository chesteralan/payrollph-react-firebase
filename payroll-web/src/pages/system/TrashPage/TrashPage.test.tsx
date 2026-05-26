import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { TrashPage } from "./TrashPage";
import { renderWithProviders } from "@/test/page-test-utils";
import { addMockDocs, clearMockDocs } from "../../../__mocks__/firebase";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("TrashPage", () => {
  it("renders without crashing", async () => {
    addMockDocs("companies", []);
    addMockDocs("employees", []);
    addMockDocs("names", []);
    addMockDocs("payrolls", []);
    addMockDocs("templates", []);
    renderWithProviders(<TrashPage />);
    expect(
      await screen.findByRole("heading", { name: /trash/i }),
    ).toBeInTheDocument();
  });
});
