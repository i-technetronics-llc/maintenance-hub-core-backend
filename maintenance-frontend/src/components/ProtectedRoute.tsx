import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  superAdminOnly?: boolean;
}

/**
 * ProtectedRoute component for role-based and permission-based access control
 *
 * @param children - The component(s) to render if access is granted
 * @param requiredPermission - Optional permission required to access the route
 * @param superAdminOnly - If true, only super-admin can access
 *
 * @example
 * // Route accessible only to authenticated users
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Route requiring specific permission
 * <ProtectedRoute requiredPermission="companies:view">
 *   <CompanyManagementPage />
 * </ProtectedRoute>
 *
 * @example
 * // Route for super-admin only
 * <ProtectedRoute superAdminOnly>
 *   <SuperAdminDashboard />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  superAdminOnly = false,
}) => {
  const { isAuthenticated, hasPermission, isSuperAdmin } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if route is super-admin only
  if (superAdminOnly && !isSuperAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if route requires specific permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
