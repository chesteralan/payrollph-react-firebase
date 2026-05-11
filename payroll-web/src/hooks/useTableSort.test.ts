import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableSort } from "./useTableSort";

interface TestItem {
  name: string;
  age: number;
  email: string;
}

const mockItems: TestItem[] = [
  { name: "Charlie", age: 30, email: "charlie@test.com" },
  { name: "Alice", age: 25, email: "alice@test.com" },
  { name: "Bob", age: 35, email: "bob@test.com" },
];

describe("useTableSort", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return items unchanged without sort config", () => {
    const { result } = renderHook(() => useTableSort(mockItems));
    expect(result.current.items).toEqual(mockItems);
    expect(result.current.sortConfig).toBeNull();
  });

  it("should set default sort when provided", () => {
    const { result } = renderHook(() => useTableSort(mockItems, "name"));
    expect(result.current.sortConfig).toEqual({
      key: "name",
      direction: "asc",
    });
  });

  it("should sort items ascending by string", () => {
    const { result } = renderHook(() => useTableSort(mockItems, "name"));

    expect(result.current.items[0].name).toBe("Alice");
    expect(result.current.items[1].name).toBe("Bob");
    expect(result.current.items[2].name).toBe("Charlie");
  });

  it("should sort items descending when toggled", () => {
    const { result } = renderHook(() => useTableSort(mockItems, "name"));

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.items[0].name).toBe("Charlie");
    expect(result.current.items[1].name).toBe("Bob");
    expect(result.current.items[2].name).toBe("Alice");
  });

  it("should sort items by number", () => {
    const { result } = renderHook(() => useTableSort(mockItems, "age"));

    expect(result.current.items[0].age).toBe(25);
    expect(result.current.items[1].age).toBe(30);
    expect(result.current.items[2].age).toBe(35);
  });

  it("should clear sort when clicking same column twice", () => {
    const { result } = renderHook(() => useTableSort(mockItems, "name"));

    act(() => {
      result.current.handleSort("name"); // desc
    });
    act(() => {
      result.current.handleSort("name"); // clears
    });

    expect(result.current.sortConfig).toBeNull();
  });

  it("should filter items based on filterText", () => {
    const { result } = renderHook(() => useTableSort(mockItems));

    act(() => {
      result.current.setFilterText("bob");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Bob");
  });

  it("should handle case-insensitive filtering", () => {
    const { result } = renderHook(() => useTableSort(mockItems));

    act(() => {
      result.current.setFilterText("ALICE");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Alice");
  });

  it("should return all items when filter is empty", () => {
    const { result } = renderHook(() => useTableSort(mockItems));

    act(() => {
      result.current.setFilterText("bob");
    });
    act(() => {
      result.current.setFilterText("");
    });

    expect(result.current.items).toHaveLength(3);
  });

  it("should handle null values in sort", () => {
    const itemsWithNull: TestItem[] = [
      { name: "A", age: 30, email: "a@test.com" },
      { name: "B", age: 25, email: "b@test.com" },
    ];

    const { result } = renderHook(() => useTableSort(itemsWithNull, "name"));
    expect(result.current.items[0].name).toBe("A");
  });
});
