import { describe, it, expect } from "vitest";
import { ToastContext, toastColors } from "./toast-context";

describe("toast-context", () => {
  it("ToastContext is defined", () => {
    expect(ToastContext).toBeDefined();
  });

  it("toastColors contains all four toast types", () => {
    expect(Object.keys(toastColors)).toEqual(
      expect.arrayContaining(["success", "error", "info", "warning"]),
    );
    expect(Object.keys(toastColors)).toHaveLength(4);
  });

  it("toastColors values are strings", () => {
    for (const color of Object.values(toastColors)) {
      expect(typeof color).toBe("string");
    }
  });
});
