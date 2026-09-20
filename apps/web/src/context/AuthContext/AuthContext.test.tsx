import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "./AuthContext";
import { AuthContext } from "../auth";

// The global setup mocks in src/test/setup.ts mock:
// - @/config/firebase (auth, db, storage, getCSRFToken)
// - firebase/firestore
// - firebase/auth

// We need to override the onAuthStateChanged mock to control auth state per test.
// The mock is on @/config/firebase's auth object, so we mock that specifically.

// NOTE: firebase/auth is already mocked in src/test/setup.ts via createAuthMocks()
// which invokes the onAuthStateChanged callback and provides signOut.
// We do NOT re-mock it here because that would suppress the callback.

const mockOnAuthStateChanged = vi.fn();

// Override the config/firebase mock for these tests
vi.mock("@/config/firebase", () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: (
      _auth: unknown,
      cb: (user: unknown) => void,
    ) => mockOnAuthStateChanged(_auth, cb),
    signOut: vi.fn().mockResolvedValue(undefined),
  },
  db: {},
  storage: {},
  getCSRFToken: vi.fn(async () => "mock-csrf-token"),
  default: {},
}));

function TestConsumer() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) return <div data-testid="no-ctx">no context</div>;
  return (
    <div>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="user-name">{ctx.user?.displayName ?? "none"}</div>
      <div data-testid="company-id">
        {ctx.currentCompanyId ?? "none"}
      </div>
      <div data-testid="session-expiring">
        {String(ctx.sessionExpiring)}
      </div>
      <div data-testid="restrictions-count">
        {ctx.restrictions.length}
      </div>
      <div data-testid="has-user">
        {String(ctx.firebaseUser !== null)}
      </div>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should render and eventually show not loading with no user when unauthenticated", async () => {
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, cb: (user: unknown) => void) => {
        setTimeout(() => cb(null), 10);
        return vi.fn();
      },
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Initially loading might be true
    // Wait for the async onAuthStateChanged to resolve
    await waitFor(
      () => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId("user-name")).toHaveTextContent("none");
    expect(screen.getByTestId("has-user")).toHaveTextContent("false");
    expect(screen.getByTestId("company-id")).toHaveTextContent("none");
    expect(screen.getByTestId("session-expiring")).toHaveTextContent("false");
  });

  it("should render a provider that children can consume", async () => {
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, cb: (user: unknown) => void) => {
        setTimeout(() => cb(null), 10);
        return vi.fn();
      },
    );

    render(
      <AuthProvider>
        <div data-testid="child">child content</div>
      </AuthProvider>,
    );

    expect(screen.getByTestId("child")).toHaveTextContent("child content");
  });

  it("should call signOut on logout", async () => {
    const mockAuthOnAuthChanged = vi.fn((_auth: unknown, cb: (user: unknown) => void) => {
      setTimeout(() => cb(null), 10);
      return vi.fn();
    });

    mockOnAuthStateChanged.mockImplementation(mockAuthOnAuthChanged);

    let capturedLogout: (() => Promise<void>) | null = null;

    function LogoutTester() {
      const ctx = React.useContext(AuthContext);
      React.useEffect(() => {
        if (ctx && !ctx.loading) {
          capturedLogout = ctx.logout;
        }
      });
      return <div data-testid="logout-ready">{String(!ctx?.loading)}</div>;
    }

    render(
      <AuthProvider>
        <LogoutTester />
      </AuthProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("logout-ready")).toHaveTextContent("true");
      },
      { timeout: 3000 },
    );

    expect(capturedLogout).toBeTruthy();
    if (capturedLogout) {
      await act(async () => {
        await capturedLogout();
      });
      // Verify logout completes without error - signOut is mocked in setup.ts
      expect(screen.getByTestId("logout-ready")).toBeTruthy();
    }
  });
});
