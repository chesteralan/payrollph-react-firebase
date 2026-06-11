import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadMessages,
  interpolate,
  t,
  setHtmlLang,
} from "./index";
import type { LocaleMessages } from "./index";

describe("i18n", () => {
  describe("interpolate", () => {
    it("should replace placeholders with values", () => {
      const result = interpolate("Hello {name}", { name: "World" });
      expect(result).toBe("Hello World");
    });

    it("should replace multiple placeholders", () => {
      const result = interpolate("{a} + {b} = {c}", {
        a: "1",
        b: "2",
        c: "3",
      });
      expect(result).toBe("1 + 2 = 3");
    });

    it("should keep placeholder when value not provided", () => {
      const result = interpolate("Hello {name}", {});
      expect(result).toBe("Hello {name}");
    });

    it("should handle numeric values", () => {
      const result = interpolate("Page {page}", { page: 5 });
      expect(result).toBe("Page 5");
    });

    it("should return unchanged string when no placeholders", () => {
      const result = interpolate("No placeholders", { key: "value" });
      expect(result).toBe("No placeholders");
    });
  });

  describe("t", () => {
    const messages: LocaleMessages = {
      common: {
        save: "Save",
        loading: "Loading...",
      },
      nav: {
        dashboard: "Dashboard",
      },
      settings: {},
      offline: {},
      pagination: {
        showing: "Showing {from} to {to} of {total} results",
      },
    };

    it("should return translated string for simple key", () => {
      expect(t(messages, "common.save")).toBe("Save");
    });

    it("should return translated string for nested key", () => {
      expect(t(messages, "nav.dashboard")).toBe("Dashboard");
    });

    it("should interpolate values in translated string", () => {
      expect(
        t(messages, "pagination.showing", {
          from: 1,
          to: 10,
          total: 100,
        }),
      ).toBe("Showing 1 to 10 of 100 results");
    });

    it("should return the key when translation is not found", () => {
      expect(t(messages, "common.nonexistent")).toBe("common.nonexistent");
    });

    it("should return the key when the top-level section is missing", () => {
      expect(t(messages, "missing.key")).toBe("missing.key");
    });

    it("should return the key when value is not a string", () => {
      const badMessages = {
        common: { items: [] as string[] },
        nav: {},
        settings: {},
        offline: {},
        pagination: {},
      };
      expect(t(badMessages, "common.items")).toBe("common.items");
    });

    it("should return the key for empty messages", () => {
      const empty = {
        common: {},
        nav: {},
        settings: {},
        offline: {},
        pagination: {},
      };
      expect(t(empty, "common.save")).toBe("common.save");
    });
  });

  describe("setHtmlLang", () => {
    beforeEach(() => {
      document.documentElement.lang = "";
    });

    it("should set the html lang attribute", () => {
      setHtmlLang("en-US");
      expect(document.documentElement.lang).toBe("en-US");
    });

    it("should set to Filipino locale", () => {
      setHtmlLang("fil-PH");
      expect(document.documentElement.lang).toBe("fil-PH");
    });

    it("should override previous lang value", () => {
      setHtmlLang("en-US");
      setHtmlLang("fil-PH");
      expect(document.documentElement.lang).toBe("fil-PH");
    });
  });

  describe("loadMessages", () => {
    it("should load English messages for en-US", async () => {
      const msgs = await loadMessages("en-US");
      expect(msgs.common.save).toBe("Save");
      expect(msgs.common.loading).toBe("Loading...");
      expect(msgs.nav.dashboard).toBe("Dashboard");
    });

    it("should load English messages for en-PH", async () => {
      const msgs = await loadMessages("en-PH");
      expect(msgs.common.save).toBe("Save");
    });

    it("should load Filipino messages for fil-PH", async () => {
      const msgs = await loadMessages("fil-PH");
      expect(msgs.common.save).toBe("I-save");
    });

    it("should fallback to en-US for unknown locale", async () => {
      const msgs = await loadMessages("en-US" as any);
      expect(msgs.common.save).toBe("Save");
    });
  });
});
