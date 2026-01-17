/**
 * Offline Storage Service using IndexedDB
 *
 * This service provides robust offline data storage for:
 * - Work orders
 * - Assets
 * - Inventory items
 * - PM schedules
 * - Pending changes (creates, updates)
 *
 * Features:
 * - Conflict resolution with server-wins or client-wins strategies
 * - Version tracking for optimistic locking
 * - TTL-based cache expiration
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============= DATABASE SCHEMA =============

const DB_NAME = 'cmms-offline-storage';
const DB_VERSION = 2;

export type EntityType = 'workOrder' | 'asset' | 'inventory' | 'pmSchedule';
export type ChangeType = 'create' | 'update' | 'delete';
export type ConflictStrategy = 'server-wins' | 'client-wins' | 'manual';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface PendingChange {
  id: string;
  entityType: EntityType;
  entityId: string;
  changeType: ChangeType;
  data: Record<string, unknown>;
  previousData?: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: SyncStatus;
  version?: number;
}

export interface CachedEntity<T = unknown> {
  id: string;
  entityType: EntityType;
  data: T;
  version: number;
  cachedAt: number;
  expiresAt: number;
  serverUpdatedAt?: string;
  isOfflineCreated: boolean;
}

export interface ConflictRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

export interface SyncMetadata {
  key: string;
  lastSyncTime: number;
  syncInProgress: boolean;
  lastError?: string;
}

interface OfflineDBSchema extends DBSchema {
  pendingChanges: {
    key: string;
    value: PendingChange;
    indexes: {
      'by-entity': [EntityType, string];
      'by-status': SyncStatus;
      'by-timestamp': number;
    };
  };
  workOrders: {
    key: string;
    value: CachedEntity;
    indexes: {
      'by-expires': number;
      'by-cached': number;
    };
  };
  assets: {
    key: string;
    value: CachedEntity;
    indexes: {
      'by-expires': number;
      'by-cached': number;
    };
  };
  inventory: {
    key: string;
    value: CachedEntity;
    indexes: {
      'by-expires': number;
      'by-cached': number;
    };
  };
  pmSchedules: {
    key: string;
    value: CachedEntity;
    indexes: {
      'by-expires': number;
      'by-cached': number;
    };
  };
  conflicts: {
    key: string;
    value: ConflictRecord;
    indexes: {
      'by-entity': [EntityType, string];
      'by-resolved': number;
    };
  };
  syncMetadata: {
    key: string;
    value: SyncMetadata;
  };
}

// ============= DATABASE INITIALIZATION =============

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export const initOfflineStorage = async (): Promise<IDBPDatabase<OfflineDBSchema>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`[OfflineStorage] Upgrading database from v${oldVersion} to v${newVersion}`);

      // Pending changes store
      if (!db.objectStoreNames.contains('pendingChanges')) {
        const pendingStore = db.createObjectStore('pendingChanges', { keyPath: 'id' });
        pendingStore.createIndex('by-entity', ['entityType', 'entityId']);
        pendingStore.createIndex('by-status', 'status');
        pendingStore.createIndex('by-timestamp', 'timestamp');
      }

      // Work orders store
      if (!db.objectStoreNames.contains('workOrders')) {
        const woStore = db.createObjectStore('workOrders', { keyPath: 'id' });
        woStore.createIndex('by-expires', 'expiresAt');
        woStore.createIndex('by-cached', 'cachedAt');
      }

      // Assets store
      if (!db.objectStoreNames.contains('assets')) {
        const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
        assetStore.createIndex('by-expires', 'expiresAt');
        assetStore.createIndex('by-cached', 'cachedAt');
      }

      // Inventory store
      if (!db.objectStoreNames.contains('inventory')) {
        const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
        invStore.createIndex('by-expires', 'expiresAt');
        invStore.createIndex('by-cached', 'cachedAt');
      }

      // PM schedules store
      if (!db.objectStoreNames.contains('pmSchedules')) {
        const pmStore = db.createObjectStore('pmSchedules', { keyPath: 'id' });
        pmStore.createIndex('by-expires', 'expiresAt');
        pmStore.createIndex('by-cached', 'cachedAt');
      }

      // Conflicts store
      if (!db.objectStoreNames.contains('conflicts')) {
        const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
        conflictStore.createIndex('by-entity', ['entityType', 'entityId']);
        conflictStore.createIndex('by-resolved', 'resolved');
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    },
    blocked() {
      console.warn('[OfflineStorage] Database blocked - close other tabs');
    },
    blocking() {
      console.warn('[OfflineStorage] Database blocking other connections');
    },
  });

  return dbInstance;
};

export const getDB = async (): Promise<IDBPDatabase<OfflineDBSchema>> => {
  if (!dbInstance) {
    return initOfflineStorage();
  }
  return dbInstance;
};

// ============= ENTITY STORE OPERATIONS =============

const STORE_MAP: Record<EntityType, 'workOrders' | 'assets' | 'inventory' | 'pmSchedules'> = {
  workOrder: 'workOrders',
  asset: 'assets',
  inventory: 'inventory',
  pmSchedule: 'pmSchedules',
};

const DEFAULT_TTL_MINUTES: Record<EntityType, number> = {
  workOrder: 60,     // 1 hour
  asset: 120,        // 2 hours
  inventory: 30,     // 30 minutes
  pmSchedule: 120,   // 2 hours
};

/**
 * Cache an entity locally
 */
export const cacheEntity = async <T extends { id: string; updatedAt?: string }>(
  entityType: EntityType,
  entity: T,
  ttlMinutes?: number,
  isOfflineCreated = false
): Promise<void> => {
  const db = await getDB();
  const storeName = STORE_MAP[entityType];
  const ttl = ttlMinutes ?? DEFAULT_TTL_MINUTES[entityType];

  const cachedEntity: CachedEntity<T> = {
    id: entity.id,
    entityType,
    data: entity,
    version: Date.now(),
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttl * 60 * 1000,
    serverUpdatedAt: entity.updatedAt,
    isOfflineCreated,
  };

  await db.put(storeName, cachedEntity as CachedEntity);
};

/**
 * Cache multiple entities at once
 */
export const cacheEntities = async <T extends { id: string; updatedAt?: string }>(
  entityType: EntityType,
  entities: T[],
  ttlMinutes?: number
): Promise<void> => {
  const db = await getDB();
  const storeName = STORE_MAP[entityType];
  const ttl = ttlMinutes ?? DEFAULT_TTL_MINUTES[entityType];
  const now = Date.now();

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  await Promise.all(
    entities.map((entity) => {
      const cachedEntity: CachedEntity<T> = {
        id: entity.id,
        entityType,
        data: entity,
        version: now,
        cachedAt: now,
        expiresAt: now + ttl * 60 * 1000,
        serverUpdatedAt: entity.updatedAt,
        isOfflineCreated: false,
      };
      return store.put(cachedEntity as CachedEntity);
    })
  );

  await tx.done;
};

/**
 * Get a cached entity by ID
 */
export const getCachedEntity = async <T>(
  entityType: EntityType,
  id: string,
  includeExpired = false
): Promise<T | null> => {
  const db = await getDB();
  const storeName = STORE_MAP[entityType];
  const cached = await db.get(storeName, id);

  if (!cached) return null;

  // Check expiration
  if (!includeExpired && cached.expiresAt < Date.now()) {
    // Entity expired, delete it
    await db.delete(storeName, id);
    return null;
  }

  return cached.data as T;
};

/**
 * Get all cached entities of a type
 */
export const getAllCachedEntities = async <T>(
  entityType: EntityType,
  includeExpired = false
): Promise<T[]> => {
  const db = await getDB();
  const storeName = STORE_MAP[entityType];
  const all = await db.getAll(storeName);
  const now = Date.now();

  const validEntities = all.filter((entity) => {
    if (includeExpired) return true;
    return entity.expiresAt > now;
  });

  return validEntities.map((entity) => entity.data as T);
};

/**
 * Delete a cached entity
 */
export const deleteCachedEntity = async (
  entityType: EntityType,
  id: string
): Promise<void> => {
  const db = await getDB();
  const storeName = STORE_MAP[entityType];
  await db.delete(storeName, id);
};

/**
 * Clear all cached entities of a type
 */
export const clearEntityCache = async (entityType: EntityType): Promise<void> => {
  const db = await getDB();
  const storeName = STORE_MAP[entityType];
  await db.clear(storeName);
};

/**
 * Clear expired entities from all stores
 */
export const clearExpiredEntities = async (): Promise<number> => {
  const db = await getDB();
  const now = Date.now();
  let deletedCount = 0;

  for (const entityType of Object.keys(STORE_MAP) as EntityType[]) {
    const storeName = STORE_MAP[entityType];
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const index = store.index('by-expires');

    let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
    while (cursor) {
      await cursor.delete();
      deletedCount++;
      cursor = await cursor.continue();
    }

    await tx.done;
  }

  return deletedCount;
};

// ============= PENDING CHANGES OPERATIONS =============

/**
 * Add a pending change to the queue
 */
export const addPendingChange = async (
  entityType: EntityType,
  entityId: string,
  changeType: ChangeType,
  data: Record<string, unknown>,
  previousData?: Record<string, unknown>
): Promise<PendingChange> => {
  const db = await getDB();

  // Check for existing pending change for same entity
  const existingChanges = await db.getAllFromIndex(
    'pendingChanges',
    'by-entity',
    [entityType, entityId]
  );

  // If there's an existing pending change, update it instead
  if (existingChanges.length > 0) {
    const existing = existingChanges[0];

    // Handle change type combinations
    if (existing.changeType === 'create' && changeType === 'update') {
      // Update a pending create - just update the data
      existing.data = { ...existing.data, ...data };
      existing.timestamp = Date.now();
      await db.put('pendingChanges', existing);
      return existing;
    } else if (existing.changeType === 'create' && changeType === 'delete') {
      // Delete a pending create - remove the pending change entirely
      await db.delete('pendingChanges', existing.id);
      await deleteCachedEntity(entityType, entityId);
      return existing;
    } else if (existing.changeType === 'update' && changeType === 'update') {
      // Multiple updates - merge them
      existing.data = { ...existing.data, ...data };
      existing.timestamp = Date.now();
      await db.put('pendingChanges', existing);
      return existing;
    } else if (existing.changeType === 'update' && changeType === 'delete') {
      // Delete after update - change to delete
      existing.changeType = 'delete';
      existing.data = {};
      existing.timestamp = Date.now();
      await db.put('pendingChanges', existing);
      return existing;
    }
  }

  const pendingChange: PendingChange = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    changeType,
    data,
    previousData,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await db.add('pendingChanges', pendingChange);
  return pendingChange;
};

/**
 * Get all pending changes
 */
export const getPendingChanges = async (
  status?: SyncStatus
): Promise<PendingChange[]> => {
  const db = await getDB();

  if (status) {
    return db.getAllFromIndex('pendingChanges', 'by-status', status);
  }

  return db.getAll('pendingChanges');
};

/**
 * Get pending changes count
 */
export const getPendingChangesCount = async (): Promise<number> => {
  const db = await getDB();
  return db.count('pendingChanges');
};

/**
 * Get pending changes for a specific entity
 */
export const getEntityPendingChanges = async (
  entityType: EntityType,
  entityId: string
): Promise<PendingChange[]> => {
  const db = await getDB();
  return db.getAllFromIndex('pendingChanges', 'by-entity', [entityType, entityId]);
};

/**
 * Update pending change status
 */
export const updatePendingChangeStatus = async (
  id: string,
  status: SyncStatus,
  error?: string
): Promise<void> => {
  const db = await getDB();
  const change = await db.get('pendingChanges', id);

  if (change) {
    change.status = status;
    if (error) {
      change.lastError = error;
      change.retryCount++;
    }
    await db.put('pendingChanges', change);
  }
};

/**
 * Remove a pending change
 */
export const removePendingChange = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('pendingChanges', id);
};

/**
 * Clear all pending changes
 */
export const clearPendingChanges = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('pendingChanges');
};

// ============= CONFLICT RESOLUTION =============

/**
 * Record a sync conflict
 */
export const recordConflict = async (
  entityType: EntityType,
  entityId: string,
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Promise<ConflictRecord> => {
  const db = await getDB();

  const conflict: ConflictRecord = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    localData,
    serverData,
    timestamp: Date.now(),
    resolved: false,
  };

  await db.add('conflicts', conflict);
  return conflict;
};

/**
 * Get all unresolved conflicts
 */
export const getUnresolvedConflicts = async (): Promise<ConflictRecord[]> => {
  const db = await getDB();
  return db.getAllFromIndex('conflicts', 'by-resolved', 0);
};

/**
 * Get conflicts for a specific entity
 */
export const getEntityConflicts = async (
  entityType: EntityType,
  entityId: string
): Promise<ConflictRecord[]> => {
  const db = await getDB();
  return db.getAllFromIndex('conflicts', 'by-entity', [entityType, entityId]);
};

/**
 * Resolve a conflict
 */
export const resolveConflict = async (
  conflictId: string,
  resolution: 'local' | 'server' | 'merged',
  mergedData?: Record<string, unknown>
): Promise<void> => {
  const db = await getDB();
  const conflict = await db.get('conflicts', conflictId);

  if (!conflict) {
    throw new Error(`Conflict not found: ${conflictId}`);
  }

  conflict.resolved = true;
  conflict.resolution = resolution;

  // Apply resolution
  if (resolution === 'local') {
    // Keep local data - re-queue for sync
    await addPendingChange(
      conflict.entityType,
      conflict.entityId,
      'update',
      conflict.localData
    );
  } else if (resolution === 'server') {
    // Accept server data - update local cache
    await cacheEntity(conflict.entityType, {
      id: conflict.entityId,
      ...conflict.serverData,
    } as { id: string });
  } else if (resolution === 'merged' && mergedData) {
    // Use merged data - update cache and queue for sync
    await cacheEntity(conflict.entityType, {
      id: conflict.entityId,
      ...mergedData,
    } as { id: string });
    await addPendingChange(conflict.entityType, conflict.entityId, 'update', mergedData);
  }

  await db.put('conflicts', conflict);
};

/**
 * Auto-resolve conflict based on strategy
 */
export const autoResolveConflict = async (
  conflictId: string,
  strategy: ConflictStrategy
): Promise<void> => {
  if (strategy === 'manual') {
    throw new Error('Manual strategy requires user intervention');
  }

  const resolution = strategy === 'server-wins' ? 'server' : 'local';
  await resolveConflict(conflictId, resolution);
};

/**
 * Clear resolved conflicts older than specified days
 */
export const clearOldConflicts = async (daysOld = 7): Promise<number> => {
  const db = await getDB();
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  const tx = db.transaction('conflicts', 'readwrite');
  const store = tx.objectStore('conflicts');

  let cursor = await store.openCursor();
  while (cursor) {
    if (cursor.value.resolved && cursor.value.timestamp < cutoff) {
      await cursor.delete();
      deletedCount++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return deletedCount;
};

// ============= SYNC METADATA =============

/**
 * Get sync metadata
 */
export const getSyncMetadata = async (key: string): Promise<SyncMetadata | undefined> => {
  const db = await getDB();
  return db.get('syncMetadata', key);
};

/**
 * Update sync metadata
 */
export const updateSyncMetadata = async (
  key: string,
  updates: Partial<Omit<SyncMetadata, 'key'>>
): Promise<void> => {
  const db = await getDB();
  const existing = await db.get('syncMetadata', key);

  const metadata: SyncMetadata = {
    key,
    lastSyncTime: existing?.lastSyncTime ?? 0,
    syncInProgress: existing?.syncInProgress ?? false,
    ...updates,
  };

  await db.put('syncMetadata', metadata);
};

/**
 * Set last sync time for an entity type
 */
export const setLastSyncTime = async (entityType: EntityType): Promise<void> => {
  await updateSyncMetadata(entityType, { lastSyncTime: Date.now() });
};

/**
 * Get last sync time for an entity type
 */
export const getLastSyncTime = async (entityType: EntityType): Promise<number> => {
  const metadata = await getSyncMetadata(entityType);
  return metadata?.lastSyncTime ?? 0;
};

// ============= OFFLINE OPERATIONS (Create/Update/Delete) =============

/**
 * Create entity offline
 */
export const createEntityOffline = async <T extends { id?: string }>(
  entityType: EntityType,
  data: Omit<T, 'id'>
): Promise<T> => {
  const id = crypto.randomUUID();
  const entity = { ...data, id } as T;

  // Cache locally
  await cacheEntity(entityType, entity as T & { id: string }, undefined, true);

  // Queue for sync
  await addPendingChange(entityType, id, 'create', entity as Record<string, unknown>);

  return entity;
};

/**
 * Update entity offline
 */
export const updateEntityOffline = async <T extends { id: string }>(
  entityType: EntityType,
  id: string,
  updates: Partial<T>
): Promise<T | null> => {
  // Get current cached data
  const existing = await getCachedEntity<T>(entityType, id, true);
  if (!existing) return null;

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

  // Update cache
  await cacheEntity(entityType, updated);

  // Queue for sync
  await addPendingChange(
    entityType,
    id,
    'update',
    updates as Record<string, unknown>,
    existing as Record<string, unknown>
  );

  return updated;
};

/**
 * Delete entity offline
 */
export const deleteEntityOffline = async (
  entityType: EntityType,
  id: string
): Promise<void> => {
  // Get current cached data for potential conflict resolution
  const existing = await getCachedEntity(entityType, id, true);

  // Remove from cache
  await deleteCachedEntity(entityType, id);

  // Queue for sync (only if not an offline-created entity that was never synced)
  const pendingCreates = await getEntityPendingChanges(entityType, id);
  const isOfflineOnly = pendingCreates.some((c) => c.changeType === 'create');

  if (!isOfflineOnly) {
    await addPendingChange(
      entityType,
      id,
      'delete',
      {},
      existing as Record<string, unknown>
    );
  }
};

// ============= UTILITY FUNCTIONS =============

/**
 * Check if there are pending changes
 */
export const hasPendingChanges = async (): Promise<boolean> => {
  const count = await getPendingChangesCount();
  return count > 0;
};

/**
 * Check if there are unresolved conflicts
 */
export const hasConflicts = async (): Promise<boolean> => {
  const conflicts = await getUnresolvedConflicts();
  return conflicts.length > 0;
};

/**
 * Get offline storage stats
 */
export const getOfflineStorageStats = async (): Promise<{
  pendingChanges: number;
  conflicts: number;
  cachedEntities: Record<EntityType, number>;
}> => {
  const db = await getDB();

  const pendingChanges = await db.count('pendingChanges');
  const conflicts = (await getUnresolvedConflicts()).length;

  const cachedEntities: Record<EntityType, number> = {
    workOrder: await db.count('workOrders'),
    asset: await db.count('assets'),
    inventory: await db.count('inventory'),
    pmSchedule: await db.count('pmSchedules'),
  };

  return { pendingChanges, conflicts, cachedEntities };
};

/**
 * Clear all offline storage
 */
export const clearAllOfflineStorage = async (): Promise<void> => {
  const db = await getDB();

  await Promise.all([
    db.clear('pendingChanges'),
    db.clear('workOrders'),
    db.clear('assets'),
    db.clear('inventory'),
    db.clear('pmSchedules'),
    db.clear('conflicts'),
    db.clear('syncMetadata'),
  ]);
};

export default {
  initOfflineStorage,
  cacheEntity,
  cacheEntities,
  getCachedEntity,
  getAllCachedEntities,
  deleteCachedEntity,
  clearEntityCache,
  clearExpiredEntities,
  addPendingChange,
  getPendingChanges,
  getPendingChangesCount,
  updatePendingChangeStatus,
  removePendingChange,
  recordConflict,
  getUnresolvedConflicts,
  resolveConflict,
  autoResolveConflict,
  createEntityOffline,
  updateEntityOffline,
  deleteEntityOffline,
  hasPendingChanges,
  hasConflicts,
  getOfflineStorageStats,
  clearAllOfflineStorage,
};
