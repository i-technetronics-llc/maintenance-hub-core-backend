/**
 * SyncStatusBadge Component
 *
 * A compact badge showing sync status with pending items count.
 * Can be placed in navigation bars, headers, or any UI element.
 *
 * Features:
 * - Shows pending changes count
 * - Visual indicators for different states (syncing, offline, conflicts)
 * - Click to trigger manual sync
 * - Customizable size and appearance
 */

import React, { useCallback } from 'react';
import {
  useOfflineSync,
  useSyncStatus,
} from '../providers/OfflineSyncProvider';

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'default' | 'minimal' | 'pill';

interface SyncStatusBadgeProps {
  size?: BadgeSize;
  variant?: BadgeVariant;
  showLabel?: boolean;
  className?: string;
  onSyncClick?: () => void;
}

const sizeClasses: Record<BadgeSize, { icon: string; text: string; badge: string }> = {
  sm: { icon: 'w-3 h-3', text: 'text-xs', badge: 'px-1.5 py-0.5' },
  md: { icon: 'w-4 h-4', text: 'text-sm', badge: 'px-2 py-1' },
  lg: { icon: 'w-5 h-5', text: 'text-base', badge: 'px-3 py-1.5' },
};

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
  onSyncClick,
}) => {
  const { syncNow } = useOfflineSync();
  const status = useSyncStatus();

  const { isOnline, isSyncing, pendingCount, conflictCount, progress } = status;

  const handleClick = useCallback(async () => {
    if (onSyncClick) {
      onSyncClick();
    } else if (isOnline && !isSyncing && pendingCount > 0) {
      await syncNow();
    }
  }, [onSyncClick, isOnline, isSyncing, pendingCount, syncNow]);

  const sizes = sizeClasses[size];

  // Determine badge state and styling
  const getBadgeConfig = () => {
    if (!isOnline) {
      return {
        bgColor: 'bg-yellow-100 hover:bg-yellow-200',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        icon: <WifiOffIcon className={sizes.icon} />,
        label: 'Offline',
        count: pendingCount,
        clickable: false,
      };
    }

    if (isSyncing) {
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        icon: <SyncIcon className={sizes.icon + ' animate-spin'} />,
        label: 'Syncing',
        count: progress.total > 0 ? progress.completed + '/' + progress.total : null,
        clickable: false,
      };
    }

    if (conflictCount > 0) {
      return {
        bgColor: 'bg-red-100 hover:bg-red-200',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        icon: <WarningIcon className={sizes.icon} />,
        label: 'Conflicts',
        count: conflictCount,
        clickable: true,
      };
    }

    if (pendingCount > 0) {
      return {
        bgColor: 'bg-orange-100 hover:bg-orange-200',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        icon: <CloudUploadIcon className={sizes.icon} />,
        label: 'Pending',
        count: pendingCount,
        clickable: true,
      };
    }

    // All synced / no pending changes
    return {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      icon: <CheckIcon className={sizes.icon} />,
      label: 'Synced',
      count: null,
      clickable: false,
    };
  };

  const config = getBadgeConfig();

  // Hide badge if everything is synced and not showing labels
  if (!showLabel && !config.count && isOnline && !isSyncing) {
    return null;
  }

  // Minimal variant - just icon and count
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={!config.clickable}
        className={
          'flex items-center gap-1 transition-colors ' +
          config.textColor +
          (config.clickable ? ' cursor-pointer hover:opacity-80' : ' cursor-default') +
          ' ' + className
        }
        title={config.label + (config.count ? ': ' + config.count : '')}
      >
        {config.icon}
        {config.count !== null && (
          <span className={sizes.text + ' font-medium'}>{config.count}</span>
        )}
      </button>
    );
  }

  // Pill variant - rounded pill shape
  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        disabled={!config.clickable}
        className={
          'flex items-center gap-1.5 rounded-full transition-colors ' +
          sizes.badge + ' ' +
          config.bgColor + ' ' +
          config.textColor + ' ' +
          (config.clickable ? ' cursor-pointer' : ' cursor-default') +
          ' ' + className
        }
        title={config.clickable ? 'Click to sync' : config.label}
      >
        {config.icon}
        {config.count !== null && (
          <span className={sizes.text + ' font-semibold'}>{config.count}</span>
        )}
        {showLabel && (
          <span className={sizes.text}>{config.label}</span>
        )}
      </button>
    );
  }

  // Default variant - bordered badge
  return (
    <button
      onClick={handleClick}
      disabled={!config.clickable}
      className={
        'flex items-center gap-1.5 rounded border transition-colors ' +
        sizes.badge + ' ' +
        config.bgColor + ' ' +
        config.textColor + ' ' +
        config.borderColor + ' ' +
        (config.clickable ? ' cursor-pointer' : ' cursor-default') +
        ' ' + className
      }
      title={config.clickable ? 'Click to sync' : config.label}
    >
      {config.icon}
      {config.count !== null && (
        <span className={sizes.text + ' font-semibold'}>{config.count}</span>
      )}
      {showLabel && (
        <span className={sizes.text}>{config.label}</span>
      )}
    </button>
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

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default SyncStatusBadge;
