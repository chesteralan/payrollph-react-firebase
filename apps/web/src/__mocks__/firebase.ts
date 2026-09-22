import { vi } from "vitest";

type MockDoc = Record<string, unknown> & { id: string };

type MockCollection = {
  docs: MockDoc[];
  size: number;
};

const mockDocs = new Map<string, MockDoc[]>();

export function addMockDocs(collectionPath: string, docs: MockDoc[]) {
  mockDocs.set(collectionPath, docs);
}

export function clearMockDocs() {
  mockDocs.clear();
}

export function getMockDocs(collectionPath: string): MockDoc[] {
  return mockDocs.get(collectionPath) ?? [];
}

export function createMockCollection(collectionPath: string): MockCollection {
  const docs = getMockDocs(collectionPath);
  return { docs, size: docs.length };
}

export const mockDoc = (data: MockDoc) => ({
  id: data.id,
  exists: (): boolean => true,
  data: (): Record<string, unknown> => data,
  get: (field: string): unknown => data[field],
});

export const mockSnapshot = (collectionPath: string) => {
  const docs = getMockDocs(collectionPath);
  return {
    docs: docs.map((d) => mockDoc(d)),
    size: docs.length,
    empty: docs.length === 0,
    forEach: (cb: (doc: ReturnType<typeof mockDoc>) => void) =>
      docs.forEach((d) => cb(mockDoc(d))),
  };
};

export const createFirestoreMocks = () => {
  const collection = vi.fn((_db: unknown, path: string) => path);
  const doc = vi.fn((_db: unknown, path: string, ...pathSegments: string[]) =>
    [path, ...pathSegments].join("/"),
  );
  const getDoc = vi.fn(async (docPath: string) => {
    const doc = mockDocs.get(docPath)?.[0];
    return doc
      ? mockDoc(doc)
      : { exists: (): boolean => false, data: (): null => null, id: docPath };
  });
  const getDocs = vi.fn(async (collectionPath: string) => {
    return mockSnapshot(collectionPath);
  });
  const addDoc = vi.fn(async (_collectionPath: string, data: unknown) => ({
    id: "mock-id",
    ...(data as Record<string, unknown>),
  }));
  const updateDoc = vi.fn(async () => {});
  const deleteDoc = vi.fn(async () => {});
  const query = vi.fn((collectionPath: string) => collectionPath);
  const where = vi.fn(() => "where-clause");
  const orderBy = vi.fn(() => "order-clause");
  const limit = vi.fn((n: number) => n);
  const serverTimestamp = vi.fn(() => new Date());

  return {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
  };
};

export const createAuthMocks = () => {
  const currentUser = null;
  const onAuthStateChanged = vi.fn(
    (_auth: unknown, cb: (user: unknown) => void) => {
      cb(null);
      return () => {};
    },
  );
  const signInWithEmailAndPassword = vi.fn();
  const signOut = vi.fn(async () => {});
  const sendPasswordResetEmail = vi.fn();
  const updatePassword = vi.fn();
  const EmailAuthProvider = {
    credential: vi.fn((email: string) => email),
  };
  const reauthenticateWithCredential = vi.fn();
  const setPersistence = vi.fn();
  const browserSessionPersistence = "session";
  const browserLocalPersistence = "local";

  return {
    currentUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
  };
};

export const createStorageMocks = () => {
  const ref = vi.fn((_storage: unknown, path?: string) => path ?? "root");
  const listAll = vi.fn(async () => ({ items: [], prefixes: [] }));
  const getMetadata = vi.fn(async () => ({ size: 0 }));
  const getDownloadURL = vi.fn(async () => "https://mock-url");
  const uploadBytes = vi.fn(async () => ({ ref: {}, metadata: {} }));
  const deleteObject = vi.fn(async () => {});

  return {
    ref,
    listAll,
    getMetadata,
    getDownloadURL,
    uploadBytes,
    deleteObject,
  };
};
