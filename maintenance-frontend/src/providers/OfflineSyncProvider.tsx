/**
 * OfflineSyncProvider
 *
 * Provides offline synchronization context to the application:
 * - Detects online/offline status
 * - Manages sync queue
 * - Triggers sync operations
 * - Provides sync status to components via context
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  syncService,
  SyncProgress,
  SyncResult,
  SyncEvent,
  SyncEventType,
} from '../services/syncService';
import {
  initOfflineStorage,
  getPendingChangesCount,
  getUnresolvedConflicts,
  ConflictRecord,
  hasPendingChanges,
  EntityType,
  getOfflineStorageStats,
} from '../services/offlineStorage';

// ============= TYPES =============

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncTime: number | null;
  lastSyncResult: SyncResult | null;
  progress: SyncProgress;
  error: string | null;
}

export interface OfflineSyncContextValue {
  // Status
  status: SyncStatus;
  isInitialized: boolean;

  // Actions
  syncNow: () => Promise<SyncResult>;
  refreshData: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'server') => Promise<void>;
  clearSyncQueue: () => Promise<void>;

  // Data
  conflicts: ConflictRecord[];
  stats: {
    pendingChanges: number;
    conflicts: number;
    cachedEntities: Record<EntityType, number>;
  } | null;

  // Utilities
  refreshStatus: () => Promise<void>;
}

const defaultSyncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  conflictCount: 0,
  lastSyncTime: null,
  lastSyncResult: null,
  progress: {
    total: 0,
    completed: 0,
    status: 'idle',
  },
  error: null,
};

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

// ============= PROVIDER COMPONENT =============

interface OfflineSyncProviderProps {
  children: ReactNode;
  autoSync?: boolean;
  syncInterval?: number;
  onSyncComplete?: (result: SyncResult) => void;
  onConflict?: (conflicts: ConflictRecord[]) => void;
  onError?: (error: Error) => void;
}

export const OfflineSyncProvider: React.FC<OfflineSyncProviderProps> = ({
  children,
  autoSync = true,
  syncInterval = 5 * 60 * 1000, // 5 minutes
  onSyncComplete,
  onConflict,
  onError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [stats, setStats] = useState<OfflineSyncContextValue['stats']>(null);

  const syncInProgressRef = useRef(false);
  const lastSyncAttemptRef = useRef<number>(0);

  // ============= INITIALIZATION =============

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize IndexedDB
        await initOfflineStorage();

        // Load initial status
        await refreshStatus();

        // Setup sync event listener
        const unsubscribe = syncService.subscribe(handleSyncEvent);

        // Start background sync if enabled
        if (autoSync) {
          syncService.startBackgroundSync(syncInterval);
        }

        setIsInitialized(true);

        // Sync on mount if online and has pending changes
        if (navigator.onLine) {
          const hasPending = await hasPendingChanges();
          if (hasPending) {
            syncNow();
          }
        }

        return () => {
          unsubscribe();
          syncService.stopBackgroundSync();
        };
      } catch (error) {
        console.error('[OfflineSyncProvider] Initialization error:', error);
        onError?.(error instanceof Error ? error : new Error('Initialization failed'));
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============= NETWORK STATUS LISTENER =============

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      if (autoSync && !syncInProgressRef.current) {
        const timeSinceLastSync = Date.now() - lastSyncAttemptRef.current;
        if (timeSinceLastSync > 30000) {
          // At least 30 seconds since last attempt
          syncNow();
        }
      }
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  // ============= SERVICE WORKER MESSAGE HANDLER =============

  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type } = event.data || {};

      switch (type) {
        case 'PERFORM_SYNC':
          if (!syncInProgressRef.current) {
            syncNow();
          }
          break;

        case 'QUEUE_FOR_SYNC':
          // Request was queued while offline - refresh status
          refreshStatus();
          break;
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============= SYNC EVENT HANDLER =============

  const handleSyncEvent = useCallback(
    (event: SyncEvent) => {
      switch (event.type as SyncEventType) {
        case 'sync-start':
          setStatus((prev) => ({
            ...prev,
            isSyncing: true,
            progress: event.data as SyncProgress,
            error: null,
          }));
          break;

        case 'sync-progress':
          setStatus((prev) => ({
            ...prev,
            progress: event.data as SyncProgress,
          }));
          break;

        case 'sync-complete':
          const result = event.data as SyncResult;
          setStatus((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: Date.now(),
            lastSyncResult: result,
            progress: { total: 0, completed: 0, status: 'completed' },
          }));
          refreshStatus();
          onSyncComplete?.(result);
          break;

        case 'sync-error':
          const error = event.data as Error;
          setStatus((prev) => ({
            ...prev,
            isSyncing: false,
            error: error.message,
            progress: { total: 0, completed: 0, status: 'error' },
          }));
          onError?.(error);
          break;

        case 'conflict-detected':
          loadConflicts();
          break;

        case 'online':
          setStatus((prev) => ({ ...prev, isOnline: true }));
          break;

        case 'offline':
          setStatus((prev) => ({ ...prev, isOnline: false }));
          break;
      }
    },
    [onSyncComplete, onError]
  );

  // ============= STATUS REFRESH =============

  const refreshStatus = useCallback(async () => {
    try {
      const [pendingCount, unresolvedConflicts, storageStats] = await Promise.all([
        getPendingChangesCount(),
        getUnresolvedConflicts(),
        getOfflineStorageStats(),
      ]);

      setStatus((prev) => ({
        ...prev,
        pendingCount,
        conflictCount: unresolvedConflicts.length,
        isOnline: navigator.onLine,
      }));

      setConflicts(unresolvedConflicts);
      setStats(storageStats);

      if (unresolvedConflicts.length > 0) {
        onConflict?.(unresolvedConflicts);
      }
    } catch (error) {
      console.error('[OfflineSyncProvider] Error refreshing status:', error);
    }
  }, [onConflict]);

  const loadConflicts = useCallback(async () => {
    try {
      const unresolvedConflicts = await getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);
      setStatus((prev) => ({ ...prev, conflictCount: unresolvedConflicts.length }));

      if (unresolvedConflicts.length > 0) {
        onConflict?.(unresolvedConflicts);
      }
    } catch (error) {
      console.error('[OfflineSyncProvider] Error loading conflicts:', error);
    }
  }, [onConflict]);

  // ============= SYNC ACTIONS =============

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (syncInProgressRef.current) {
      return { success: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine) {
      return { success: 0, failed: 0, conflicts: 0, errors: ['Device is offline'] };
    }

    syncInProgressRef.current = true;
    lastSyncAttemptRef.current = Date.now();

    try {
      const result = await syncService.syncAll();
      return result;
    } finally {
      syncInProgressRef.current = false;
      await refreshStatus();
    }
  }, [refreshStatus]);

  const refreshData = useCallback(async () => {
    if (!navigator.onLine) {
      throw new Error('Cannot refresh data while offline');
    }

    await syncService.refreshData();
    await refreshStatus();
  }, [refreshStatus]);

  const resolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'server') => {
      const { resolveConflict: resolveConflictFn } = await import(
        '../services/offlineStorage'
      );
      await resolveConflictFn(conflictId, resolution);
      await loadConflicts();
      await refreshStatus();
    },
    [loadConflicts, refreshStatus]
  );

  const clearSyncQueue = useCallback(async () => {
    const { clearPendingChanges } = await import('../services/offlineStorage');
    await clearPendingChanges();
    await refreshStatus();
  }, [refreshStatus]);

  // ============= CONTEXT VALUE =============

  const contextValue: OfflineSyncContextValue = {
    status,
    isInitialized,
    syncNow,
    refreshData,
    resolveConflict,
    clearSyncQueue,
    conflicts,
    stats,
    refreshStatus,
  };

  return (
    <OfflineSyncContext.Provider value={contextValue}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

// ============= HOOKS =============

/**
 * Hook to access offline sync context
 */
export const useOfflineSync = (): OfflineSyncContextValue => {
  const context = useContext(OfflineSyncContext);

  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }

  return context;
};

/**
 * Hook to get just the sync status
 */
export const useSyncStatus = (): SyncStatus => {
  const { status } = useOfflineSync();
  return status;
};

/**
 * Hook to check if there are pending changes
 */
export const useHasPendingChanges = (): boolean => {
  const { status } = useOfflineSync();
  return status.pendingCount > 0;
};

/**
 * Hook to check if online
 */
export const useIsOnline = (): boolean => {
  const { status } = useOfflineSync();
  return status.isOnline;
};

/**
 * Hook to check if syncing
 */
export const useIsSyncing = (): boolean => {
  const { status } = useOfflineSync();
  return status.isSyncing;
};

/**
 * Hook to trigger sync
 */
export const useSyncNow = (): (() => Promise<SyncResult>) => {
  const { syncNow } = useOfflineSync();
  return syncNow;
};

/**
 * Hook for sync progress
 */
export const useSyncProgress = (): SyncProgress => {
  const { status } = useOfflineSync();
  return status.progress;
};

/**
 * Hook for unresolved conflicts
 */
export const useConflicts = (): ConflictRecord[] => {
  const { conflicts } = useOfflineSync();
  return conflicts;
};

export default OfflineSyncProvider;
