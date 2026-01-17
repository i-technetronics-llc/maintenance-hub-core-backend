import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use relative URL in development to leverage Vite's proxy (avoids CORS issues)
// In production, set VITE_API_BASE_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============= TYPES =============

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    company: {
      id: string;
      name: string;
      type: string;
    } | null;
    isSuperAdmin: boolean;
  };
}

export interface Company {
  id: string;
  name: string;
  type: string;
  website: string;
  workEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  verifiedDomain?: string;
  isDomainVerified: boolean;
  status: string;
  emailValidationMode: string;
  createdAt: string;
  approvedAt?: string;
}

export interface DomainVerification {
  id: string;
  companyId: string;
  domain: string;
  verificationHash: string;
  verificationFileName: string;
  status: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  attemptCount: number;
  failureReason?: string;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  companyId: string;
  status: string;
  isActive: boolean;
  invitationAccepted?: boolean;
  createdAt: string;
}

export interface Inventory {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unit?: string;
  unitPrice?: number;
  location?: string;
  supplier?: string;
  manufacturer?: string;
  partNumber?: string;
  status: string;
  organizationId?: string;
  specifications?: Record<string, any>;
  lastRestockDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  companyId?: string;
  module: string;
  key: string;
  value: any;
  description?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============= INVENTORY MASTER TYPES =============

export interface InventoryLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  building?: string;
  floor?: string;
  room?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  parentLocationId?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  rating?: number;
  isActive: boolean;
  isPreferred: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentCategoryId?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  unitPrice?: number;
  unit?: string;
  estimatedDuration?: number;
  isActive: boolean;
  organizationId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============= PRICE BOOK TYPES =============

export interface PriceBookItem {
  id: string;
  priceBookId: string;
  itemId: string;
  itemType: 'inventory' | 'service';
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  unit?: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PriceBook {
  id: string;
  organizationId: string;
  organization?: Company;
  name: string;
  description?: string;
  effectiveDate: string;
  expiryDate?: string;
  isDefault: boolean;
  isActive: boolean;
  items?: PriceBookItem[];
  createdAt: string;
  updatedAt: string;
}

// ============= BOQ TYPES =============

export interface BOQItem {
  id: string;
  boqId: string;
  itemType: 'inventory' | 'service' | 'custom';
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  inventoryPrice?: number;
  priceBookPrice?: number;
  enteredPrice: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BOQ {
  id: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  organizationId: string;
  boqNumber: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  items: BOQItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  totalAmount: number;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============= SUBSCRIPTION TYPES =============

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'inactive' | 'deprecated';
  maxUsers: number;
  maxAssets: number;
  maxWorkOrders: number;
  maxInventoryItems: number;
  storageLimit: number;
  features: {
    apiAccess?: boolean;
    advancedReporting?: boolean;
    customBranding?: boolean;
    prioritySupport?: boolean;
    multiLocation?: boolean;
    integrations?: boolean;
    auditLogs?: boolean;
    customRoles?: boolean;
    [key: string]: boolean | undefined;
  };
  isDefault: boolean;
  isTrial: boolean;
  trialDays: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  company?: Company;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  currentUsers: number;
  currentAssets: number;
  currentWorkOrders: number;
  currentInventoryItems: number;
  storageUsed: number;
  currentPrice?: number;
  nextBillingDate?: string;
  lastBillingDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUsage {
  current: number;
  max: number;
  percentage: number;
}

// ============= ANALYTICS TYPES =============

export interface WorkOrderStats {
  total: number;
  breakdown: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  overdue: number;
  completedThisMonth: number;
  avgCompletionTime: number | null;
}

export interface AssetStats {
  total: number;
  breakdown: Record<string, number>;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  underMaintenance: number;
  warrantyExpiringSoon: number;
}

export interface InventoryStats {
  total: number;
  breakdown: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export interface UserStats {
  total: number;
  breakdown: Record<string, number>;
  byStatus: Record<string, number>;
  byRole: Record<string, number>;
  activeUsers: number;
  pendingInvitations: number;
}

export interface DashboardAnalytics {
  workOrders: WorkOrderStats;
  assets: AssetStats;
  inventory: InventoryStats;
  users: UserStats;
  recentActivity: {
    recentWorkOrders: any[];
    recentAssets: any[];
  };
  trends: {
    workOrdersThisWeek: number;
    workOrdersLastWeek: number;
    workOrdersTrend: number;
  };
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface InventoryTrendDataPoint {
  category: string;
  count: number;
  value: number;
}

// ============= AUTH API =============

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    // Backend wraps response in { success, data, timestamp } structure
    return response.data.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// ============= COMPANY API =============

export const companyApi = {
  // Self-service registration (public)
  register: async (data: any) => {
    const response = await api.post('/companies/register', data);
    return response.data;
  },

  // Get all companies (super-admin)
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }) => {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  // Get company by ID
  getById: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Create company (super-admin)
  create: async (data: any) => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  // Update company
  update: async (id: string, data: any) => {
    const response = await api.patch(`/companies/${id}`, data);
    return response.data;
  },

  // Approve company
  approve: async (id: string) => {
    const response = await api.post(`/companies/${id}/approve`);
    return response.data;
  },

  // Reject company
  reject: async (id: string, reason: string) => {
    const response = await api.post(`/companies/${id}/reject`, { reason });
    return response.data;
  },

  // Suspend company
  suspend: async (id: string) => {
    const response = await api.post(`/companies/${id}/suspend`);
    return response.data;
  },

  // Activate company
  activate: async (id: string) => {
    const response = await api.post(`/companies/${id}/activate`);
    return response.data;
  },

  // Update email validation mode
  updateEmailValidationMode: async (id: string, mode: string) => {
    const response = await api.patch(`/companies/${id}/email-validation-mode`, {
      emailValidationMode: mode,
    });
    return response.data;
  },

  // Get company statistics
  getStatistics: async () => {
    const response = await api.get('/companies/statistics');
    return response.data;
  },

  // Get pending approval companies
  getPendingApproval: async () => {
    const response = await api.get('/companies/pending-approval');
    return response.data;
  },
};

// ============= DOMAIN VERIFICATION API =============

export const domainVerificationApi = {
  // Initiate domain verification
  initiate: async (companyId: string) => {
    const response = await api.post('/domain-verification/initiate', { companyId });
    return response.data;
  },

  // Manually verify domain ("Verify Now" button)
  verify: async (verificationId: string) => {
    const response = await api.post(`/domain-verification/${verificationId}/verify`);
    return response.data;
  },

  // Get verification status for company
  getStatus: async (companyId: string) => {
    const response = await api.get(`/domain-verification/company/${companyId}/status`);
    return response.data;
  },

  // Get verification by ID
  getById: async (id: string) => {
    const response = await api.get(`/domain-verification/${id}`);
    return response.data;
  },

  // Retry verification
  retry: async (verificationId: string) => {
    const response = await api.post(`/domain-verification/${verificationId}/retry`);
    return response.data;
  },

  // Get verification instructions
  getInstructions: async (verificationId: string) => {
    const response = await api.get(`/domain-verification/${verificationId}/instructions`);
    return response.data;
  },
};

// ============= PERMISSION API =============

export const permissionApi = {
  // Get all permissions
  getAll: async (grouped?: boolean) => {
    const response = await api.get('/permissions', {
      params: { grouped },
    });
    return response.data;
  },

  // Get permissions grouped by module
  getGrouped: async () => {
    const response = await api.get('/permissions/grouped');
    return response.data;
  },

  // Get permissions by module
  getByModule: async (module: string) => {
    const response = await api.get(`/permissions/module/${module}`);
    return response.data;
  },

  // Get permission by ID
  getById: async (id: string) => {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  },

  // Create permission
  create: async (data: any) => {
    const response = await api.post('/permissions', data);
    return response.data;
  },

  // Update permission
  update: async (id: string, data: any) => {
    const response = await api.patch(`/permissions/${id}`, data);
    return response.data;
  },

  // Delete permission
  delete: async (id: string) => {
    await api.delete(`/permissions/${id}`);
  },

  // Assign permissions to role
  assignToRole: async (roleId: string, permissionIds: string[]) => {
    const response = await api.post('/permissions/assign-to-role', {
      roleId,
      permissionIds,
    });
    return response.data;
  },

  // Get permissions for role
  getRolePermissions: async (roleId: string) => {
    const response = await api.get(`/permissions/role/${roleId}`);
    return response.data;
  },

  // Add permissions to role
  addToRole: async (roleId: string, permissionIds: string[]) => {
    const response = await api.post(`/permissions/role/${roleId}/add`, {
      permissionIds,
    });
    return response.data;
  },

  // Remove permissions from role
  removeFromRole: async (roleId: string, permissionIds: string[]) => {
    const response = await api.post(`/permissions/role/${roleId}/remove`, {
      permissionIds,
    });
    return response.data;
  },
};

// ============= ROLE API =============

export const roleApi = {
  // Get all roles
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data?.data || response.data || [];
  },

  // Get role by ID
  getById: async (id: string) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  // Create role
  create: async (data: { name: string; isSystemRole: boolean }) => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  // Update role
  update: async (id: string, data: { name?: string; isSystemRole?: boolean }) => {
    const response = await api.patch(`/roles/${id}`, data);
    return response.data;
  },

  // Delete role
  delete: async (id: string) => {
    await api.delete(`/roles/${id}`);
  },
};

// ============= USER API =============

export const userApi = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/users');
    return response.data?.data || response.data || [];
  },

  // Get user by ID
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: any) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string) => {
    await api.delete(`/users/${id}`);
  },

  // Invite employee
  invite: async (data: {
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    phone?: string;
    department?: string;
    permissions?: string[];
  }) => {
    const response = await api.post('/users/invite', data);
    return response.data;
  },

  // Accept invitation (public)
  acceptInvitation: async (token: string, password: string) => {
    const response = await api.post('/users/accept-invitation', {
      token,
      password,
    });
    return response.data;
  },

  // Resend invitation
  resendInvitation: async (userId: string) => {
    const response = await api.post(`/users/${userId}/resend-invitation`);
    return response.data;
  },

  // Cancel invitation
  cancelInvitation: async (userId: string) => {
    await api.delete(`/users/${userId}/invitation`);
  },

  // Get pending invitations for company
  getPendingInvitations: async (companyId: string) => {
    const response = await api.get(`/users/company/${companyId}/pending-invitations`);
    return response.data;
  },
};

// ============= INVENTORY API =============

export const inventoryApi = {
  // Get all inventory items
  getAll: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    companyId?: string;
    organizationId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  // Get inventory by ID
  getById: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Get inventory by SKU
  getBySku: async (sku: string) => {
    const response = await api.get(`/inventory/sku/${sku}`);
    return response.data;
  },

  // Create inventory
  create: async (data: Partial<Inventory>) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  // Update inventory
  update: async (id: string, data: Partial<Inventory>) => {
    const response = await api.patch(`/inventory/${id}`, data);
    return response.data;
  },

  // Delete inventory
  delete: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },

  // Adjust inventory quantity
  adjustQuantity: async (id: string, adjustment: number) => {
    const response = await api.patch(`/inventory/${id}/adjust`, { adjustment });
    return response.data;
  },

  // Get low stock items
  getLowStock: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  // Check availability
  checkAvailability: async (itemIds: string[]) => {
    const response = await api.post('/inventory/check-availability', { itemIds });
    return response.data;
  },
};

// ============= SETTINGS API =============

export const settingsApi = {
  // Get all settings
  getAll: async (params?: { module?: string; companyId?: string }) => {
    const response = await api.get('/settings', { params });
    return response.data;
  },

  // Get setting by ID
  getById: async (id: string) => {
    const response = await api.get(`/settings/${id}`);
    return response.data;
  },

  // Get setting by module and key
  getByModuleAndKey: async (module: string, key: string, companyId?: string) => {
    const response = await api.get(`/settings/module/${module}/key/${key}`, {
      params: { companyId },
    });
    return response.data;
  },

  // Get all modules
  getModules: async () => {
    const response = await api.get('/settings/modules');
    return response.data;
  },

  // Get default settings
  getDefaults: async () => {
    const response = await api.get('/settings/defaults');
    return response.data;
  },

  // Create setting
  create: async (data: Partial<Setting>) => {
    const response = await api.post('/settings', data);
    return response.data;
  },

  // Update setting
  update: async (id: string, data: Partial<Setting>) => {
    const response = await api.patch(`/settings/${id}`, data);
    return response.data;
  },

  // Upsert setting
  upsert: async (data: Partial<Setting>) => {
    const response = await api.post('/settings/upsert', data);
    return response.data;
  },

  // Delete setting
  delete: async (id: string) => {
    await api.delete(`/settings/${id}`);
  },

  // Initialize default settings
  initializeDefaults: async (companyId?: string) => {
    const response = await api.post('/settings/initialize', {}, {
      params: companyId ? { companyId } : undefined,
    });
    return response.data;
  },
};

// ============= ANALYTICS API =============

export const analyticsApi = {
  // Get comprehensive dashboard analytics
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await api.get('/analytics/dashboard');
    return response.data.data;
  },

  // Get work order statistics
  getWorkOrderStats: async (): Promise<WorkOrderStats> => {
    const response = await api.get('/analytics/work-orders');
    return response.data.data;
  },

  // Get work order trend data
  getWorkOrderTrend: async (days?: number): Promise<TrendDataPoint[]> => {
    const response = await api.get('/analytics/work-orders/trend', {
      params: { days },
    });
    return response.data.data;
  },

  // Get asset statistics
  getAssetStats: async (): Promise<AssetStats> => {
    const response = await api.get('/analytics/assets');
    return response.data.data;
  },

  // Get inventory statistics
  getInventoryStats: async (): Promise<InventoryStats> => {
    const response = await api.get('/analytics/inventory');
    return response.data.data;
  },

  // Get inventory trend data by category
  getInventoryTrend: async (): Promise<InventoryTrendDataPoint[]> => {
    const response = await api.get('/analytics/inventory/trend');
    return response.data.data;
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/analytics/users');
    return response.data.data;
  },
};

// ============= INVENTORY MASTER API =============

export const inventoryMasterApi = {
  // ==================== LOCATIONS ====================
  locations: {
    getAll: async (params?: { search?: string; isActive?: boolean }) => {
      const response = await api.get('/inventory-master/locations', { params });
      return response.data.data || response.data;
    },

    getById: async (id: string) => {
      const response = await api.get(`/inventory-master/locations/${id}`);
      return response.data.data || response.data;
    },

    create: async (data: Partial<InventoryLocation>) => {
      const response = await api.post('/inventory-master/locations', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<InventoryLocation>) => {
      const response = await api.put(`/inventory-master/locations/${id}`, data);
      return response.data.data || response.data;
    },

    delete: async (id: string) => {
      await api.delete(`/inventory-master/locations/${id}`);
    },
  },

  // ==================== MANUFACTURERS ====================
  manufacturers: {
    getAll: async (params?: { search?: string; isActive?: boolean }) => {
      const response = await api.get('/inventory-master/manufacturers', { params });
      return response.data.data || response.data;
    },

    getById: async (id: string) => {
      const response = await api.get(`/inventory-master/manufacturers/${id}`);
      return response.data.data || response.data;
    },

    create: async (data: Partial<Manufacturer>) => {
      const response = await api.post('/inventory-master/manufacturers', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<Manufacturer>) => {
      const response = await api.put(`/inventory-master/manufacturers/${id}`, data);
      return response.data.data || response.data;
    },

    delete: async (id: string) => {
      await api.delete(`/inventory-master/manufacturers/${id}`);
    },
  },

  // ==================== SUPPLIERS ====================
  suppliers: {
    getAll: async (params?: { search?: string; isActive?: boolean; isPreferred?: boolean }) => {
      const response = await api.get('/inventory-master/suppliers', { params });
      return response.data.data || response.data;
    },

    getById: async (id: string) => {
      const response = await api.get(`/inventory-master/suppliers/${id}`);
      return response.data.data || response.data;
    },

    create: async (data: Partial<Supplier>) => {
      const response = await api.post('/inventory-master/suppliers', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<Supplier>) => {
      const response = await api.put(`/inventory-master/suppliers/${id}`, data);
      return response.data.data || response.data;
    },

    delete: async (id: string) => {
      await api.delete(`/inventory-master/suppliers/${id}`);
    },
  },

  // ==================== CATEGORIES ====================
  categories: {
    getAll: async (params?: { search?: string; isActive?: boolean }) => {
      const response = await api.get('/inventory-master/categories', { params });
      return response.data.data || response.data;
    },

    getById: async (id: string) => {
      const response = await api.get(`/inventory-master/categories/${id}`);
      return response.data.data || response.data;
    },

    create: async (data: Partial<InventoryCategory>) => {
      const response = await api.post('/inventory-master/categories', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<InventoryCategory>) => {
      const response = await api.put(`/inventory-master/categories/${id}`, data);
      return response.data.data || response.data;
    },

    delete: async (id: string) => {
      await api.delete(`/inventory-master/categories/${id}`);
    },
  },

  // ==================== SERVICES ====================
  services: {
    getAll: async (params?: { search?: string; isActive?: boolean; category?: string }) => {
      const response = await api.get('/inventory-master/services', { params });
      return response.data.data || response.data;
    },

    getById: async (id: string) => {
      const response = await api.get(`/inventory-master/services/${id}`);
      return response.data.data || response.data;
    },

    create: async (data: Partial<Service>) => {
      const response = await api.post('/inventory-master/services', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<Service>) => {
      const response = await api.put(`/inventory-master/services/${id}`, data);
      return response.data.data || response.data;
    },

    delete: async (id: string) => {
      await api.delete(`/inventory-master/services/${id}`);
    },
  },
};

// ============= SUBSCRIPTIONS API =============

export const subscriptionApi = {
  // ==================== PLANS (Super Admin) ====================
  plans: {
    getAll: async (includeInactive = false): Promise<SubscriptionPlan[]> => {
      const response = await api.get('/subscriptions/plans', {
        params: { includeInactive },
      });
      return response.data.data || response.data;
    },

    getById: async (id: string): Promise<SubscriptionPlan> => {
      const response = await api.get(`/subscriptions/plans/${id}`);
      return response.data.data || response.data;
    },

    create: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
      const response = await api.post('/subscriptions/plans', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
      const response = await api.patch(`/subscriptions/plans/${id}`, data);
      return response.data.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/subscriptions/plans/${id}`);
    },

    seedDefaults: async (): Promise<SubscriptionPlan[]> => {
      const response = await api.post('/subscriptions/plans/seed');
      return response.data.data || [];
    },
  },

  // ==================== COMPANY SUBSCRIPTIONS ====================
  subscriptions: {
    getAll: async (params?: {
      companyId?: string;
      status?: string;
    }): Promise<CompanySubscription[]> => {
      const response = await api.get('/subscriptions', { params });
      return response.data.data || response.data;
    },

    getById: async (id: string): Promise<CompanySubscription> => {
      const response = await api.get(`/subscriptions/${id}`);
      return response.data.data || response.data;
    },

    getByCompanyId: async (companyId: string): Promise<CompanySubscription | null> => {
      const response = await api.get(`/subscriptions/company/${companyId}`);
      return response.data.data || null;
    },

    getMySubscription: async (): Promise<CompanySubscription & {
      usage?: Record<string, SubscriptionUsage>;
      withinLimits?: boolean;
    } | null> => {
      const response = await api.get('/subscriptions/my-subscription');
      return response.data.data || null;
    },

    checkLimits: async (companyId: string): Promise<{
      withinLimits: boolean;
      usage: Record<string, SubscriptionUsage>;
    }> => {
      const response = await api.get(`/subscriptions/company/${companyId}/limits`);
      return response.data.data;
    },

    create: async (data: {
      companyId: string;
      planId: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      currentPrice?: number;
    }): Promise<CompanySubscription> => {
      const response = await api.post('/subscriptions', data);
      return response.data.data || response.data;
    },

    update: async (id: string, data: Partial<CompanySubscription>): Promise<CompanySubscription> => {
      const response = await api.patch(`/subscriptions/${id}`, data);
      return response.data.data || response.data;
    },

    cancel: async (id: string, reason?: string): Promise<CompanySubscription> => {
      const response = await api.post(`/subscriptions/${id}/cancel`, { reason });
      return response.data.data || response.data;
    },

    changePlan: async (subscriptionId: string, planId: string): Promise<CompanySubscription> => {
      const response = await api.post(`/subscriptions/${subscriptionId}/change-plan`, { planId });
      return response.data.data || response.data;
    },
  },
};

// ============= WORK ORDER TYPES =============

export interface WorkOrder {
  id: string;
  woNumber?: string;
  title: string;
  description?: string;
  type?: string;
  priority: string;
  status: string;
  riskLevel?: string;
  urgency?: string;
  asset?: {
    id: string;
    name: string;
  };
  clientOrganization?: {
    id: string;
    name: string;
  };
  vendorOrganization?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checklist?: {
    item: string;
    completed: boolean;
    mandatory: boolean;
    itemType?: 'task' | 'product' | 'service';
    inventoryId?: string;
    inventoryName?: string;
    serviceId?: string;
    serviceName?: string;
  }[];
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedWorkOrders {
  data: WorkOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============= WORK ORDER API =============

// ============= AUDIT API =============

export interface AuditLog {
  auditId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaginatedAuditLogs> => {
    const response = await api.get('/audit', { params });
    const result = response.data?.data || response.data;
    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        limit: result.length,
        totalPages: 1,
      };
    }
    return result;
  },

  getActions: async (): Promise<string[]> => {
    const response = await api.get('/audit/actions');
    return response.data?.data || response.data || [];
  },

  getEntityTypes: async (): Promise<string[]> => {
    const response = await api.get('/audit/entity-types');
    return response.data?.data || response.data || [];
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await api.get(`/audit/${id}`);
    return response.data?.data || response.data;
  },
};

export interface RescheduleWorkOrderDto {
  scheduledDate: string;
  assignedToId?: string;
  reason?: string;
}

export interface SchedulingConflict {
  hasConflicts: boolean;
  conflicts: WorkOrder[];
  date: string;
  technicianId?: string;
}

export interface CalendarViewResponse {
  workOrders: WorkOrder[];
  dateRange: { start: string; end: string };
  technicianId?: string;
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

export const workOrderApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    companyId?: string;
  }): Promise<PaginatedWorkOrders> => {
    const response = await api.get('/work-orders', { params });
    const result = response.data?.data || response.data;
    // Handle both paginated and non-paginated responses
    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        limit: result.length,
        totalPages: 1,
      };
    }
    return result;
  },

  getById: async (id: string): Promise<WorkOrder> => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data?.data || response.data;
  },

  create: async (data: Partial<WorkOrder>): Promise<WorkOrder> => {
    const response = await api.post('/work-orders', data);
    return response.data?.data || response.data;
  },

  update: async (id: string, data: Partial<WorkOrder>): Promise<WorkOrder> => {
    const response = await api.patch(`/work-orders/${id}`, data);
    return response.data?.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/work-orders/${id}`);
  },

  // Scheduling endpoints
  reschedule: async (id: string, data: RescheduleWorkOrderDto): Promise<WorkOrder> => {
    const response = await api.patch(`/work-orders/${id}/reschedule`, data);
    return response.data?.data || response.data;
  },

  checkConflicts: async (date: string, technicianId?: string): Promise<SchedulingConflict> => {
    const response = await api.get('/work-orders/scheduling/conflicts', {
      params: { date, technicianId },
    });
    return response.data?.data || response.data;
  },

  getCalendarView: async (
    startDate: string,
    endDate: string,
    technicianId?: string
  ): Promise<CalendarViewResponse> => {
    const response = await api.get('/work-orders/scheduling/calendar', {
      params: { startDate, endDate, technicianId },
    });
    return response.data?.data || response.data;
  },
};

// ============= PRICE BOOK API =============

export const priceBookApi = {
  // Get all price books
  getAll: async (params?: {
    organizationId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PriceBook[]> => {
    const response = await api.get('/price-books', { params });
    return response.data?.data || response.data || [];
  },

  // Get price book by ID
  getById: async (id: string): Promise<PriceBook> => {
    const response = await api.get(`/price-books/${id}`);
    return response.data?.data || response.data;
  },

  // Get price books by organization
  getByOrganization: async (organizationId: string): Promise<PriceBook[]> => {
    const response = await api.get(`/price-books/organization/${organizationId}`);
    return response.data?.data || response.data || [];
  },

  // Create price book
  create: async (data: Partial<PriceBook>): Promise<PriceBook> => {
    const response = await api.post('/price-books', data);
    return response.data?.data || response.data;
  },

  // Update price book
  update: async (id: string, data: Partial<PriceBook>): Promise<PriceBook> => {
    const response = await api.patch(`/price-books/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete price book
  delete: async (id: string): Promise<void> => {
    await api.delete(`/price-books/${id}`);
  },

  // Price Book Items
  items: {
    getAll: async (priceBookId: string): Promise<PriceBookItem[]> => {
      const response = await api.get(`/price-books/${priceBookId}/items`);
      return response.data?.data || response.data || [];
    },

    create: async (priceBookId: string, data: Partial<PriceBookItem>): Promise<PriceBookItem> => {
      const response = await api.post(`/price-books/${priceBookId}/items`, data);
      return response.data?.data || response.data;
    },

    update: async (priceBookId: string, itemId: string, data: Partial<PriceBookItem>): Promise<PriceBookItem> => {
      const response = await api.patch(`/price-books/${priceBookId}/items/${itemId}`, data);
      return response.data?.data || response.data;
    },

    delete: async (priceBookId: string, itemId: string): Promise<void> => {
      await api.delete(`/price-books/${priceBookId}/items/${itemId}`);
    },
  },
};

// ============= BOQ API =============

// ============= REPORTS API =============

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: any;
}

export interface ReportSorting {
  field: string;
  order: 'asc' | 'desc';
}

export interface ReportAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export interface ReportConfiguration {
  columns: string[];
  filters?: ReportFilter[];
  sorting?: ReportSorting[];
  groupBy?: string[];
  aggregations?: ReportAggregation[];
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  reportType: 'asset' | 'work_order' | 'inventory' | 'preventive_maintenance' | 'cost' | 'performance' | 'compliance' | 'custom';
  dataSource?: string;
  configuration: ReportConfiguration;
  createdById: string;
  companyId?: string;
  isPublic: boolean;
  isScheduled: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  scheduleRecipients?: string[];
  scheduleTime?: string;
  lastGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExecutionResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations?: Record<string, any>;
  metadata: {
    reportName: string;
    executedAt: string;
    dataSource: string;
    columns: string[];
  };
}

export interface DataSourceColumn {
  field: string;
  label: string;
  type: string;
}

export const reportsApi = {
  // Get all saved reports
  getAll: async (): Promise<SavedReport[]> => {
    const response = await api.get('/reports');
    return response.data?.data || response.data || [];
  },

  // Get report by ID
  getById: async (id: string): Promise<SavedReport> => {
    const response = await api.get(`/reports/${id}`);
    return response.data?.data || response.data;
  },

  // Create new report
  create: async (data: {
    name: string;
    description?: string;
    reportType: string;
    dataSource: string;
    configuration: ReportConfiguration;
    isPublic?: boolean;
    isScheduled?: boolean;
    scheduleFrequency?: string;
    scheduleRecipients?: string[];
    scheduleTime?: string;
  }): Promise<SavedReport> => {
    const response = await api.post('/reports', data);
    return response.data?.data || response.data;
  },

  // Update report
  update: async (id: string, data: Partial<SavedReport>): Promise<SavedReport> => {
    const response = await api.patch(`/reports/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete report
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reports/${id}`);
  },

  // Execute report
  execute: async (id: string, options?: {
    overrideFilters?: Record<string, any>;
    dateRange?: { start: string; end: string };
    page?: number;
    limit?: number;
    format?: 'json' | 'csv';
  }): Promise<ReportExecutionResult> => {
    const response = await api.post(`/reports/${id}/execute`, options || {});
    return response.data?.data || response.data;
  },

  // Get available data sources
  getDataSources: async (): Promise<{ value: string; label: string }[]> => {
    const response = await api.get('/reports/data-sources');
    return response.data?.data || response.data || [];
  },

  // Get columns for a data source
  getColumns: async (dataSource: string): Promise<DataSourceColumn[]> => {
    const response = await api.get(`/reports/columns/${dataSource}`);
    return response.data?.data || response.data || [];
  },
};

export const boqApi = {
  // Get all BOQs
  getAll: async (params?: {
    workOrderId?: string;
    organizationId?: string;
    status?: string;
    search?: string;
  }): Promise<BOQ[]> => {
    const response = await api.get('/boq', { params });
    return response.data?.data || response.data || [];
  },

  // Get BOQ by ID
  getById: async (id: string): Promise<BOQ> => {
    const response = await api.get(`/boq/${id}`);
    return response.data?.data || response.data;
  },

  // Get BOQ by work order
  getByWorkOrder: async (workOrderId: string): Promise<BOQ | null> => {
    const response = await api.get(`/boq/work-order/${workOrderId}`);
    return response.data?.data || null;
  },

  // Create BOQ
  create: async (data: Partial<BOQ>): Promise<BOQ> => {
    const response = await api.post('/boq', data);
    return response.data?.data || response.data;
  },

  // Update BOQ
  update: async (id: string, data: Partial<BOQ>): Promise<BOQ> => {
    const response = await api.patch(`/boq/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete BOQ
  delete: async (id: string): Promise<void> => {
    await api.delete(`/boq/${id}`);
  },

  // Update BOQ status
  updateStatus: async (id: string, status: 'draft' | 'pending' | 'approved' | 'rejected'): Promise<BOQ> => {
    const response = await api.patch(`/boq/${id}/status`, { status });
    return response.data?.data || response.data;
  },

  // Generate BOQ from work order
  generateFromWorkOrder: async (workOrderId: string): Promise<BOQ> => {
    const response = await api.post(`/boq/generate/${workOrderId}`);
    return response.data?.data || response.data;
  },
};

// ============= TEAM TYPES =============

export interface Team {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentTeamId?: string;
  parentTeam?: Team;
  childTeams?: Team[];
  leaderId?: string;
  leader?: User;
  members?: TeamMember[];
  level: number;
  sortOrder: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  organizationId?: string;
  organization?: Company;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  team?: Team;
  userId: string;
  user?: User;
  role: 'leader' | 'member' | 'supervisor';
  joinedAt: string;
  isActive: boolean;
}

export interface TeamHierarchy {
  team: Team;
  children: TeamHierarchy[];
  memberCount: number;
  level: number;
}

// ============= TEAM API =============

export const teamApi = {
  // Get all teams
  getAll: async (params?: {
    search?: string;
    isActive?: boolean;
    organizationId?: string;
    parentTeamId?: string;
    includeMembers?: boolean;
  }): Promise<Team[]> => {
    const response = await api.get('/teams', { params });
    return response.data?.data || response.data || [];
  },

  // Get team by ID
  getById: async (id: string, includeMembers = true): Promise<Team> => {
    const response = await api.get(`/teams/${id}`, {
      params: { includeMembers },
    });
    return response.data?.data || response.data;
  },

  // Get team hierarchy (tree structure)
  getHierarchy: async (organizationId?: string): Promise<TeamHierarchy[]> => {
    const response = await api.get('/teams/hierarchy', {
      params: { organizationId },
    });
    return response.data?.data || response.data || [];
  },

  // Create team
  create: async (data: {
    name: string;
    code?: string;
    description?: string;
    parentTeamId?: string;
    leaderId?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
    organizationId?: string;
  }): Promise<Team> => {
    const response = await api.post('/teams', data);
    return response.data?.data || response.data;
  },

  // Update team
  update: async (id: string, data: Partial<Team>): Promise<Team> => {
    const response = await api.patch(`/teams/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete team
  delete: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  // Move team (change parent - for drag and drop)
  moveTeam: async (id: string, parentTeamId: string | null, sortOrder?: number): Promise<Team> => {
    const response = await api.patch(`/teams/${id}/move`, {
      parentTeamId,
      sortOrder,
    });
    return response.data?.data || response.data;
  },

  // Reorder teams (update sort order)
  reorderTeams: async (teamOrders: { id: string; sortOrder: number }[]): Promise<void> => {
    await api.post('/teams/reorder', { teamOrders });
  },

  // Team Members
  members: {
    // Get all members of a team
    getAll: async (teamId: string): Promise<TeamMember[]> => {
      const response = await api.get(`/teams/${teamId}/members`);
      return response.data?.data || response.data || [];
    },

    // Add member to team
    add: async (teamId: string, data: {
      userId: string;
      role?: 'leader' | 'member' | 'supervisor';
    }): Promise<TeamMember> => {
      const response = await api.post(`/teams/${teamId}/members`, data);
      return response.data?.data || response.data;
    },

    // Update member role
    updateRole: async (teamId: string, memberId: string, role: 'leader' | 'member' | 'supervisor'): Promise<TeamMember> => {
      const response = await api.patch(`/teams/${teamId}/members/${memberId}`, { role });
      return response.data?.data || response.data;
    },

    // Remove member from team
    remove: async (teamId: string, memberId: string): Promise<void> => {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
    },
  },
};

// ============= FINANCE TYPES =============

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';
export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partial' | 'received' | 'cancelled';
export type PaymentType = 'incoming' | 'outgoing';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'online' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type ExpenseCategory = 'labor' | 'parts' | 'equipment' | 'travel' | 'utilities' | 'contractor' | 'other';
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Company;
  workOrderId?: string;
  workOrder?: WorkOrder;
  boqId?: string;
  boq?: BOQ;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  taxable: boolean;
  amount: number;
  itemType?: 'service' | 'product' | 'labor' | 'other';
  inventoryId?: string;
  serviceId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  lineItems: PurchaseOrderLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost?: number;
  discount?: number;
  totalAmount: number;
  currency: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  approvedById?: string;
  approvedAt?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  purchaseOrderId: string;
  inventoryId?: string;
  inventory?: Inventory;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  unit?: string;
  amount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentDate: string;
  referenceNumber?: string;
  invoiceId?: string;
  invoice?: Invoice;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  clientId?: string;
  client?: Company;
  supplierId?: string;
  supplier?: Supplier;
  description?: string;
  notes?: string;
  transactionFee?: number;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  client?: Company;
  status: QuoteStatus;
  issueDate: string;
  validUntil: string;
  convertedToWorkOrderId?: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount: number;
  currency: string;
  description?: string;
  terms?: string;
  notes?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  amount: number;
  itemType?: 'service' | 'product' | 'labor' | 'other';
  inventoryId?: string;
  serviceId?: string;
}

export interface Budget {
  id: string;
  name: string;
  code: string;
  description?: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  teamId?: string;
  team?: Team;
  departmentId?: string;
  assetId?: string;
  categories: BudgetCategory[];
  isActive: boolean;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: ExpenseCategory;
  allocatedAmount: number;
  spentAmount: number;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  workOrderId?: string;
  workOrder?: WorkOrder;
  assetId?: string;
  budgetId?: string;
  budget?: Budget;
  supplierId?: string;
  supplier?: Supplier;
  receipt?: string;
  notes?: string;
  isReimbursable: boolean;
  isReimbursed: boolean;
  approvedById?: string;
  approvedAt?: string;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  pendingPayments: number;
  budgetUtilization: number;
  revenueByMonth: { month: string; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
  topClients: { clientId: string; clientName: string; revenue: number }[];
  cashFlow: { date: string; inflow: number; outflow: number }[];
}

// ============= FINANCE API =============

export const financeApi = {
  // ==================== INVOICES ====================
  invoices: {
    getAll: async (params?: {
      status?: InvoiceStatus;
      clientId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: Invoice[]; total: number }> => {
      const response = await api.get('/finance/invoices', { params });
      const result = response.data?.data || response.data;
      if (Array.isArray(result)) {
        return { data: result, total: result.length };
      }
      return result;
    },

    getById: async (id: string): Promise<Invoice> => {
      const response = await api.get(`/finance/invoices/${id}`);
      return response.data?.data || response.data;
    },

    create: async (data: Partial<Invoice>): Promise<Invoice> => {
      const response = await api.post('/finance/invoices', data);
      return response.data?.data || response.data;
    },

    update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
      const response = await api.patch(`/finance/invoices/${id}`, data);
      return response.data?.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/finance/invoices/${id}`);
    },

    updateStatus: async (id: string, status: InvoiceStatus): Promise<Invoice> => {
      const response = await api.patch(`/finance/invoices/${id}/status`, { status });
      return response.data?.data || response.data;
    },

    sendToClient: async (id: string): Promise<Invoice> => {
      const response = await api.post(`/finance/invoices/${id}/send`);
      return response.data?.data || response.data;
    },

    generateFromBOQ: async (boqId: string): Promise<Invoice> => {
      const response = await api.post(`/finance/invoices/generate-from-boq/${boqId}`);
      return response.data?.data || response.data;
    },

    generateFromWorkOrder: async (workOrderId: string): Promise<Invoice> => {
      const response = await api.post(`/finance/invoices/generate-from-work-order/${workOrderId}`);
      return response.data?.data || response.data;
    },
  },

  // ==================== PURCHASE ORDERS ====================
  purchaseOrders: {
    getAll: async (params?: {
      status?: PurchaseOrderStatus;
      supplierId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: PurchaseOrder[]; total: number }> => {
      const response = await api.get('/finance/purchase-orders', { params });
      const result = response.data?.data || response.data;
      if (Array.isArray(result)) {
        return { data: result, total: result.length };
      }
      return result;
    },

    getById: async (id: string): Promise<PurchaseOrder> => {
      const response = await api.get(`/finance/purchase-orders/${id}`);
      return response.data?.data || response.data;
    },

    create: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
      const response = await api.post('/finance/purchase-orders', data);
      return response.data?.data || response.data;
    },

    update: async (id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
      const response = await api.patch(`/finance/purchase-orders/${id}`, data);
      return response.data?.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/finance/purchase-orders/${id}`);
    },

    updateStatus: async (id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> => {
      const response = await api.patch(`/finance/purchase-orders/${id}/status`, { status });
      return response.data?.data || response.data;
    },

    approve: async (id: string): Promise<PurchaseOrder> => {
      const response = await api.post(`/finance/purchase-orders/${id}/approve`);
      return response.data?.data || response.data;
    },

    receiveItems: async (id: string, items: { lineItemId: string; receivedQuantity: number }[]): Promise<PurchaseOrder> => {
      const response = await api.post(`/finance/purchase-orders/${id}/receive`, { items });
      return response.data?.data || response.data;
    },

    sendToSupplier: async (id: string): Promise<PurchaseOrder> => {
      const response = await api.post(`/finance/purchase-orders/${id}/send`);
      return response.data?.data || response.data;
    },
  },

  // ==================== PAYMENTS ====================
  payments: {
    getAll: async (params?: {
      type?: PaymentType;
      status?: PaymentStatus;
      method?: PaymentMethod;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: Payment[]; total: number }> => {
      const response = await api.get('/finance/payments', { params });
      const result = response.data?.data || response.data;
      if (Array.isArray(result)) {
        return { data: result, total: result.length };
      }
      return result;
    },

    getById: async (id: string): Promise<Payment> => {
      const response = await api.get(`/finance/payments/${id}`);
      return response.data?.data || response.data;
    },

    create: async (data: Partial<Payment>): Promise<Payment> => {
      const response = await api.post('/finance/payments', data);
      return response.data?.data || response.data;
    },

    update: async (id: string, data: Partial<Payment>): Promise<Payment> => {
      const response = await api.patch(`/finance/payments/${id}`, data);
      return response.data?.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/finance/payments/${id}`);
    },

    recordPaymentForInvoice: async (invoiceId: string, data: Partial<Payment>): Promise<Payment> => {
      const response = await api.post(`/finance/invoices/${invoiceId}/payments`, data);
      return response.data?.data || response.data;
    },
  },

  // ==================== QUOTES ====================
  quotes: {
    getAll: async (params?: {
      status?: QuoteStatus;
      clientId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: Quote[]; total: number }> => {
      const response = await api.get('/finance/quotes', { params });
      const result = response.data?.data || response.data;
      if (Array.isArray(result)) {
        return { data: result, total: result.length };
      }
      return result;
    },

    getById: async (id: string): Promise<Quote> => {
      const response = await api.get(`/finance/quotes/${id}`);
      return response.data?.data || response.data;
    },

    create: async (data: Partial<Quote>): Promise<Quote> => {
      const response = await api.post('/finance/quotes', data);
      return response.data?.data || response.data;
    },

    update: async (id: string, data: Partial<Quote>): Promise<Quote> => {
      const response = await api.patch(`/finance/quotes/${id}`, data);
      return response.data?.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/finance/quotes/${id}`);
    },

    updateStatus: async (id: string, status: QuoteStatus): Promise<Quote> => {
      const response = await api.patch(`/finance/quotes/${id}/status`, { status });
      return response.data?.data || response.data;
    },

    sendToClient: async (id: string): Promise<Quote> => {
      const response = await api.post(`/finance/quotes/${id}/send`);
      return response.data?.data || response.data;
    },

    convertToWorkOrder: async (id: string): Promise<WorkOrder> => {
      const response = await api.post(`/finance/quotes/${id}/convert-to-work-order`);
      return response.data?.data || response.data;
    },

    duplicate: async (id: string): Promise<Quote> => {
      const response = await api.post(`/finance/quotes/${id}/duplicate`);
      return response.data?.data || response.data;
    },
  },

  // ==================== BUDGETS ====================
  budgets: {
    getAll: async (params?: {
      period?: BudgetPeriod;
      teamId?: string;
      isActive?: boolean;
      search?: string;
    }): Promise<Budget[]> => {
      const response = await api.get('/finance/budgets', { params });
      return response.data?.data || response.data || [];
    },

    getById: async (id: string): Promise<Budget> => {
      const response = await api.get(`/finance/budgets/${id}`);
      return response.data?.data || response.data;
    },

    create: async (data: Partial<Budget>): Promise<Budget> => {
      const response = await api.post('/finance/budgets', data);
      return response.data?.data || response.data;
    },

    update: async (id: string, data: Partial<Budget>): Promise<Budget> => {
      const response = await api.patch(`/finance/budgets/${id}`, data);
      return response.data?.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/finance/budgets/${id}`);
    },

    getUtilization: async (id: string): Promise<{ utilized: number; remaining: number; percentage: number }> => {
      const response = await api.get(`/finance/budgets/${id}/utilization`);
      return response.data?.data || response.data;
    },
  },

  // ==================== EXPENSES ====================
  expenses: {
    getAll: async (params?: {
      category?: ExpenseCategory;
      workOrderId?: string;
      budgetId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: Expense[]; total: number }> => {
      const response = await api.get('/finance/expenses', { params });
      const result = response.data?.data || response.data;
      if (Array.isArray(result)) {
        return { data: result, total: result.length };
      }
      return result;
    },

    getById: async (id: string): Promise<Expense> => {
      const response = await api.get(`/finance/expenses/${id}`);
      return response.data?.data || response.data;
    },

    create: async (data: Partial<Expense>): Promise<Expense> => {
      const response = await api.post('/finance/expenses', data);
      return response.data?.data || response.data;
    },

    update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
      const response = await api.patch(`/finance/expenses/${id}`, data);
      return response.data?.data || response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/finance/expenses/${id}`);
    },

    approve: async (id: string): Promise<Expense> => {
      const response = await api.post(`/finance/expenses/${id}/approve`);
      return response.data?.data || response.data;
    },

    markReimbursed: async (id: string): Promise<Expense> => {
      const response = await api.post(`/finance/expenses/${id}/reimburse`);
      return response.data?.data || response.data;
    },
  },

  // ==================== FINANCIAL SUMMARY/DASHBOARD ====================
  dashboard: {
    getSummary: async (params?: {
      startDate?: string;
      endDate?: string;
      organizationId?: string;
    }): Promise<FinancialSummary> => {
      const response = await api.get('/finance/dashboard/summary', { params });
      return response.data?.data || response.data;
    },

    getRevenueByPeriod: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly', count?: number): Promise<{ period: string; amount: number }[]> => {
      const response = await api.get('/finance/dashboard/revenue', { params: { period, count } });
      return response.data?.data || response.data || [];
    },

    getExpensesByCategory: async (startDate?: string, endDate?: string): Promise<{ category: string; amount: number }[]> => {
      const response = await api.get('/finance/dashboard/expenses-by-category', { params: { startDate, endDate } });
      return response.data?.data || response.data || [];
    },

    getCashFlow: async (startDate?: string, endDate?: string): Promise<{ date: string; inflow: number; outflow: number }[]> => {
      const response = await api.get('/finance/dashboard/cash-flow', { params: { startDate, endDate } });
      return response.data?.data || response.data || [];
    },

    getAging: async (): Promise<{ current: number; days30: number; days60: number; days90: number; over90: number }> => {
      const response = await api.get('/finance/dashboard/aging');
      return response.data?.data || response.data;
    },
  },
};

// ============= INTEGRATION TYPES =============

export type IntegrationType = 'sap' | 'oracle' | 'dynamics';
export type SyncStatus = 'idle' | 'running' | 'success' | 'failed' | 'partial';
export type SyncDirection = 'inbound' | 'outbound';
export type SyncLogStatus = 'success' | 'failed' | 'partial' | 'skipped';
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface IntegrationConfig {
  id: string;
  companyId: string;
  type: IntegrationType;
  name: string;
  description?: string;
  connectionConfig: Record<string, any>;
  mappings?: Record<string, Record<string, string>>;
  syncSettings?: {
    syncAssets?: boolean;
    syncInventory?: boolean;
    syncWorkOrders?: boolean;
    syncPurchaseOrders?: boolean;
    syncInterval?: number;
    autoSync?: boolean;
  };
  isActive: boolean;
  lastSyncAt?: string;
  syncStatus: SyncStatus;
  lastSyncError?: string;
  lastSyncStats?: {
    assetsCreated?: number;
    assetsUpdated?: number;
    inventoryCreated?: number;
    inventoryUpdated?: number;
    workOrdersSynced?: number;
    errors?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  direction: SyncDirection;
  entityType: string;
  entityId?: string;
  externalId?: string;
  status: SyncLogStatus;
  request?: Record<string, any>;
  response?: Record<string, any>;
  errorMessage?: string;
  errorDetails?: Record<string, any>;
  durationMs?: number;
  recordsProcessed: number;
  recordsWithErrors: number;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  integrationId: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  priority: number;
  createdAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  responseTimeMs?: number;
}

export interface IntegrationTypeInfo {
  value: IntegrationType;
  label: string;
  description: string;
}

// ============= INTEGRATIONS API =============

export const integrationsApi = {
  // Get all integrations
  getAll: async (): Promise<IntegrationConfig[]> => {
    const response = await api.get('/integrations');
    return response.data?.data || response.data || [];
  },

  // Get integration by ID
  getById: async (id: string): Promise<IntegrationConfig> => {
    const response = await api.get(`/integrations/${id}`);
    return response.data?.data || response.data;
  },

  // Create integration
  create: async (data: {
    type: IntegrationType;
    name: string;
    description?: string;
    connectionConfig: Record<string, any>;
    mappings?: Record<string, Record<string, string>>;
    syncSettings?: IntegrationConfig['syncSettings'];
    isActive?: boolean;
  }): Promise<IntegrationConfig> => {
    const response = await api.post('/integrations', data);
    return response.data?.data || response.data;
  },

  // Update integration
  update: async (id: string, data: Partial<IntegrationConfig>): Promise<IntegrationConfig> => {
    const response = await api.patch(`/integrations/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete integration
  delete: async (id: string): Promise<void> => {
    await api.delete(`/integrations/${id}`);
  },

  // Test connection
  testConnection: async (id: string): Promise<ConnectionTestResult> => {
    const response = await api.post(`/integrations/${id}/test`);
    return response.data?.data || response.data;
  },

  // Trigger sync
  triggerSync: async (id: string, options?: {
    syncAssets?: boolean;
    syncInventory?: boolean;
    syncWorkOrders?: boolean;
    syncPurchaseOrders?: boolean;
  }): Promise<{ success: boolean; stats: Record<string, any> }> => {
    const response = await api.post(`/integrations/${id}/sync`, options || {});
    return response.data?.data || response.data;
  },

  // Update field mappings
  updateMappings: async (id: string, mappings: Record<string, Record<string, string>>): Promise<IntegrationConfig> => {
    const response = await api.post(`/integrations/${id}/mappings`, { mappings });
    return response.data?.data || response.data;
  },

  // Get sync logs
  getLogs: async (id: string, params?: {
    direction?: SyncDirection;
    entityType?: string;
    status?: SyncLogStatus;
    limit?: number;
  }): Promise<IntegrationLog[]> => {
    const response = await api.get(`/integrations/${id}/logs`, { params });
    return response.data?.data || response.data || [];
  },

  // Get integration types
  getTypes: async (): Promise<IntegrationTypeInfo[]> => {
    const response = await api.get('/integrations/types');
    return response.data?.data || response.data || [];
  },

  // Get default mappings for type
  getDefaultMappings: async (type: IntegrationType): Promise<Record<string, Record<string, string>>> => {
    const response = await api.get(`/integrations/mappings/${type}`);
    return response.data?.data || response.data || {};
  },

  // Get queue items
  getQueue: async (params?: {
    integrationId?: string;
    status?: QueueStatus;
    entityType?: string;
  }): Promise<SyncQueueItem[]> => {
    const response = await api.get('/integrations/queue', { params });
    return response.data?.data || response.data || [];
  },
};
