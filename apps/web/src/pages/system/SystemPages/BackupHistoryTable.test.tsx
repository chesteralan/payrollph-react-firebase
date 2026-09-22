import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { BackupHistoryTable } from "./BackupHistoryTable";
import { renderWithProviders } from "@/test/page-test-utils";
import type { Backup } from "./DatabasePage.types";

describe("BackupHistoryTable", () => {
  it("renders without crashing with empty backups", () => {
    renderWithProviders(<BackupHistoryTable backups={[]} />);
    expect(
      screen.getByRole("heading", { name: /backup history/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no backups yet/i)).toBeInTheDocument();
  });

  it("renders backup rows", () => {
    const backups: Backup[] = [
      {
        id: "b1",
        timestamp: new Date("2025-01-15"),
        collections: ["employees", "names"],
        size: 2048,
        status: "completed",
        totalDocuments: 150,
      },
    ];
    renderWithProviders(<BackupHistoryTable backups={backups} />);
    expect(screen.getByText(/2 collections/i)).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText(/2\.0 kb/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });
});
