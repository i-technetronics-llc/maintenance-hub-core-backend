/**
 * Sync Service
 *
 * Handles synchronization of offline changes with the server:
 * - Queue management for offline actions
 * - Automatic sync when coming back online
 * - Retry logic with exponential backoff
 * - Conflict detection and resolution
 * - Sync status broadcasting
 */

import { api } from './api';
import {
  EntityType,
  PendingChange,
  ConflictStrategy,
  getPendingChanges,
  updatePendingChangeStatus,
  removePendingChange,
  recordConflict,
  autoResolveConflict,
  cacheEntity,
  cacheEntities,
  setLastSyncTime,
  getLastSyncTime,
  updateSyncMetadata,
  getPendingChangesCount,
  getUnresolvedConflicts,
  clearExpiredEntities,
} from './offlineStorage';

// ============= TYPES =============

export interface SyncResult {
  success: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export interface SyncProgress {
  total: number;
  completed: number;
  current?: string;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  lastSync?: number;
}

export type SyncEventType =
  | 'sync-start'
  | 'sync-progress'
  | 'sync-complete'
  | 'sync-error'
  | 'conflict-detected'
  | 'online'
  | 'offline';

export interface SyncEvent {
  type: SyncEventType;
  data?: SyncProgress | SyncResult | PendingChange | Error;
  timestamp: number;
}

type SyncEventCallback = (event: SyncEvent) => void;

// ============= CONFIGURATION =============

const MAX_RETRY_COUNT = 3;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const SYNC_BATCH_SIZE = 10;
const DEFAULT_CONFLICT_STRATEGY: ConflictStrategy = 'server-wins';

// API endpoint mapping
const API_ENDPOINTS: Record<EntityType, string> = {
  workOrder: '/work-orders',
  asset: '/assets',
  inventory: '/inventory',
  pmSchedule: '/preventive-maintenance/schedules',
};

// ============= SYNC SERVICE CLASS =============

class SyncService {
  private listeners: Set<SyncEventCallback> = new Set();
  private isSyncing = false;
  private syncProgress: SyncProgress = {
    total: 0,
    completed: 0,
    status: 'idle',
  };
  private conflictStrategy: ConflictStrategy = DEFAULT_CONFLICT_STRATEGY;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupNetworkListeners();
  }

  // ============= EVENT SYSTEM =============

  /**
   * Subscribe to sync events
   */
  subscribe(callback: SyncEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Emit sync event to all subscribers
   */
  private emit(type: SyncEventType, data?: SyncEvent['data']): void {
    const event: SyncEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SyncService] Error in event listener:', error);
      }
    });
  }

  // ============= NETWORK LISTENERS =============

  /**
   * Setup online/offline event listeners
   */
  private setupNetworkListeners(): void {
    this.onlineHandler = () => {
      console.log('[SyncService] Network online - triggering sync');
      this.emit('online');
      this.syncAll();
    };

    this.offlineHandler = () => {
      console.log('[SyncService] Network offline');
      this.emit('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    }
  }

  /**
   * Cleanup network listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler);
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler);
      }
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.listeners.clear();
  }

  // ============= SYNC OPERATIONS =============

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Get current sync progress
   */
  getProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictStrategy(strategy: ConflictStrategy): void {
    this.conflictStrategy = strategy;
  }

  /**
   * Sync all pending changes
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return { success: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    if (!this.isOnline()) {
      console.log('[SyncService] Cannot sync - offline');
      return { success: 0, failed: 0, conflicts: 0, errors: ['Device is offline'] };
    }

    this.isSyncing = true;
    const result: SyncResult = { success: 0, failed: 0, conflicts: 0, errors: [] };

    try {
      const pendingChanges = await getPendingChanges('pending');
      this.syncProgress = {
        total: pendingChanges.length,
        completed: 0,
        status: 'syncing',
      };

      this.emit('sync-start', this.syncProgress);

      // Process in batches
      for (let i = 0; i < pendingChanges.length; i += SYNC_BATCH_SIZE) {
        const batch = pendingChanges.slice(i, i + SYNC_BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map((change) => this.syncChange(change))
        );

        for (let j = 0; j < batchResults.length; j++) {
          const batchResult = batchResults[j];
          this.syncProgress.completed++;
          this.syncProgress.current = batch[j]?.entityType;

          if (batchResult.status === 'fulfilled') {
            if (batchResult.value === 'success') {
              result.success++;
            } else if (batchResult.value === 'conflict') {
              result.conflicts++;
            } else {
              result.failed++;
            }
          } else {
            result.failed++;
            result.errors.push(batchResult.reason?.message || 'Unknown error');
          }

          this.emit('sync-progress', this.syncProgress);
        }
      }

      // Fetch fresh data after sync
      await this.refreshData();

      // Clear expired entities
      await clearExpiredEntities();

      this.syncProgress.status = 'completed';
      this.syncProgress.lastSync = Date.now();
      this.emit('sync-complete', result);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(message);
      this.syncProgress.status = 'error';
      this.emit('sync-error', error instanceof Error ? error : new Error(message));
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single pending change
   */
  private async syncChange(
    change: PendingChange
  ): Promise<'success' | 'conflict' | 'error'> {
    const endpoint = API_ENDPOINTS[change.entityType];

    try {
      await updatePendingChangeStatus(change.id, 'syncing');

      let response;

      switch (change.changeType) {
        case 'create':
          // For creates, don't send the client-generated ID
          const createData = { ...change.data };
          delete createData.id;
          response = await api.post(endpoint, createData);

          // Update local cache with server-assigned ID
          if (response.data?.data || response.data) {
            const serverEntity = response.data?.data || response.data;
            await cacheEntity(change.entityType, serverEntity);
          }
          break;

        case 'update':
          response = await api.patch(`${endpoint}/${change.entityId}`, change.data);

          // Check for version conflict
          if (response.status === 409) {
            return await this.handleConflict(change, response.data);
          }

          // Update local cache
          if (response.data?.data || response.data) {
            await cacheEntity(change.entityType, response.data?.data || response.data);
          }
          break;

        case 'delete':
          await api.delete(`${endpoint}/${change.entityId}`);
          break;
      }

      await removePendingChange(change.id);
      return 'success';

    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };

      // Handle specific error cases
      if (axiosError?.response?.status === 409) {
        return await this.handleConflict(change, axiosError.response?.data);
      }

      if (axiosError?.response?.status === 404 && change.changeType === 'delete') {
        // Entity already deleted on server - consider it success
        await removePendingChange(change.id);
        return 'success';
      }

      // Update retry count
      const newRetryCount = change.retryCount + 1;
      if (newRetryCount >= MAX_RETRY_COUNT) {
        await updatePendingChangeStatus(
          change.id,
          'error',
          axiosError?.message || 'Max retries exceeded'
        );
        return 'error';
      }

      // Schedule retry with exponential backoff
      await updatePendingChangeStatus(change.id, 'pending', axiosError?.message);
      const delay = Math.min(
        BASE_RETRY_DELAY * Math.pow(2, newRetryCount),
        MAX_RETRY_DELAY
      );
      setTimeout(() => this.syncChange({ ...change, retryCount: newRetryCount }), delay);

      return 'error';
    }
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    change: PendingChange,
    serverResponse: unknown
  ): Promise<'conflict' | 'success'> {
    const serverData = (serverResponse as { data?: Record<string, unknown> })?.data || serverResponse as Record<string, unknown>;

    // Record the conflict
    const conflict = await recordConflict(
      change.entityType,
      change.entityId,
      change.data,
      serverData as Record<string, unknown>
    );

    this.emit('conflict-detected', change);

    // Auto-resolve if strategy is not manual
    if (this.conflictStrategy !== 'manual') {
      await autoResolveConflict(conflict.id, this.conflictStrategy);
      await removePendingChange(change.id);
      return 'success';
    }

    await updatePendingChangeStatus(change.id, 'conflict');
    return 'conflict';
  }

  // ============= DATA REFRESH =============

  /**
   * Refresh local data from server
   */
  async refreshData(): Promise<void> {
    if (!this.isOnline()) return;

    try {
      await Promise.all([
        this.refreshEntityType('workOrder'),
        this.refreshEntityType('asset'),
        this.refreshEntityType('inventory'),
        this.refreshEntityType('pmSchedule'),
      ]);
    } catch (error) {
      console.error('[SyncService] Error refreshing data:', error);
    }
  }

  /**
   * Refresh a specific entity type from server
   */
  async refreshEntityType(entityType: EntityType): Promise<void> {
    const endpoint = API_ENDPOINTS[entityType];
    const lastSync = await getLastSyncTime(entityType);

    try {
      await updateSyncMetadata(entityType, { syncInProgress: true });

      // Fetch data (with optional incremental sync based on lastSync)
      const params: Record<string, unknown> = { limit: 1000 };
      if (lastSync > 0) {
        params.updatedSince = new Date(lastSync).toISOString();
      }

      const response = await api.get(endpoint, { params });
      const data = response.data?.data || response.data;

      if (Array.isArray(data)) {
        await cacheEntities(entityType, data);
      } else if (data?.data && Array.isArray(data.data)) {
        await cacheEntities(entityType, data.data);
      }

      await setLastSyncTime(entityType);
      await updateSyncMetadata(entityType, { syncInProgress: false, lastError: undefined });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await updateSyncMetadata(entityType, { syncInProgress: false, lastError: message });
      throw error;
    }
  }

  /**
   * Force full refresh of an entity type (ignoring lastSync)
   */
  async forceRefresh(entityType: EntityType): Promise<void> {
    const endpoint = API_ENDPOINTS[entityType];

    try {
      const response = await api.get(endpoint, { params: { limit: 1000 } });
      const data = response.data?.data || response.data;

      if (Array.isArray(data)) {
        await cacheEntities(entityType, data);
      } else if (data?.data && Array.isArray(data.data)) {
        await cacheEntities(entityType, data.data);
      }

      await setLastSyncTime(entityType);
    } catch (error) {
      console.error(`[SyncService] Error force refreshing ${entityType}:`, error);
      throw error;
    }
  }

  // ============= BACKGROUND SYNC =============

  /**
   * Start periodic background sync
   */
  startBackgroundSync(intervalMs = 5 * 60 * 1000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline() && !this.isSyncing) {
        const pendingCount = await getPendingChangesCount();
        if (pendingCount > 0) {
          console.log(`[SyncService] Background sync - ${pendingCount} pending changes`);
          await this.syncAll();
        }
      }
    }, intervalMs);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Request background sync via Service Worker
   */
  async requestBackgroundSync(): Promise<boolean> {
    if ('serviceWorker' in navigator && typeof (window as Window & { SyncManager?: unknown }).SyncManager !== 'undefined') {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-pending-changes');
        return true;
      } catch (error) {
        console.error('[SyncService] Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }

  // ============= STATUS HELPERS =============

  /**
   * Get comprehensive sync status
   */
  async getStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingChanges: number;
    unresolvedConflicts: number;
    lastSync: Record<EntityType, number>;
    progress: SyncProgress;
  }> {
    const pendingChanges = await getPendingChangesCount();
    const conflicts = await getUnresolvedConflicts();

    const lastSync: Record<EntityType, number> = {
      workOrder: await getLastSyncTime('workOrder'),
      asset: await getLastSyncTime('asset'),
      inventory: await getLastSyncTime('inventory'),
      pmSchedule: await getLastSyncTime('pmSchedule'),
    };

    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingChanges,
      unresolvedConflicts: conflicts.length,
      lastSync,
      progress: this.getProgress(),
    };
  }

  /**
   * Check if sync is needed
   */
  async needsSync(): Promise<boolean> {
    const pendingCount = await getPendingChangesCount();
    return pendingCount > 0;
  }
}

// ============= SINGLETON INSTANCE =============

export const syncService = new SyncService();

// ============= CONVENIENCE FUNCTIONS =============

export const syncAll = () => syncService.syncAll();
export const refreshData = () => syncService.refreshData();
export const getSyncStatus = () => syncService.getStatus();
export const subscribeSyncEvents = (cb: SyncEventCallback) => syncService.subscribe(cb);
export const startBackgroundSync = (interval?: number) => syncService.startBackgroundSync(interval);
export const stopBackgroundSync = () => syncService.stopBackgroundSync();

export default syncService;
