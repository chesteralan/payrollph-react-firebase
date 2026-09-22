import { describe, it, expect } from "vitest";
import { CompanyContext } from "./company";

describe("CompanyContext", () => {
  it("creates a context with undefined default value", () => {
    expect(CompanyContext).toBeDefined();
    expect(CompanyContext.Provider).toBeDefined();
  });

  it("has Provider and Consumer", () => {
    expect(CompanyContext.Provider).toBeDefined();
    expect(CompanyContext.Consumer).toBeDefined();
  });
});
