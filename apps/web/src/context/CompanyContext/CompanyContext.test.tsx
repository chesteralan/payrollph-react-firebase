import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CompanyProvider } from "./CompanyContext";
import { CompanyContext } from "@/context/company";
import { useContext } from "react";
import type { Company } from "@/types";

function TestConsumer() {
  const ctx = useContext(CompanyContext);
  if (!ctx) return <div data-testid="no-ctx">no context</div>;
  return (
    <div>
      <div data-testid="companies-count">{ctx.companies.length}</div>
      <div data-testid="selected-name">
        {ctx.selectedCompany?.name ?? "none"}
      </div>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <button
        data-testid="select-btn"
        onClick={() =>
          ctx.selectCompany({
            id: "c1",
            name: "Test Corp",
            code: "TC",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Company)
        }
      >
        Select
      </button>
    </div>
  );
}

describe("CompanyProvider", () => {
  it("should provide initial context with empty companies", () => {
    render(
      <CompanyProvider>
        <TestConsumer />
      </CompanyProvider>,
    );
    expect(screen.getByTestId("companies-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-name")).toHaveTextContent("none");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("should update selected company when selectCompany is called", () => {
    render(
      <CompanyProvider>
        <TestConsumer />
      </CompanyProvider>,
    );
    act(() => {
      screen.getByTestId("select-btn").click();
    });
    expect(screen.getByTestId("selected-name")).toHaveTextContent("Test Corp");
  });

  it("should expose selectCompany function", () => {
    let capturedCtx: unknown = null;
    function CaptureConsumer() {
      const ctx = useContext(CompanyContext);
      capturedCtx = ctx;
      return null;
    }
    render(
      <CompanyProvider>
        <CaptureConsumer />
      </CompanyProvider>,
    );
    const ctx = capturedCtx as { selectCompany: Function };
    expect(typeof ctx.selectCompany).toBe("function");
  });

  it("should render children", () => {
    render(
      <CompanyProvider>
        <div data-testid="child">child</div>
      </CompanyProvider>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("child");
  });
});
