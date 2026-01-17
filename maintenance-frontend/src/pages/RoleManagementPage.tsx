import { useState, useEffect } from 'react';
import { Permission, roleApi } from '../services/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  companyId: string | null;
  permissions: Permission[];
}

interface GroupedPermissions {
  [module: string]: Permission[];
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

// System roles from README USER ROLES & PERMISSION MATRIX
const SYSTEM_ROLES: { name: string; displayName: string; description: string; category: 'platform' | 'vendor' | 'client' }[] = [
  // Platform Level
  { name: 'super_admin', displayName: 'Super Admin', description: 'Platform-wide access with full control over all companies and settings', category: 'platform' },

  // Vendor Organization Roles
  { name: 'company_admin', displayName: 'Company Admin', description: 'Full access within own company, manages users, settings, and operations', category: 'vendor' },
  { name: 'maintenance_manager', displayName: 'Maintenance Manager', description: 'Full maintenance operations control, approves work orders and manages schedules', category: 'vendor' },
  { name: 'maintenance_supervisor', displayName: 'Maintenance Supervisor', description: 'Team supervision and approval, reviews technician work', category: 'vendor' },
  { name: 'planner_scheduler', displayName: 'Planner/Scheduler', description: 'Work planning and scheduling, manages PM schedules and dispatching', category: 'vendor' },
  { name: 'technician', displayName: 'Technician', description: 'Field execution and updates, completes work orders and requests parts', category: 'vendor' },
  { name: 'storekeeper', displayName: 'Storekeeper', description: 'Inventory management, handles stock issuance and returns', category: 'vendor' },
  { name: 'reliability_engineer', displayName: 'Reliability Engineer', description: 'Predictive maintenance and analysis, monitors asset performance', category: 'vendor' },
  { name: 'finance_controller', displayName: 'Finance/Controller', description: 'Financial oversight, reviews costs and approves purchases', category: 'vendor' },

  // Client Organization Roles
  { name: 'requester', displayName: 'Requester', description: 'Submit work requests and track status', category: 'client' },
  { name: 'viewer', displayName: 'Viewer', description: 'Read-only access to view work orders, assets, and reports', category: 'client' },
  { name: 'manager', displayName: 'Manager', description: 'General management access with CRUD on main modules', category: 'client' },
];

export const RoleManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Create Role modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    isSystemRole: false,
  });

  // Edit Role modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    isSystemRole: false,
  });

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  // Column ordering state
  const [columnOrder, setColumnOrder] = useState(['name', 'description', 'category', 'type', 'permissions', 'actions']);

  // Accordion state for permission modules
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch roles from API
      const rolesResponse = await roleApi.getAll();
      // Handle both wrapped { success, data } and direct array responses
      const rolesData = Array.isArray(rolesResponse)
        ? rolesResponse
        : (rolesResponse.data || rolesResponse);

      // Merge API roles with system role definitions for display name and description
      const enhancedRoles = (Array.isArray(rolesData) ? rolesData : []).map((role: any) => {
        const systemRole = SYSTEM_ROLES.find(sr => sr.name === role.name);
        return {
          ...role,
          displayName: systemRole?.displayName || role.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          description: systemRole?.description || 'Custom role',
          category: systemRole?.category || 'custom',
        };
      });

      setRoles(enhancedRoles);

      // Using sample permissions data for demonstration
      // In production, this would fetch from: await permissionApi.getAll();
      const samplePermissions: Permission[] = [
        { id: '1', code: 'users:view', module: 'users', action: 'view', description: 'View user list and details', isActive: true },
        { id: '2', code: 'users:create', module: 'users', action: 'create', description: 'Create new users', isActive: true },
        { id: '3', code: 'users:edit', module: 'users', action: 'edit', description: 'Edit existing users', isActive: true },
        { id: '4', code: 'users:delete', module: 'users', action: 'delete', description: 'Delete users', isActive: true },
        { id: '5', code: 'roles:view', module: 'roles', action: 'view', description: 'View roles and permissions', isActive: true },
        { id: '6', code: 'roles:create', module: 'roles', action: 'create', description: 'Create new roles', isActive: true },
        { id: '7', code: 'roles:edit', module: 'roles', action: 'edit', description: 'Edit role permissions', isActive: true },
        { id: '8', code: 'roles:delete', module: 'roles', action: 'delete', description: 'Delete roles', isActive: true },
        { id: '9', code: 'companies:view', module: 'companies', action: 'view', description: 'View company information', isActive: true },
        { id: '10', code: 'companies:create', module: 'companies', action: 'create', description: 'Create new companies', isActive: true },
        { id: '11', code: 'companies:edit', module: 'companies', action: 'edit', description: 'Edit company details', isActive: true },
        { id: '12', code: 'companies:delete', module: 'companies', action: 'delete', description: 'Delete companies', isActive: true },
        { id: '13', code: 'assets:view', module: 'assets', action: 'view', description: 'View asset inventory', isActive: true },
        { id: '14', code: 'assets:create', module: 'assets', action: 'create', description: 'Add new assets', isActive: true },
        { id: '15', code: 'assets:edit', module: 'assets', action: 'edit', description: 'Modify asset information', isActive: true },
        { id: '16', code: 'assets:delete', module: 'assets', action: 'delete', description: 'Remove assets', isActive: true },
        { id: '17', code: 'work_orders:view', module: 'work_orders', action: 'view', description: 'View work orders', isActive: true },
        { id: '18', code: 'work_orders:create', module: 'work_orders', action: 'create', description: 'Create work orders', isActive: true },
        { id: '19', code: 'work_orders:edit', module: 'work_orders', action: 'edit', description: 'Update work orders', isActive: true },
        { id: '20', code: 'work_orders:delete', module: 'work_orders', action: 'delete', description: 'Delete work orders', isActive: true },
      ];

      setAllPermissions(samplePermissions);

      // Group permissions by module
      const grouped: GroupedPermissions = {};
      samplePermissions.forEach((permission: Permission) => {
        if (!grouped[permission.module]) {
          grouped[permission.module] = [];
        }
        grouped[permission.module].push(permission);
      });
      setGroupedPermissions(grouped);
    } catch (err: any) {
      console.error('Error loading data:', err);
      showToast('error', err.response?.data?.message || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (role: Role) => {
    setSelectedRole(role);

    try {
      // For sample roles, simulate permission assignment
      // In production, this would fetch from: await permissionApi.getRolePermissions(role.id);

      // Simulate different permission sets for different roles
      let simulatedPermissions: string[] = [];
      if (role.name === 'SUPER_ADMIN') {
        simulatedPermissions = allPermissions.map(p => p.id);
      } else if (role.name === 'COMPANY_ADMIN') {
        simulatedPermissions = allPermissions.slice(0, Math.floor(allPermissions.length * 0.7)).map(p => p.id);
      } else if (role.name === 'MANAGER') {
        simulatedPermissions = allPermissions.slice(0, Math.floor(allPermissions.length * 0.5)).map(p => p.id);
      } else {
        simulatedPermissions = allPermissions.slice(0, Math.floor(allPermissions.length * 0.3)).map(p => p.id);
      }

      setSelectedPermissionIds(new Set(simulatedPermissions));
      setIsModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load role permissions');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    setSelectedPermissionIds(new Set());
  };

  const handleTogglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissionIds);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissionIds(newSelected);
  };

  const handleSelectAllModule = (module: string) => {
    const modulePermissionIds = groupedPermissions[module].map((p) => p.id);
    const newSelected = new Set(selectedPermissionIds);

    // Check if all module permissions are selected
    const allSelected = modulePermissionIds.every((id) => newSelected.has(id));

    if (allSelected) {
      // Deselect all
      modulePermissionIds.forEach((id) => newSelected.delete(id));
    } else {
      // Select all
      modulePermissionIds.forEach((id) => newSelected.add(id));
    }

    setSelectedPermissionIds(newSelected);
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      // Simulate API call with mock data
      // In production, this would call: await permissionApi.assignToRole(selectedRole.id, Array.from(selectedPermissionIds));
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      showToast('success', `Successfully updated permissions for ${selectedRole.name} - ${selectedPermissionIds.size} permissions assigned`);
      handleCloseModal();
    } catch (err: any) {
      showToast('error', 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Add permission count to roles for display
  const rolesWithCount = roles.map(role => ({
    ...role,
    permissionCount: role.permissions?.length || 0,
  }));

  const filteredRoles = rolesWithCount.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  // Column reordering functions
  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setColumnOrder(newOrder);
  };

  const getColumnLabel = (col: string) => {
    const labels: { [key: string]: string } = {
      name: 'Role Name',
      description: 'Description',
      category: 'Category',
      type: 'Type',
      permissions: 'Permissions',
      actions: 'Actions'
    };
    return labels[col] || col;
  };

  const getCategoryBadge = (category: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      platform: { bg: 'bg-red-100', text: 'text-red-700', label: 'Platform' },
      vendor: { bg: 'bg-green-100', text: 'text-green-700', label: 'Vendor' },
      client: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Client' },
      custom: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Custom' },
    };
    return badges[category] || badges.custom;
  };

  // Toggle accordion module
  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  // Toast notification functions
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Create Role handlers
  const handleOpenCreateModal = () => {
    setCreateFormData({ name: '', isSystemRole: false });
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormData({ name: '', isSystemRole: false });
  };

  const handleCreateRole = async () => {
    if (!createFormData.name.trim()) {
      showToast('error', 'Role name is required');
      return;
    }

    setSaving(true);
    try {
      await roleApi.create({
        name: createFormData.name,
        isSystemRole: createFormData.isSystemRole,
      });
      showToast('success', `Role "${createFormData.name}" created successfully`);
      handleCloseCreateModal();
      // Refresh the roles list
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  // Edit Role handlers
  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setEditFormData({
      name: role.name,
      isSystemRole: role.isSystemRole,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRole(null);
    setEditFormData({ name: '', isSystemRole: false });
  };

  const handleUpdateRole = async () => {
    if (!editFormData.name.trim()) {
      showToast('error', 'Role name is required');
      return;
    }

    if (!editingRole) return;

    setSaving(true);
    try {
      await roleApi.update(editingRole.id, {
        name: editFormData.name,
        isSystemRole: editFormData.isSystemRole,
      });
      showToast('success', `Role "${editFormData.name}" updated successfully`);
      handleCloseEditModal();
      // Refresh the roles list
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  // Delete Role handlers
  const handleDeleteRole = (role: any) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      await roleApi.delete(roleToDelete.id);
      showToast('success', `Role "${roleToDelete.name}" deleted successfully`);
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
      // Refresh the roles list
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRoleToDelete(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}
              </span>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                + New Role
              </button>
            </div>
          </div>
        </div>

        {/* Table View - Minimalist Design */}
        {filteredRoles.length > 0 ? (
          <div>
            {/* Table Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-end gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredRoles.length)} of {filteredRoles.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {columnOrder.map((col, index) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getColumnLabel(col)}</span>
                          {index > 0 && (
                            <button
                              onClick={() => moveColumn(index, index - 1)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Move left"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {index < columnOrder.length - 1 && (
                            <button
                              onClick={() => moveColumn(index, index + 1)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Move right"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      {columnOrder.map((col) => (
                        <td key={col} className="px-4 py-3 text-sm">
                          {col === 'name' && (
                            <div>
                              <span className="font-medium text-gray-900">{(role as any).displayName || role.name}</span>
                              <span className="block text-xs text-gray-400 font-mono">{role.name}</span>
                            </div>
                          )}
                          {col === 'description' && (
                            <span className="text-gray-600 text-xs max-w-xs truncate block" title={(role as any).description}>
                              {(role as any).description || '-'}
                            </span>
                          )}
                          {col === 'category' && (
                            <span className={`inline-block px-2 py-1 text-xs rounded ${getCategoryBadge((role as any).category).bg} ${getCategoryBadge((role as any).category).text}`}>
                              {getCategoryBadge((role as any).category).label}
                            </span>
                          )}
                          {col === 'type' && (
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              role.isSystemRole
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {role.isSystemRole ? 'System' : 'Custom'}
                            </span>
                          )}
                          {col === 'permissions' && (
                            <span className="text-gray-600">{role.permissionCount} permissions</span>
                          )}
                          {col === 'actions' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(role as any)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                                title="Manage Permissions"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => handleEditRole(role)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit Role"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete Role"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Rows per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No roles found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm ? `No roles match "${searchTerm}"` : 'No roles available'}
            </p>
          </div>
        )}
      </div>

      {/* Permission Assignment Modal - Minimalist Slide from Right */}
      {isModalOpen && selectedRole && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={handleCloseModal}
          />

          {/* Slide-in Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl animate-slide-in-right">
            <div className="h-full bg-white shadow-lg flex flex-col">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Assign Permissions
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedRole.name} • {selectedPermissionIds.size} of {allPermissions.length} selected
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-2">
                  {Object.keys(groupedPermissions).map((module) => {
                    const modulePermissions = groupedPermissions[module];
                    const selectedCount = modulePermissions.filter((p) =>
                      selectedPermissionIds.has(p.id)
                    ).length;
                    const allSelected = selectedCount === modulePermissions.length;
                    const isExpanded = expandedModules.has(module);

                    return (
                      <div key={module} className="border border-gray-200 rounded overflow-hidden">
                        {/* Accordion Header */}
                        <button
                          onClick={() => toggleModule(module)}
                          className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className={`w-4 h-4 text-gray-500 transition-transform ${
                                isExpanded ? 'transform rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {module.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded border border-gray-200">
                            {selectedCount} / {modulePermissions.length}
                          </span>
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-200">
                            <div className="p-4 bg-white">
                              {/* Select All Checkbox */}
                              <div className="flex items-center pb-3 mb-3 border-b border-gray-100">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  onChange={() => handleSelectAllModule(module)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                                <label className="ml-3 text-sm font-medium text-gray-700">
                                  Select All
                                </label>
                              </div>

                              {/* Permissions List */}
                              <div className="space-y-2">
                                {modulePermissions.map((permission) => (
                                  <div key={permission.id} className="flex items-start py-2 hover:bg-gray-50 px-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissionIds.has(permission.id)}
                                      onChange={() => handleTogglePermission(permission.id)}
                                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex-1">
                                      <label className="text-sm font-medium text-gray-900">
                                        {permission.code}
                                      </label>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Role Modal - Slide from Right */}
      {isCreateModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={handleCloseCreateModal}
          />

          {/* Slide-in Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-slide-in-right">
            <div className="h-full bg-white shadow-lg flex flex-col">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Create New Role
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a new role to your organization
                  </p>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="space-y-4">
                  {/* Role Name */}
                  <div>
                    <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="roleName"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      placeholder="e.g., SUPER_ADMIN, MANAGER"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use uppercase with underscores for system roles
                    </p>
                  </div>

                  {/* System Role Checkbox */}
                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={createFormData.isSystemRole}
                        onChange={(e) => setCreateFormData({ ...createFormData, isSystemRole: e.target.checked })}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">System Role</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          System roles are available across all companies and cannot be deleted by company admins
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-900">
                        <p className="font-medium">What's next?</p>
                        <p className="text-xs mt-1">
                          After creating the role, you can assign specific permissions by clicking the "Manage" button in the roles table.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={saving || !createFormData.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Role Modal - Slide from Right */}
      {isEditModalOpen && editingRole && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={handleCloseEditModal}
          />

          {/* Slide-in Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-slide-in-right">
            <div className="h-full bg-white shadow-lg flex flex-col">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Edit Role
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Update role information
                  </p>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="space-y-4">
                  {/* Role Name */}
                  <div>
                    <label htmlFor="editRoleName" className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="editRoleName"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="e.g., SUPER_ADMIN, MANAGER"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use uppercase with underscores for system roles
                    </p>
                  </div>

                  {/* System Role Checkbox */}
                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={editFormData.isSystemRole}
                        onChange={(e) => setEditFormData({ ...editFormData, isSystemRole: e.target.checked })}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">System Role</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          System roles are available across all companies and cannot be deleted by company admins
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Info Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-amber-900">
                        <p className="font-medium">Be careful!</p>
                        <p className="text-xs mt-1">
                          Changing role properties may affect users who are assigned this role. Existing permissions will remain unchanged.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={saving || !editFormData.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Toast */}
      {showDeleteConfirm && roleToDelete && (
        <div className="fixed top-4 right-4 z-50 min-w-[400px] max-w-md animate-slide-in-right">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900">Confirm Deletion</h3>
                <p className="text-sm text-red-800 mt-1">
                  Are you sure you want to delete the role <span className="font-semibold">"{roleToDelete.name}"</span>? This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Yes, Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <button
                onClick={handleCancelDelete}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in-right ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            }`}
          >
            {/* Icon */}
            {toast.type === 'success' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'warning' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {/* Message */}
            <p className="text-sm font-medium flex-1">{toast.message}</p>

            {/* Close button */}
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-current hover:opacity-70"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
