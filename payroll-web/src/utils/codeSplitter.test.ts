import { describe, it, expect, vi, afterEach } from "vitest";
import { createSplitComponent, createSplitHook } from "./codeSplitter";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createSplitComponent", () => {
  it("should create a lazy component with displayName set to Lazy + componentName", () => {
    const importFn = vi.fn();
    const Component = createSplitComponent(importFn, "Dashboard");
    expect(Component.displayName).toBe("LazyDashboard");
    // React.lazy does not invoke importFn eagerly
    expect(importFn).not.toHaveBeenCalled();
  });

  it("should work with different component names", () => {
    const importFn = vi.fn();
    const Component = createSplitComponent(importFn, "Reports");
    expect(Component.displayName).toBe("LazyReports");
    expect(importFn).not.toHaveBeenCalled();
  });
});

describe("createSplitHook", () => {
  it("should call importFn on first getHook call and return the default export", async () => {
    const mockHook = () => "test hook";
    const importFn = vi.fn().mockResolvedValue({ default: mockHook });
    const { getHook } = createSplitHook(importFn);

    const result = await getHook();

    expect(importFn).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockHook);
  });

  it("should return cached hook on subsequent calls without calling importFn again", async () => {
    const mockHook = () => "test hook";
    const importFn = vi.fn().mockResolvedValue({ default: mockHook });
    const { getHook } = createSplitHook(importFn);

    const result1 = await getHook();
    const result2 = await getHook();
    const result3 = await getHook();

    expect(importFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe(mockHook);
    expect(result2).toBe(mockHook);
    expect(result3).toBe(mockHook);
  });

  it("should return the module's default export as the hook", async () => {
    const mockHookValue = { id: "test-hook" };
    const importFn = vi.fn().mockResolvedValue({ default: mockHookValue });
    const { getHook } = createSplitHook(importFn);

    const result = await getHook();

    // Verify it's the default export, not the whole module
    expect(result).not.toHaveProperty("default");
    expect(result).toBe(mockHookValue);
  });

  it("should handle concurrent calls during loading - both resolve with the same value and importFn is called once", async () => {
    let resolveImport!: (value: { default: typeof mockHook }) => void;
    const importPromise = new Promise<{ default: typeof mockHook }>(
      (resolve) => {
        resolveImport = resolve;
      },
    );
    const mockHook = () => "shared hook instance";
    const importFn = vi.fn().mockReturnValue(importPromise);
    const { getHook } = createSplitHook(importFn);

    // Make concurrent calls before the import resolves
    const promise1 = getHook();
    const promise2 = getHook();

    // importFn should have been called exactly once (not per concurrent call)
    expect(importFn).toHaveBeenCalledTimes(1);

    // Neither promise has resolved yet
    // (no easy non-flaky way to assert a promise hasn't settled without timers)

    // Resolve the import
    resolveImport!({ default: mockHook });

    const result1 = await promise1;
    const result2 = await promise2;

    expect(result1).toBe(mockHook);
    expect(result2).toBe(mockHook);
    // Still only one call to importFn
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it("should correctly cache subsequent calls after concurrent loading resolves", async () => {
    let resolveImport!: (value: { default: typeof mockHook }) => void;
    const importPromise = new Promise<{ default: typeof mockHook }>(
      (resolve) => {
        resolveImport = resolve;
      },
    );
    const mockHook = () => "hook after concurrent load";
    const importFn = vi.fn().mockReturnValue(importPromise);
    const { getHook } = createSplitHook(importFn);

    // Start two concurrent calls
    const promise1 = getHook();
    const promise2 = getHook();

    resolveImport!({ default: mockHook });

    await promise1;
    await promise2;

    // Subsequent call should use cache
    const result3 = await getHook();

    expect(result3).toBe(mockHook);
    expect(importFn).toHaveBeenCalledTimes(1);
  });
});
