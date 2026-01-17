export { InstallPrompt } from './InstallPrompt';
export { OfflineIndicator } from './OfflineIndicator';
export { useOnlineStatus } from './useOnlineStatus';
export * from './offlineSync';
export * from './pushNotifications';

// Re-export from providers for convenience
export {
  OfflineSyncProvider,
  useOfflineSync,
  useSyncStatus,
  useHasPendingChanges,
  useIsOnline,
  useIsSyncing,
  useSyncNow,
  useSyncProgress,
  useConflicts,
} from '../providers/OfflineSyncProvider';

// Re-export sync service
export { syncService, syncAll, refreshData, getSyncStatus } from '../services/syncService';

// Re-export offline storage utilities
export {
  initOfflineStorage,
  cacheEntity,
  cacheEntities,
  getCachedEntity,
  getAllCachedEntities,
  createEntityOffline,
  updateEntityOffline,
  deleteEntityOffline,
  hasPendingChanges,
  hasConflicts,
  getOfflineStorageStats,
} from '../services/offlineStorage';

export type {
  EntityType,
  ChangeType,
  SyncStatus as OfflineSyncStatus,
  PendingChange,
  ConflictRecord,
} from '../services/offlineStorage';
