import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import {
  createFirestoreMocks,
  createAuthMocks,
  createStorageMocks,
  clearMockDocs,
} from "../__mocks__/firebase";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  clearMockDocs();
});

vi.mock("../config/firebase", () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((_auth, cb) => {
      cb(null);
      return () => {};
    }),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
  getCSRFToken: vi.fn(async () => "mock-csrf-token"),
  default: {},
}));

vi.mock("firebase/firestore", () => createFirestoreMocks());

vi.mock("firebase/auth", () => createAuthMocks());

vi.mock("firebase/storage", () => createStorageMocks());

vi.mock("lucide-react", () => import("../__mocks__/lucide-react"));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];
  constructor() {
    // Mock — no real observer needed
  }
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}
global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

class MockResizeObserver implements ResizeObserver {
  constructor() {
    // Mock — no real observer needed
  }
  disconnect() {}
  observe() {}
  unobserve() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
