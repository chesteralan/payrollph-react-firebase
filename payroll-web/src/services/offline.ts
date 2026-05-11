import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";

interface QueuedAction {
  id: string;
  type: "create" | "update" | "delete";
  collection: string;
  documentId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "syncing" | "failed" | "completed";
  error?: string;
}

const DB_NAME = "payroll-offline";
const DB_VERSION = 2;
let dbInstance: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains("offline_data")) {
        const store = database.createObjectStore("offline_data", {
          keyPath: "id",
        });
        store.createIndex("collection", "collection", { unique: false });
      }

      if (!database.objectStoreNames.contains("action_queue")) {
        const store = database.createObjectStore("action_queue", {
          keyPath: "id",
        });
        store.createIndex("status", "status", { unique: false });
      }

      if (event.oldVersion < 2) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        if (database.objectStoreNames.contains("offline_data")) {
          const store = transaction.objectStore("offline_data");
          if (!store.indexNames.contains("collection")) {
            store.createIndex("collection", "collection", { unique: false });
          }
        }
        if (database.objectStoreNames.contains("action_queue")) {
          const store = transaction.objectStore("action_queue");
          if (!store.indexNames.contains("status")) {
            store.createIndex("status", "status", { unique: false });
          }
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
};

// Save data to IndexedDB for offline use
export const cacheDataOffline = async (
  collectionName: string,
  data: Array<{ id: string } & Record<string, unknown>>,
): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction("offline_data", "readwrite");
  const store = transaction.objectStore("offline_data");

  data.forEach((item) => {
    store.put({
      id: `${collectionName}_${item.id}`,
      collection: collectionName,
      documentId: item.id,
      data: item,
      timestamp: Date.now(),
      synced: true,
    });
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Get offline data
export const getOfflineData = async (
  collectionName: string,
  id?: string,
): Promise<Record<string, unknown>[]> => {
  const database = await initDB();
  const transaction = database.transaction("offline_data", "readonly");
  const store = transaction.objectStore("offline_data");

  return new Promise((resolve, reject) => {
    const request = id
      ? store.get(`${collectionName}_${id}`)
      : store.index("collection").getAll(collectionName);

    request.onsuccess = () => {
      const result = request.result;
      if (Array.isArray(result)) {
        resolve(result.map((r) => r.data));
      } else {
        resolve(result ? [result.data] : []);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// Queue action for later sync
export const queueAction = async (
  action: Omit<QueuedAction, "id" | "timestamp" | "attempts" | "status">,
): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction("action_queue", "readwrite");
  const store = transaction.objectStore("action_queue");

  const queuedAction: QueuedAction = {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...action,
    timestamp: Date.now(),
    attempts: 0,
    maxAttempts: 3,
    status: "pending",
  };

  store.put(queuedAction);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      // Try to sync if online
      if (navigator.onLine) {
        syncQueuedActions();
      }
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

// Sync queued actions when back online
export const syncQueuedActions = async (): Promise<{
  success: number;
  failed: number;
}> => {
  if (!navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  const database = await initDB();
  const transaction = database.transaction("action_queue", "readonly");
  const store = transaction.objectStore("action_queue");
  const request = store.index("status").getAll("pending");

  return new Promise((resolve) => {
    request.onsuccess = async () => {
      const actions: QueuedAction[] = request.result || [];
      let success = 0;
      let failed = 0;

      for (const action of actions) {
        try {
          await processQueuedAction(action);
          await updateQueuedActionStatus(action.id, "completed");
          success++;
        } catch (error) {
          const newAttempts = action.attempts + 1;
          if (newAttempts >= action.maxAttempts) {
            await updateQueuedActionStatus(
              action.id,
              "failed",
              (error as Error).message,
            );
          } else {
            await updateQueuedActionStatus(
              action.id,
              "pending",
              (error as Error).message,
              newAttempts,
            );
          }
          failed++;
        }
      }

      resolve({ success, failed });
    };
    request.onerror = () => resolve({ success: 0, failed: 0 });
  });
};

const processQueuedAction = async (action: QueuedAction): Promise<void> => {
  const { type, collection: collectionName, documentId, data } = action;

  switch (type) {
    case "create":
      await setDoc(doc(db, collectionName, documentId!), data!);
      break;
    case "update":
      await updateDoc(doc(db, collectionName, documentId!), data!);
      break;
    case "delete":
      await deleteDoc(doc(db, collectionName, documentId!));
      break;
  }
};

const updateQueuedActionStatus = async (
  id: string,
  status: QueuedAction["status"],
  error?: string,
  attempts?: number,
): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction("action_queue", "readwrite");
  const store = transaction.objectStore("action_queue");
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const action = request.result;
      if (action) {
        action.status = status;
        if (error) action.error = error;
        if (attempts !== undefined) action.attempts = attempts;
        store.put(action);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
};

export const getQueuedActionCount = async (): Promise<number> => {
  const database = await initDB();
  const transaction = database.transaction("action_queue", "readonly");
  const store = transaction.objectStore("action_queue");
  const request = store.index("status").getAll("pending");

  return new Promise((resolve) => {
    request.onsuccess = () => resolve((request.result || []).length);
    request.onerror = () => resolve(0);
  });
};

export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// Listen for online/offline events
export const setupOfflineListeners = (
  onOffline: () => void,
  onOnline: () => void,
): (() => void) => {
  const handleOffline = () => {
    console.log("App went offline");
    onOffline();
  };

  const handleOnline = () => {
    console.log("App is back online");
    onOnline();
    syncQueuedActions();
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
};

// Register service worker for caching
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return null;
    }

    try {
      const registration =
        await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  };

// Create basic service worker content
export const SERVICE_WORKER_CODE = `
const CACHE_NAME = 'payroll-v2-cache-v1'
const urls_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urls_TO_CACHE))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache))
          return response
        })
      })
  )
})

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    )
})
`;

// Save service worker file
export const saveServiceWorker = (): void => {
  const blob = new Blob([SERVICE_WORKER_CODE], {
    type: "application/javascript",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "service-worker.js";
  a.click();
  URL.revokeObjectURL(url);
};
