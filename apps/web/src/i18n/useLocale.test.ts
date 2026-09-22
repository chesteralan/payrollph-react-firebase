import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Set up mocks before vi.mock (vi.hoisted ensures they're available at hoist time)
const { mockLoadMessages, mockT, mockSetHtmlLang } = vi.hoisted(() => ({
  mockLoadMessages: vi.fn(),
  mockT: vi.fn(),
  mockSetHtmlLang: vi.fn(),
}));

vi.mock("./index", () => ({
  loadMessages: mockLoadMessages,
  t: mockT,
  setHtmlLang: mockSetHtmlLang,
}));

import { useLocale } from "./useLocale";

const defaultMockMessages = {
  common: {},
  nav: {},
  settings: {},
  offline: {},
  pagination: {},
};

describe("useLocale", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Provide a default resolved promise so the useEffect doesn't crash
    mockLoadMessages.mockResolvedValue(defaultMockMessages);
  });

  it("returns default locale 'en-US' when no stored locale", async () => {
    const { result } = renderHook(() => useLocale());
    // Wait for the passive effect to settle to avoid act() warning
    await waitFor(() => {
      expect(result.current.messages).not.toBeNull();
    });
    expect(result.current.locale).toBe("en-US");
  });

  it("loads messages on mount via loadMessages", async () => {
    const customMessages = {
      common: { greeting: "Hello" },
      nav: {},
      settings: {},
      offline: {},
      pagination: {},
    };
    mockLoadMessages.mockResolvedValue(customMessages);

    const { result } = renderHook(() => useLocale());

    await waitFor(() => {
      expect(mockLoadMessages).toHaveBeenCalledWith("en-US");
      expect(result.current.messages).toEqual(customMessages);
    });

    expect(mockSetHtmlLang).toHaveBeenCalledWith("en-US");
  });

  it("setLocale updates locale and persists to localStorage", async () => {
    const { result } = renderHook(() => useLocale());

    // Wait for initial messages to load
    await waitFor(() => {
      expect(result.current.messages).not.toBeNull();
    });

    await act(async () => {
      result.current.setLocale("fil-PH");
    });

    expect(result.current.locale).toBe("fil-PH");
    expect(localStorage.getItem("payroll-locale")).toBe("fil-PH");

    // loadMessages should be called again with the new locale
    await waitFor(() => {
      expect(mockLoadMessages).toHaveBeenCalledWith("fil-PH");
    });
  });

  it("t function returns key when messages is null (before load)", () => {
    // Temporarily make loadMessages return a pending promise so messages stay null
    mockLoadMessages.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useLocale());
    // Before loadMessages resolves, messages is null, so t returns the key directly
    expect(result.current.t("some.key")).toBe("some.key");
  });

  it("t function translates when messages are loaded", async () => {
    const mockMessages = {
      common: { save: "Save" },
      nav: {},
      settings: {},
      offline: {},
      pagination: {},
    };
    mockLoadMessages.mockResolvedValue(mockMessages);
    mockT.mockReturnValue("translated-value");

    const { result } = renderHook(() => useLocale());

    await waitFor(() => {
      expect(result.current.messages).not.toBeNull();
    });

    const translated = result.current.t("common.save");
    expect(translated).toBe("translated-value");
    expect(mockT).toHaveBeenCalledWith(mockMessages, "common.save", undefined);
  });

  it("handles localStorage errors gracefully", async () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage error");
      });

    const { result } = renderHook(() => useLocale());

    // Wait for the async effect to settle
    await waitFor(() => {
      expect(result.current.messages).not.toBeNull();
    });

    expect(result.current.locale).toBe("en-US");

    getItemSpy.mockRestore();
  });
});
