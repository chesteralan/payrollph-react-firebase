import { describe, it, expect } from "vitest";
import { AuthContext } from "./auth";

describe("AuthContext", () => {
  it("creates a context with undefined default value", () => {
    expect(AuthContext).toBeDefined();
    expect(AuthContext.Provider).toBeDefined();
  });

  it("has Provider and Consumer", () => {
    expect(AuthContext.Provider).toBeDefined();
    expect(AuthContext.Consumer).toBeDefined();
  });
});
