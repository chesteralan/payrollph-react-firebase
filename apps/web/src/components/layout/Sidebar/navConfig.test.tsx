import { describe, it, expect } from "vitest";
import { navigation } from "./navConfig";

describe("navConfig", () => {
  it("exports a navigation array", () => {
    expect(Array.isArray(navigation)).toBe(true);
    expect(navigation.length).toBeGreaterThan(0);
  });

  it("has Dashboard as the first item", () => {
    expect(navigation[0].label).toBe("Dashboard");
    expect(navigation[0].path).toBe("/");
  });

  it("has Employees section with children", () => {
    const employees = navigation.find((n) => n.label === "Employees");
    expect(employees).toBeDefined();
    expect(employees!.children).toBeDefined();
    expect(employees!.children!.length).toBeGreaterThan(0);
  });

  it("has Lists section with children", () => {
    const lists = navigation.find((n) => n.label === "Lists");
    expect(lists).toBeDefined();
    expect(lists!.children).toBeDefined();
  });

  it("has Payroll section with children", () => {
    const payroll = navigation.find((n) => n.label === "Payroll");
    expect(payroll).toBeDefined();
    expect(payroll!.children).toBeDefined();
  });

  it("has Reports section with children", () => {
    const reports = navigation.find((n) => n.label === "Reports");
    expect(reports).toBeDefined();
    expect(reports!.children).toBeDefined();
  });

  it("has System section with children", () => {
    const system = navigation.find((n) => n.label === "System");
    expect(system).toBeDefined();
    expect(system!.children).toBeDefined();
  });

  it("each nav item has required fields", () => {
    navigation.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it("child items have paths", () => {
    navigation.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          expect(child.path).toBeDefined();
        });
      }
    });
  });
});
