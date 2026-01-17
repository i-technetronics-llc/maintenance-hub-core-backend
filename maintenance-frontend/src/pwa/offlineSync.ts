import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'cmms-offline-db';
const DB_VERSION = 1;

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
}

interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

let db: IDBPDatabase | null = null;

export const initOfflineDB = async () => {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Store for pending sync requests
      if (!database.objectStoreNames.contains('pendingRequests')) {
        database.createObjectStore('pendingRequests', { keyPath: 'id' });
      }

      // Store for cached API data
      if (!database.objectStoreNames.contains('cachedData')) {
        const store = database.createObjectStore('cachedData', { keyPath: 'key' });
        store.createIndex('expiresAt', 'expiresAt');
      }

      // Store for offline work orders
      if (!database.objectStoreNames.contains('offlineWorkOrders')) {
        database.createObjectStore('offlineWorkOrders', { keyPath: 'id' });
      }

      // Store for offline assets
      if (!database.objectStoreNames.contains('offlineAssets')) {
        database.createObjectStore('offlineAssets', { keyPath: 'id' });
      }
    },
  });

  return db;
};

export const addPendingRequest = async (request: Omit<PendingRequest, 'id' | 'timestamp'>) => {
  const database = await initOfflineDB();
  const pendingRequest: PendingRequest = {
    ...request,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await database.add('pendingRequests', pendingRequest);
  return pendingRequest;
};

export const getPendingRequests = async (): Promise<PendingRequest[]> => {
  const database = await initOfflineDB();
  return database.getAll('pendingRequests');
};

export const removePendingRequest = async (id: string) => {
  const database = await initOfflineDB();
  await database.delete('pendingRequests', id);
};

export const syncPendingRequests = async () => {
  if (!navigator.onLine) return { success: 0, failed: 0 };

  const pendingRequests = await getPendingRequests();
  let success = 0;
  let failed = 0;

  for (const request of pendingRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: request.body,
      });

      if (response.ok) {
        await removePendingRequest(request.id);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success, failed };
};

export const cacheData = async (key: string, data: unknown, ttlMinutes: number = 60) => {
  const database = await initOfflineDB();
  const cachedItem: CachedData = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };
  await database.put('cachedData', cachedItem);
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  const database = await initOfflineDB();
  const cached = await database.get('cachedData', key) as CachedData | undefined;

  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    await database.delete('cachedData', key);
    return null;
  }

  return cached.data as T;
};

export const clearExpiredCache = async () => {
  const database = await initOfflineDB();
  const tx = database.transaction('cachedData', 'readwrite');
  const store = tx.objectStore('cachedData');
  const index = store.index('expiresAt');

  let cursor = await index.openCursor(IDBKeyRange.upperBound(Date.now()));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
};

// Offline work order operations
export const saveOfflineWorkOrder = async (workOrder: unknown) => {
  const database = await initOfflineDB();
  await database.put('offlineWorkOrders', workOrder);
};

export const getOfflineWorkOrders = async () => {
  const database = await initOfflineDB();
  return database.getAll('offlineWorkOrders');
};

// Offline asset operations
export const saveOfflineAsset = async (asset: unknown) => {
  const database = await initOfflineDB();
  await database.put('offlineAssets', asset);
};

export const getOfflineAssets = async () => {
  const database = await initOfflineDB();
  return database.getAll('offlineAssets');
};

// Online status listener
export const setupOnlineListener = (onOnline: () => void, onOffline: () => void) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
