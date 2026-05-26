import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---- Mock indexedDB ----
const mockStores: Record<string, Map<string, unknown>> = {};

/** Track the current transaction so we can resolve it after puts */
let currentTransaction: {
  oncomplete: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  objectStore: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
} | null = null;

const createMockObjectStore = (name: string) => {
  if (!mockStores[name]) {
    mockStores[name] = new Map();
  }
  const store = mockStores[name];
  const indexes = new Map<string, Map<string, unknown[]>>();

  return {
    name,
    put: vi.fn((value: unknown) => {
      const record = value as { id: string };
      store.set(record.id, value);
      // Schedule transaction completion via microtask
      return { onsuccess: null, onerror: null };
    }),
    get: vi.fn((id: string) => {
      const result = store.get(id);
      const req = { result: result ?? null, onerror: null, onsuccess: null };
      Promise.resolve().then(() => req.onsuccess?.());
      return req;
    }),
    getAll: vi.fn(() => {
      const result = Array.from(store.values());
      const req = { result, onerror: null, onsuccess: null };
      return req;
    }),
    index: vi.fn((indexName: string) => {
      if (!indexes.has(indexName)) {
        indexes.set(indexName, new Map());
      }
      return {
        name: indexName,
        getAll: vi.fn((query: unknown) => {
          const all = Array.from(store.values()) as Array<
            Record<string, unknown>
          >;
          const result = all.filter(
            (item) => (item as Record<string, unknown>)[indexName] === query,
          );
          const req = { result, onerror: null, onsuccess: null };
          Promise.resolve().then(() => req.onsuccess?.());
          return req;
        }),
        getAllKeys: vi.fn(() => {
          const req = { result: [], onerror: null, onsuccess: null };
          Promise.resolve().then(() => req.onsuccess?.());
          return req;
        }),
      };
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
};

const createMockDB = () => {
  const stores = new Map<string, ReturnType<typeof createMockObjectStore>>();

  const db: IDBDatabase = {
    name: "payroll-offline",
    version: 2,
    objectStoreNames: {
      contains: vi.fn((name: string) => stores.has(name)),
      length: 0,
      item: vi.fn(),
    } as unknown as DOMStringList,
    createObjectStore: vi.fn(
      (_name: string, _options?: IDBObjectStoreParameters) => {
        const store = createMockObjectStore(_name);
        stores.set(_name, store);
        return store as unknown as IDBObjectStore;
      },
    ),
    transaction: vi.fn(
      (_storeName: string | string[], _mode?: IDBTransactionMode) => {
        const tx = {
          objectStore: vi.fn((name: string) => {
            return stores.get(name) || createMockObjectStore(name);
          }),
          oncomplete: null as (() => void) | null,
          onerror: null as ((e: unknown) => void) | null,
          commit: vi.fn(),
          abort: vi.fn(),
        };
        currentTransaction = tx;
        // Schedule transaction completion so cacheDataOffline etc resolve
        Promise.resolve().then(() => {
          // After all current synchronous work, fire oncomplete
          setTimeout(() => tx.oncomplete?.(), 0);
        });
        return tx as unknown as IDBTransaction;
      },
    ),
    close: vi.fn(),
  } as unknown as IDBDatabase;

  return db;
};

let mockDB: IDBDatabase | null = null;
let openRequestHandler: ((event: Event) => void) | null = null;

const mockIndexedDB = {
  open: vi.fn((_name: string, _version?: number) => {
    const db = createMockDB();
    mockDB = db;

    let onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null = null;
    let onsuccess: ((event: Event) => void) | null = null;
    let onerror: ((event: Event) => void) | null = null;

    const request = {
      result: db,
      error: null,
      source: null,
      transaction: null,
      readyState: "done",
      get onupgradeneeded() {
        return onupgradeneeded;
      },
      set onupgradeneeded(fn) {
        onupgradeneeded = fn;
      },
      get onsuccess() {
        return onsuccess;
      },
      set onsuccess(fn) {
        onsuccess = fn;
        // Fire onsuccess immediately after assignment (simulates async open completion)
        if (fn) {
          Promise.resolve().then(() => {
            fn({ target: { result: db } } as unknown as Event);
          });
        }
      },
      get onerror() {
        return onerror;
      },
      set onerror(fn) {
        onerror = fn;
      },
    } as unknown as IDBOpenDBRequest;

    return request;
  }),
  deleteDatabase: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mockStores).forEach((k) => delete mockStores[k]);
  currentTransaction = null;
  openRequestHandler = null;

  (globalThis as Record<string, unknown>).indexedDB = mockIndexedDB;

  Object.defineProperty(navigator, "onLine", {
    writable: true,
    configurable: true,
    value: true,
  });

  Object.defineProperty(navigator, "serviceWorker", {
    writable: true,
    configurable: true,
    value: {
      register: vi
        .fn()
        .mockResolvedValue({ scope: "/" } as ServiceWorkerRegistration),
    },
  });

  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).indexedDB;
});

import {
  cacheDataOffline,
  getOfflineData,
  queueAction,
  syncQueuedActions,
  getQueuedActionCount,
  isOffline,
  setupOfflineListeners,
  registerServiceWorker,
} from "./offline";

describe("cacheDataOffline", () => {
  it("should store data in the offline_data store", async () => {
    const data = [
      { id: "doc1", name: "Alice", department: "Engineering" },
      { id: "doc2", name: "Bob", department: "Sales" },
    ];

    await cacheDataOffline("employees", data);

    const stored = mockStores["offline_data"];
    expect(stored).toBeDefined();
    expect(stored.size).toBe(2);
    expect(stored.has("employees_doc1")).toBe(true);
    expect(stored.has("employees_doc2")).toBe(true);
  });

  it("should handle empty data array", async () => {
    await expect(cacheDataOffline("employees", [])).resolves.toBeUndefined();
  });

  it("should mark stored data with synced flag and collection metadata", async () => {
    await cacheDataOffline("companies", [{ id: "c1", name: "Acme" }]);

    const record = mockStores["offline_data"].get("companies_c1") as Record<
      string,
      unknown
    >;
    expect(record.synced).toBe(true);
    expect(record.collection).toBe("companies");
    expect(record.documentId).toBe("c1");
  });
});

describe("getOfflineData", () => {
  beforeEach(async () => {
    await cacheDataOffline("employees", [
      { id: "e1", name: "Alice" },
      { id: "e2", name: "Bob" },
    ]);
  });

  it("should return all data for a collection when no id is provided", async () => {
    const data = await getOfflineData("employees");
    expect(data).toHaveLength(2);
    const names = data.map((d: Record<string, unknown>) => d.name);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  it("should return data wrapped in .data property (as stored)", async () => {
    const data = await getOfflineData("employees", "e1");
    expect(data).toHaveLength(1);
    expect((data[0] as Record<string, unknown>).name).toBe("Alice");
  });

  it("should return empty array for nonexistent id", async () => {
    const data = await getOfflineData("employees", "nonexistent");
    expect(data).toEqual([]);
  });

  it("should return empty array for nonexistent collection", async () => {
    const data = await getOfflineData("nonexistent");
    expect(data).toEqual([]);
  });
});

describe("queueAction", () => {
  it("should queue a create action", async () => {
    await queueAction({
      type: "create",
      collection: "employees",
      documentId: "e1",
      data: { name: "New Employee" },
    });

    const stored = mockStores["action_queue"];
    expect(stored).toBeDefined();
    expect(stored.size).toBe(1);

    const records = Array.from(stored.values()) as Array<
      Record<string, unknown>
    >;
    expect(records[0].type).toBe("create");
    expect(records[0].collection).toBe("employees");
    expect(records[0].status).toBe("pending");
    expect(records[0].attempts).toBe(0);
    expect(records[0].maxAttempts).toBe(3);
  });

  it("should queue an update action", async () => {
    await queueAction({
      type: "update",
      collection: "companies",
      documentId: "c1",
      data: { name: "Updated" },
    });

    const records = Array.from(mockStores["action_queue"].values()) as Array<
      Record<string, unknown>
    >;
    expect(records[0].type).toBe("update");
  });

  it("should queue a delete action", async () => {
    await queueAction({
      type: "delete",
      collection: "employees",
      documentId: "e1",
    });

    const records = Array.from(mockStores["action_queue"].values()) as Array<
      Record<string, unknown>
    >;
    expect(records[0].type).toBe("delete");
  });
});

describe("syncQueuedActions", () => {
  it("should return zero counts when no actions are queued", async () => {
    const result = await syncQueuedActions();
    expect(result).toEqual({ success: 0, failed: 0 });
  });

  it("should do nothing when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: false,
    });

    await queueAction({
      type: "create",
      collection: "test",
      documentId: "t1",
      data: { value: 1 },
    });

    const result = await syncQueuedActions();
    expect(result).toEqual({ success: 0, failed: 0 });
  });
});

describe("getQueuedActionCount", () => {
  it("should return 0 when no actions are queued", async () => {
    const count = await getQueuedActionCount();
    expect(count).toBe(0);
  });

  it("should return the correct count of pending actions", async () => {
    await queueAction({
      type: "create",
      collection: "test",
      documentId: "1",
      data: { value: 1 },
    });
    await queueAction({
      type: "update",
      collection: "test",
      documentId: "2",
      data: { value: 2 },
    });

    const count = await getQueuedActionCount();
    expect(count).toBe(2);
  });
});

describe("isOffline", () => {
  it("should return false when navigator.onLine is true", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });
    expect(isOffline()).toBe(false);
  });

  it("should return true when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: false,
    });
    expect(isOffline()).toBe(true);
  });
});

describe("setupOfflineListeners", () => {
  it("should register offline and online event listeners", () => {
    const onOffline = vi.fn();
    const onOnline = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    setupOfflineListeners(onOffline, onOnline);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
  });

  it("should call onOffline when offline event fires", () => {
    const onOffline = vi.fn();
    const onOnline = vi.fn();

    const handlers: Record<string, () => void> = {};
    vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        handlers[event] = handler as () => void;
        return undefined as unknown as void;
      },
    );

    setupOfflineListeners(onOffline, onOnline);

    handlers.offline();

    expect(onOffline).toHaveBeenCalledOnce();
  });

  it("should call onOnline when online event fires", () => {
    const onOffline = vi.fn();
    const onOnline = vi.fn();

    const handlers: Record<string, () => void> = {};
    vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        handlers[event] = handler as () => void;
        return undefined as unknown as void;
      },
    );

    setupOfflineListeners(onOffline, onOnline);

    handlers.online();

    expect(onOnline).toHaveBeenCalledOnce();
  });

  it("should return cleanup function that removes event listeners", () => {
    const onOffline = vi.fn();
    const onOnline = vi.fn();

    const addSpy = vi.spyOn(window, "addEventListener").mockRestore
      ? vi.spyOn(window, "addEventListener")
      : vi.fn();
    const removeSpy = vi.spyOn(window, "removeEventListener").mockRestore
      ? vi.spyOn(window, "removeEventListener")
      : vi.fn();

    // Re-setup spies with mockRestore-safe approach
    const addSpy2 = vi.spyOn(window, "addEventListener");
    const removeSpy2 = vi.spyOn(window, "removeEventListener");

    const cleanup = setupOfflineListeners(onOffline, onOnline);
    cleanup();

    expect(removeSpy2).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(removeSpy2).toHaveBeenCalledWith("online", expect.any(Function));
  });
});

describe("registerServiceWorker", () => {
  it("should register the service worker when supported", async () => {
    const registration = await registerServiceWorker();
    expect(registration).toEqual({ scope: "/" });
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      "/service-worker.js",
    );
  });

  it("should return null when service worker is not supported", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const registration = await registerServiceWorker();
    expect(registration).toBeNull();
  });

  it("should return null when registration fails", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn().mockRejectedValue(new Error("Registration failed")),
      },
    });

    const registration = await registerServiceWorker();
    expect(registration).toBeNull();
  });
});
