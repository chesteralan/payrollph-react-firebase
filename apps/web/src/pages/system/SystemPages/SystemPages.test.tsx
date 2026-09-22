import { describe, it, expect } from "vitest";
import * as SystemPages from "./SystemPages";

describe("SystemPages barrel exports", () => {
  it("exports CalendarPage", () => {
    expect(SystemPages.CalendarPage).toBeDefined();
  });

  it("exports TermsPage", () => {
    expect(SystemPages.TermsPage).toBeDefined();
  });

  it("exports UsersPage", () => {
    expect(SystemPages.UsersPage).toBeDefined();
  });

  it("exports RestrictionsPage", () => {
    expect(SystemPages.RestrictionsPage).toBeDefined();
  });

  it("exports AuditPage", () => {
    expect(SystemPages.AuditPage).toBeDefined();
  });

  it("exports DatabasePage", () => {
    expect(SystemPages.DatabasePage).toBeDefined();
  });

  it("exports UserActivityPage", () => {
    expect(SystemPages.UserActivityPage).toBeDefined();
  });

  it("exports DEPARTMENTS constant", () => {
    expect(SystemPages.DEPARTMENTS).toBeDefined();
  });

  it("exports COLLECTIONS constant", () => {
    expect(SystemPages.COLLECTIONS).toBeDefined();
  });
});
