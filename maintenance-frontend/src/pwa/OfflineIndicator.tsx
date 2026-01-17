/**
 * OfflineIndicator Component
 *
 * Displays online/offline status and sync progress:
 * - Shows offline warning banner when disconnected
 * - Shows sync progress when syncing
 * - Shows pending changes count
 * - Provides manual sync trigger
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  useOfflineSync,
  useSyncStatus,
  useHasPendingChanges,
} from '../providers/OfflineSyncProvider';

interface OfflineIndicatorProps {
  className?: string;
  showSyncButton?: boolean;
  showPendingCount?: boolean;
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showSyncButton = true,
  showPendingCount = true,
  compact = false,
}) => {
  const { syncNow } = useOfflineSync();
  const status = useSyncStatus();
  const hasPendingChanges = useHasPendingChanges();
  const [showConflictAlert, setShowConflictAlert] = useState(false);

  const { isOnline, isSyncing, pendingCount, conflictCount, progress, error } = status;

  // Show conflict alert when new conflicts detected
  useEffect(() => {
    if (conflictCount > 0) {
      setShowConflictAlert(true);
    }
  }, [conflictCount]);

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    await syncNow();
  }, [isOnline, isSyncing, syncNow]);

  const dismissConflictAlert = useCallback(() => {
    setShowConflictAlert(false);
  }, []);

  // Don't show anything if online, not syncing, and no pending changes
  if (isOnline && !isSyncing && !hasPendingChanges && conflictCount === 0) {
    return null;
  }

  // Compact mode - minimal indicator
  if (compact) {
    return (
      <CompactIndicator
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        conflictCount={conflictCount}
        onSync={handleSync}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-2 px-4 z-50 flex items-center justify-center gap-3 shadow-md">
          <WifiOffIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            You are offline. Changes will sync when connection is restored.
          </span>
          {showPendingCount && pendingCount > 0 && (
            <span className="bg-yellow-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {/* Syncing Banner */}
      {isOnline && isSyncing && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white py-2 px-4 z-50 flex items-center justify-center gap-3 shadow-md">
          <SyncIcon className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            Syncing changes...
          </span>
          {progress.total > 0 && (
            <span className="text-xs">
              ({progress.completed}/{progress.total})
            </span>
          )}
          <div className="w-32 h-1 bg-blue-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{
                width: progress.total > 0
                  ? ((progress.completed / progress.total) * 100).toString() + '%'
                  : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Pending Changes Banner (online but has pending) */}
      {isOnline && !isSyncing && hasPendingChanges && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white py-2 px-4 z-50 flex items-center justify-center gap-3 shadow-md">
          <CloudUploadIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending sync
          </span>
          {showSyncButton && (
            <button
              onClick={handleSync}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Sync Now
            </button>
          )}
        </div>
      )}

      {/* Conflict Alert */}
      {showConflictAlert && conflictCount > 0 && (
        <div className="fixed top-12 left-0 right-0 bg-red-500 text-white py-2 px-4 z-50 flex items-center justify-center gap-3 shadow-md">
          <WarningIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {conflictCount} sync conflict{conflictCount !== 1 ? 's' : ''} need resolution
          </span>
          <button
            onClick={dismissConflictAlert}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 flex items-center justify-center gap-3 shadow-md">
          <WarningIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Sync error: {error}</span>
          {showSyncButton && isOnline && (
            <button
              onClick={handleSync}
              className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============= COMPACT INDICATOR =============

interface CompactIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  onSync: () => void;
  className?: string;
}

const CompactIndicator: React.FC<CompactIndicatorProps> = ({
  isOnline,
  isSyncing,
  pendingCount,
  conflictCount,
  onSync,
  className = '',
}) => {
  if (isOnline && !isSyncing && pendingCount === 0 && conflictCount === 0) {
    return null;
  }

  return (
    <div className={'flex items-center gap-2 ' + className}>
      {!isOnline && (
        <div className="flex items-center gap-1 text-yellow-500" title="Offline">
          <WifiOffIcon className="w-4 h-4" />
        </div>
      )}

      {isSyncing && (
        <div className="flex items-center gap-1 text-blue-500" title="Syncing">
          <SyncIcon className="w-4 h-4 animate-spin" />
        </div>
      )}

      {isOnline && !isSyncing && pendingCount > 0 && (
        <button
          onClick={onSync}
          className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
          title={pendingCount + ' pending changes - click to sync'}
        >
          <CloudUploadIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{pendingCount}</span>
        </button>
      )}

      {conflictCount > 0 && (
        <div
          className="flex items-center gap-1 text-red-500"
          title={conflictCount + ' conflicts need resolution'}
        >
          <WarningIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{conflictCount}</span>
        </div>
      )}
    </div>
  );
};

// ============= ICONS =============

const WifiOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
    />
  </svg>
);

const SyncIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const CloudUploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

export default OfflineIndicator;
