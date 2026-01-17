import { useState, useEffect } from 'react';
import { api } from '../services/api';

// Types matching the README matrix
interface PermissionLevel {
  level: 'none' | 'view' | 'create' | 'edit' | 'delete' | 'full' | 'custom';
  customActions?: string[];
  description?: string;
}

interface RolePermission {
  roleId: string;
  roleName: string;
  roleDescription: string;
  isSystemRole: boolean;
  permissions: Record<string, PermissionLevel>;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// All available actions for permissions
const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View', description: 'Read-only access' },
  { key: 'create', label: 'Create', description: 'Add new items' },
  { key: 'edit', label: 'Edit', description: 'Modify existing items' },
  { key: 'delete', label: 'Delete', description: 'Remove items' },
  { key: 'approve', label: 'Approve', description: 'Approve/reject items' },
  { key: 'assign', label: 'Assign', description: 'Assign to users/teams' },
  { key: 'execute', label: 'Execute', description: 'Execute work orders' },
  { key: 'schedule', label: 'Schedule', description: 'Schedule tasks' },
  { key: 'dispatch', label: 'Dispatch', description: 'Dispatch technicians' },
  { key: 'configure', label: 'Configure', description: 'Configure settings' },
  { key: 'adjust', label: 'Adjust', description: 'Adjust inventory levels' },
  { key: 'reserve', label: 'Reserve', description: 'Reserve inventory' },
  { key: 'request', label: 'Request', description: 'Request items' },
  { key: 'export', label: 'Export', description: 'Export data' },
  { key: 'manage', label: 'Manage', description: 'Full management access' },
  { key: 'full_access', label: 'Full Access', description: 'Complete access' },
];

// Modules from README matrix
const PERMISSION_MODULES = [
  { key: 'company_management', label: 'Company Management', description: 'Manage companies and organizations' },
  { key: 'asset_management', label: 'Asset Management', description: 'Manage physical assets and equipment' },
  { key: 'work_order_management', label: 'Work Orders', description: 'Manage work orders and requests' },
  { key: 'pm_schedules', label: 'PM Schedules', description: 'Preventive maintenance scheduling' },
  { key: 'inventory', label: 'Inventory', description: 'Inventory and stock management' },
  { key: 'mobile', label: 'Mobile', description: 'Mobile app access' },
  { key: 'reporting', label: 'Reporting', description: 'Reports and analytics access' },
  { key: 'user_management', label: 'User Management', description: 'Manage users and invitations' },
  { key: 'billing', label: 'Billing', description: 'Billing and subscription management' },
];

// Default role permissions based on README matrix
const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    roleId: 'super_admin',
    roleName: 'Super Administrator',
    roleDescription: 'Full platform access',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'full', description: 'CRUD' },
      asset_management: { level: 'full', description: 'CRUD' },
      work_order_management: { level: 'full', description: 'CRUD' },
      pm_schedules: { level: 'full', description: 'CRUD' },
      inventory: { level: 'full', description: 'CRUD' },
      mobile: { level: 'full', description: 'Full Access' },
      reporting: { level: 'full', description: 'All Access' },
      user_management: { level: 'full', description: 'Platform-wide' },
      billing: { level: 'full', description: 'Full Access' },
    },
  },
  {
    roleId: 'company_admin',
    roleName: 'Company Admin',
    roleDescription: 'Company-level administration',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'view', description: 'View only' },
      asset_management: { level: 'full', description: 'CRUD' },
      work_order_management: { level: 'full', description: 'CRUD' },
      pm_schedules: { level: 'full', description: 'CRUD' },
      inventory: { level: 'full', description: 'CRUD' },
      mobile: { level: 'none', description: 'Not Specified' },
      reporting: { level: 'full', description: 'All Access' },
      user_management: { level: 'custom', description: 'Company-only', customActions: ['view', 'create', 'edit', 'delete'] },
      billing: { level: 'custom', description: 'Company Billing', customActions: ['view', 'edit'] },
    },
  },
  {
    roleId: 'maintenance_manager',
    roleName: 'Maintenance Manager',
    roleDescription: 'Full maintenance operations control',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'full', description: 'Full (CRUD)' },
      work_order_management: { level: 'full', description: 'Full (CRUD)' },
      pm_schedules: { level: 'full', description: 'Full (CRUD)' },
      inventory: { level: 'custom', description: 'Adjust Levels', customActions: ['view', 'edit', 'adjust'] },
      mobile: { level: 'full', description: 'Full Access' },
      reporting: { level: 'full', description: 'All Reports' },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'maintenance_supervisor',
    roleName: 'Maintenance Supervisor',
    roleDescription: 'Team supervision and approval',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'edit', description: 'Edit' },
      work_order_management: { level: 'custom', description: 'Create, Assign, Approve', customActions: ['view', 'create', 'edit', 'assign', 'approve'] },
      pm_schedules: { level: 'edit', description: 'Edit Schedules' },
      inventory: { level: 'view', description: 'View All' },
      mobile: { level: 'full', description: 'Full Access' },
      reporting: { level: 'custom', description: 'Team/Department', customActions: ['view'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'planner_scheduler',
    roleName: 'Planner/Scheduler',
    roleDescription: 'Work planning and scheduling',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'view', description: 'View' },
      work_order_management: { level: 'custom', description: 'Schedule, Dispatch', customActions: ['view', 'edit', 'schedule', 'dispatch'] },
      pm_schedules: { level: 'custom', description: 'Create/Edit', customActions: ['view', 'create', 'edit'] },
      inventory: { level: 'custom', description: 'Reserve Parts', customActions: ['view', 'reserve'] },
      mobile: { level: 'view', description: 'View' },
      reporting: { level: 'custom', description: 'Scheduling Reports', customActions: ['view'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'technician',
    roleName: 'Technician',
    roleDescription: 'Field execution and updates',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'view', description: 'View Assigned' },
      work_order_management: { level: 'custom', description: 'Execute, Update', customActions: ['view', 'edit', 'execute'] },
      pm_schedules: { level: 'view', description: 'View Assigned' },
      inventory: { level: 'custom', description: 'Request Parts', customActions: ['view', 'request'] },
      mobile: { level: 'full', description: 'Full Access' },
      reporting: { level: 'custom', description: 'Personal Stats', customActions: ['view'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'storekeeper',
    roleName: 'Storekeeper',
    roleDescription: 'Inventory management',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'view', description: 'View' },
      work_order_management: { level: 'view', description: 'View Parts Req' },
      pm_schedules: { level: 'none', description: '-' },
      inventory: { level: 'full', description: 'Full (CRUD)' },
      mobile: { level: 'custom', description: 'Receiving/Issues', customActions: ['view', 'create', 'edit'] },
      reporting: { level: 'custom', description: 'Inventory Reports', customActions: ['view'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'reliability_engineer',
    roleName: 'Reliability Engineer',
    roleDescription: 'Predictive maintenance and analysis',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'full', description: 'Full (CRUD)' },
      work_order_management: { level: 'view', description: 'View' },
      pm_schedules: { level: 'custom', description: 'Configure Predictive', customActions: ['view', 'edit', 'configure'] },
      inventory: { level: 'view', description: 'View' },
      mobile: { level: 'custom', description: 'Condition Monitoring', customActions: ['view'] },
      reporting: { level: 'full', description: 'Analytics & Predictions' },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'finance_controller',
    roleName: 'Finance/Controller',
    roleDescription: 'Financial oversight',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'custom', description: 'Cost Data', customActions: ['view'] },
      work_order_management: { level: 'custom', description: 'Cost Data', customActions: ['view'] },
      pm_schedules: { level: 'custom', description: 'Budget Data', customActions: ['view'] },
      inventory: { level: 'custom', description: 'Valuation', customActions: ['view'] },
      mobile: { level: 'none', description: '-' },
      reporting: { level: 'custom', description: 'Financial Reports', customActions: ['view', 'export'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'requester',
    roleName: 'Requester',
    roleDescription: 'Submit work requests',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'view', description: 'View' },
      work_order_management: { level: 'custom', description: 'Create Requests', customActions: ['view', 'create'] },
      pm_schedules: { level: 'none', description: '-' },
      inventory: { level: 'none', description: '-' },
      mobile: { level: 'custom', description: 'Request Only', customActions: ['view', 'create'] },
      reporting: { level: 'custom', description: 'Own Requests', customActions: ['view'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'viewer',
    roleName: 'Viewer',
    roleDescription: 'Read-only access',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'view', description: 'R (Read)' },
      work_order_management: { level: 'view', description: 'R (Read)' },
      pm_schedules: { level: 'view', description: 'R (Read)' },
      inventory: { level: 'view', description: 'R (Read)' },
      mobile: { level: 'none', description: 'Not Specified' },
      reporting: { level: 'view', description: 'Limited' },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
  {
    roleId: 'manager',
    roleName: 'Manager (Generic)',
    roleDescription: 'General management access',
    isSystemRole: true,
    permissions: {
      company_management: { level: 'none', description: '-' },
      asset_management: { level: 'custom', description: 'CRU (Create, Read, Update)', customActions: ['view', 'create', 'edit'] },
      work_order_management: { level: 'full', description: 'CRUD' },
      pm_schedules: { level: 'full', description: 'CRUD' },
      inventory: { level: 'full', description: 'CRUD' },
      mobile: { level: 'none', description: 'Not Specified' },
      reporting: { level: 'custom', description: 'Custom', customActions: ['view'] },
      user_management: { level: 'none', description: '-' },
      billing: { level: 'none', description: '-' },
    },
  },
];

const getPermissionBadgeColor = (level: string) => {
  const colors: Record<string, string> = {
    full: 'bg-green-100 text-green-800 border-green-200',
    view: 'bg-blue-100 text-blue-800 border-blue-200',
    edit: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    create: 'bg-purple-100 text-purple-800 border-purple-200',
    delete: 'bg-red-100 text-red-800 border-red-200',
    custom: 'bg-orange-100 text-orange-800 border-orange-200',
    none: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return colors[level] || colors.none;
};

const getPermissionIcon = (level: string) => {
  if (level === 'full') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  if (level === 'none') {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
    </svg>
  );
};

export const PermissionManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<RolePermission | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state - default 5 records
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Create permission modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    roleId: '',
    module: '',
    actions: [] as string[],
    description: '',
  });
  const [saving, setSaving] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      // Try to load from API first
      const response = await api.get('/roles');
      const roles = response.data?.data || response.data || [];

      if (Array.isArray(roles) && roles.length > 0) {
        // Map API roles to our format
        const mappedRoles = roles.map((role: any) => {
          const defaultRole = DEFAULT_ROLE_PERMISSIONS.find(r => r.roleId === role.name || r.roleName === role.name);
          return defaultRole || {
            roleId: role.id,
            roleName: role.name,
            roleDescription: role.description || '',
            isSystemRole: role.isSystemRole || false,
            permissions: {},
          };
        });
        setRolePermissions(mappedRoles);
      } else {
        // Use default permissions
        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      }
    } catch (error) {
      console.error('Failed to load permissions, using defaults:', error);
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = rolePermissions.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.roleDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Create permission handler
  const handleCreatePermission = async () => {
    if (!createFormData.roleId || !createFormData.module || createFormData.actions.length === 0) {
      showToast('error', 'Please select a role, module, and at least one action');
      return;
    }

    setSaving(true);
    try {
      // Build the permission code
      const permissionCode = `${createFormData.module}:${createFormData.actions.join(',')}`;

      // Try to save to API
      await api.post('/permissions', {
        roleId: createFormData.roleId,
        module: createFormData.module,
        actions: createFormData.actions,
        code: permissionCode,
        description: createFormData.description || `${createFormData.actions.join(', ')} access to ${createFormData.module}`,
      });

      // Update local state
      setRolePermissions(prev => prev.map(role => {
        if (role.roleId === createFormData.roleId) {
          const newLevel = createFormData.actions.length >= 4 ? 'full' :
                           createFormData.actions.length > 1 ? 'custom' :
                           createFormData.actions[0] as any;
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [createFormData.module]: {
                level: newLevel,
                description: createFormData.description || createFormData.actions.join(', '),
                customActions: createFormData.actions,
              },
            },
          };
        }
        return role;
      }));

      showToast('success', `Permission created successfully for ${createFormData.module}`);
      setIsCreateModalOpen(false);
      setCreateFormData({ roleId: '', module: '', actions: [], description: '' });
    } catch (error) {
      console.error('Failed to create permission:', error);
      // Still update local state for demo purposes
      setRolePermissions(prev => prev.map(role => {
        if (role.roleId === createFormData.roleId) {
          const newLevel = createFormData.actions.length >= 4 ? 'full' :
                           createFormData.actions.length > 1 ? 'custom' :
                           createFormData.actions[0] as any;
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [createFormData.module]: {
                level: newLevel,
                description: createFormData.description || createFormData.actions.join(', '),
                customActions: createFormData.actions,
              },
            },
          };
        }
        return role;
      }));
      showToast('success', `Permission updated locally (API not available)`);
      setIsCreateModalOpen(false);
      setCreateFormData({ roleId: '', module: '', actions: [], description: '' });
    } finally {
      setSaving(false);
    }
  };

  const toggleAction = (action: string) => {
    setCreateFormData(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permission Matrix</h1>
        <p className="text-gray-600 mt-1">Manage role-based access control across all modules</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roles..."
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">
              {filteredRoles.length} roles total
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Permission
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-4 py-2 text-sm font-medium ${viewMode === 'matrix' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Matrix
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Permission Levels</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor('full')}`}>
              {getPermissionIcon('full')}
              Full (CRUD)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor('view')}`}>
              {getPermissionIcon('view')}
              View Only
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor('edit')}`}>
              {getPermissionIcon('edit')}
              Edit
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor('custom')}`}>
              {getPermissionIcon('custom')}
              Custom
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor('none')}`}>
              {getPermissionIcon('none')}
              No Access
            </span>
          </div>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        /* Matrix View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-r border-gray-200 min-w-[200px]">
                    Role
                  </th>
                  {PERMISSION_MODULES.map((module) => (
                    <th
                      key={module.key}
                      className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[120px]"
                      title={module.description}
                    >
                      <div className="flex flex-col items-center">
                        <span>{module.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRoles.map((role, idx) => (
                  <tr
                    key={role.roleId}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <td className="sticky left-0 z-10 px-4 py-3 border-r border-gray-200 bg-inherit">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{role.roleName}</span>
                        <span className="text-xs text-gray-500">{role.roleDescription}</span>
                      </div>
                    </td>
                    {PERMISSION_MODULES.map((module) => {
                      const permission = role.permissions[module.key] || { level: 'none', description: '-' };
                      return (
                        <td key={module.key} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor(permission.level)}`}
                              title={permission.description}
                            >
                              {getPermissionIcon(permission.level)}
                              {permission.level === 'full' ? 'CRUD' : permission.level === 'none' ? '-' : permission.level.charAt(0).toUpperCase() + permission.level.slice(1)}
                            </span>
                            {permission.description && permission.description !== '-' && (
                              <span className="text-[10px] text-gray-500 max-w-[100px] truncate" title={permission.description}>
                                {permission.description}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
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
              <span className="text-sm text-gray-500 ml-2">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredRoles.length)} of {filteredRoles.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="px-3 py-1 text-sm text-gray-600">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
        /* List View */
        <div className="grid gap-4">
          {filteredRoles.map((role) => (
            <div
              key={role.roleId}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-blue-300 cursor-pointer transition-colors"
              onClick={() => setSelectedRole(role)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.roleName}</h3>
                  <p className="text-sm text-gray-600">{role.roleDescription}</p>
                </div>
                {role.isSystemRole && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">System Role</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_MODULES.map((module) => {
                  const permission = role.permissions[module.key] || { level: 'none', description: '-' };
                  if (permission.level === 'none') return null;
                  return (
                    <div
                      key={module.key}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border ${getPermissionBadgeColor(permission.level)}`}
                    >
                      <span className="font-semibold">{module.label}:</span>
                      <span>{permission.description || permission.level}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Detail Modal */}
      {selectedRole && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setSelectedRole(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg">
            <div className="h-full bg-white shadow-xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedRole.roleName}</h2>
                    <p className="text-sm text-gray-600">{selectedRole.roleDescription}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Module Permissions</h3>
                <div className="space-y-4">
                  {PERMISSION_MODULES.map((module) => {
                    const permission = selectedRole.permissions[module.key] || { level: 'none', description: '-' };
                    return (
                      <div key={module.key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{module.label}</h4>
                            <p className="text-xs text-gray-500">{module.description}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPermissionBadgeColor(permission.level)}`}>
                            {getPermissionIcon(permission.level)}
                            {permission.level === 'full' ? 'Full Access' : permission.level === 'none' ? 'No Access' : permission.level.charAt(0).toUpperCase() + permission.level.slice(1)}
                          </span>
                        </div>
                        {permission.description && permission.description !== '-' && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Access:</span> {permission.description}
                          </p>
                        )}
                        {permission.customActions && permission.customActions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {permission.customActions.map((action) => (
                              <span key={action} className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded text-gray-600">
                                {action}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Permission Slide-in Modal */}
      {isCreateModalOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setIsCreateModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg animate-slide-in-right">
            <div className="h-full bg-white shadow-xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Create Permission</h2>
                  <p className="text-sm text-gray-600">Assign a new permission to a role</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createFormData.roleId}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, roleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a role --</option>
                    {rolePermissions.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Module <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createFormData.module}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a module --</option>
                    {PERMISSION_MODULES.map((module) => (
                      <option key={module.key} value={module.key}>
                        {module.label} - {module.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Actions <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {PERMISSION_ACTIONS.map((action) => (
                      <label
                        key={action.key}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          createFormData.actions.includes(action.key)
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-white border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={createFormData.actions.includes(action.key)}
                          onChange={() => toggleAction(action.key)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{action.label}</span>
                          <span className="block text-xs text-gray-500">{action.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {createFormData.actions.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {createFormData.actions.join(', ')}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Brief description of this permission..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePermission}
                  disabled={saving || !createFormData.roleId || !createFormData.module || createFormData.actions.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Save Permission
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
