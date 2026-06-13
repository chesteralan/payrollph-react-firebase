import { describe, it, expect, vi } from "vitest";
import { ValueStore } from "./valueStore";

describe("ValueStore", () => {
  it("should initialize with the given value", () => {
    const store = new ValueStore(42);
    expect(store.getSnapshot()).toBe(42);
  });

  it("should initialize with an object", () => {
    const store = new ValueStore({ a: 1, b: "hello" });
    expect(store.getSnapshot()).toEqual({ a: 1, b: "hello" });
  });

  it("should initialize with an array", () => {
    const store = new ValueStore([1, 2, 3]);
    expect(store.getSnapshot()).toEqual([1, 2, 3]);
  });

  it("should update the value when set is called", () => {
    const store = new ValueStore(0);
    store.set(1);
    expect(store.getSnapshot()).toBe(1);
  });

  it("should update with objects", () => {
    const store = new ValueStore({ count: 0 });
    store.set({ count: 1 });
    expect(store.getSnapshot()).toEqual({ count: 1 });
  });

  it("should notify subscribers when value changes", () => {
    const store = new ValueStore(0);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should NOT notify subscribers when value is the same (Object.is)", () => {
    const store = new ValueStore(42);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(42);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should NOT notify for same object reference", () => {
    const obj = { a: 1 };
    const store = new ValueStore(obj);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(obj);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should notify multiple subscribers", () => {
    const store = new ValueStore(0);
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    store.subscribe(listener1);
    store.subscribe(listener2);

    store.set(1);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("should not notify unsubscribed listeners", () => {
    const store = new ValueStore(0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    store.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should support multiple subscribe/unsubscribe cycles", () => {
    const store = new ValueStore(0);
    const listener = vi.fn();

    const unsub1 = store.subscribe(listener);
    unsub1();

    const unsub2 = store.subscribe(listener);
    store.set(1);
    expect(listener).toHaveBeenCalledTimes(1);

    unsub2();
    store.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should handle undefined initial value", () => {
    const store = new ValueStore<undefined>(undefined);
    expect(store.getSnapshot()).toBeUndefined();
  });

  it("should handle null initial value", () => {
    const store = new ValueStore<null>(null);
    expect(store.getSnapshot()).toBeNull();
  });

  it("should support empty string initial value", () => {
    const store = new ValueStore("");
    expect(store.getSnapshot()).toBe("");
    store.set("new");
    expect(store.getSnapshot()).toBe("new");
  });

  it("should NOT notify when setting same string after Object.is check", () => {
    const store = new ValueStore("hello");
    const listener = vi.fn();
    store.subscribe(listener);

    store.set("hello");
    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle rapid successive updates", () => {
    const store = new ValueStore(0);
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(1);
    store.set(2);
    store.set(3);
    expect(store.getSnapshot()).toBe(3);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("should be usable with useSyncExternalStore pattern", () => {
    // This simulates how React's useSyncExternalStore uses the store
    const store = new ValueStore("initial");

    // Simulate getServerSnapshot / getSnapshot
    expect(store.getSnapshot()).toBe("initial");

    // Simulate subscription
    const onStoreChange = vi.fn();
    const unsubscribe = store.subscribe(onStoreChange);

    store.set("updated");
    expect(store.getSnapshot()).toBe("updated");
    expect(onStoreChange).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
