import { useAuthStore } from '../store/authStore';

interface CanProps {
  children: React.ReactNode;
  permission?: string;
  superAdminOnly?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Can component for conditional rendering based on permissions
 *
 * Hides/shows UI elements based on user permissions.
 * Frontend checks are for UX only - security is enforced on backend.
 *
 * @param children - The component(s) to render if user has permission
 * @param permission - Optional permission required to render children
 * @param superAdminOnly - If true, only super-admin can see the content
 * @param fallback - Optional fallback content to render if permission denied
 *
 * @example
 * // Show button only if user has permission
 * <Can permission="users:create">
 *   <button onClick={handleInvite}>Invite Employee</button>
 * </Can>
 *
 * @example
 * // Show content only for super-admin
 * <Can superAdminOnly>
 *   <SuperAdminPanel />
 * </Can>
 *
 * @example
 * // Show different content based on permission
 * <Can permission="companies:edit" fallback={<p>View only</p>}>
 *   <button>Edit Company</button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({
  children,
  permission,
  superAdminOnly = false,
  fallback = null,
}) => {
  const { hasPermission, isSuperAdmin } = useAuthStore();

  // Check super-admin only access
  if (superAdminOnly) {
    return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  // Check specific permission
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // If no restrictions, render children
  return <>{children}</>;
};
