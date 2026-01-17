import axios from 'axios';
import { usePortalAuthStore } from '../store/portalAuthStore';

// Portal API uses the same base URL but different endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const portalApi = axios.create({
  baseURL: `${API_BASE_URL}/portal`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
portalApi.interceptors.request.use((config) => {
  const token = usePortalAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      usePortalAuthStore.getState().logout();
      window.location.href = '/portal/login';
    }
    return Promise.reject(error);
  }
);

// ============= TYPES =============

export interface CustomerLoginCredentials {
  email: string;
  password: string;
}

export interface CustomerRegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  department?: string;
  companyId: string;
  locationId?: string;
}

export interface CustomerLoginResponse {
  accessToken: string;
  customer: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    department?: string;
    company: {
      id: string;
      name: string;
    } | null;
    location: {
      id: string;
      name: string;
    } | null;
  };
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  location?: {
    locationId: string;
    locationName: string;
  };
  asset?: {
    id: string;
    name: string;
  };
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }[];
  comments?: {
    id: string;
    authorId: string;
    authorName: string;
    authorType: 'customer' | 'staff';
    message: string;
    createdAt: string;
  }[];
  statusHistory?: {
    status: string;
    changedAt: string;
    changedBy: string;
    notes: string;
  }[];
  workOrderId?: string;
  submittedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
  ratedAt?: string;
}

export interface CreateServiceRequestData {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  locationId?: string;
  assetId?: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  }[];
}

export interface CustomerNotification {
  id: string;
  customerId: string;
  requestId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  stats: {
    total: number;
    submitted: number;
    inProgress: number;
    completed: number;
    unreadNotifications: number;
  };
  recentRequests: {
    id: string;
    requestNumber: string;
    title: string;
    status: string;
    category: string;
    submittedAt: string;
    location?: string;
  }[];
}

export interface ServiceCategory {
  value: string;
  label: string;
}

export interface LocationOption {
  id: string;
  name: string;
  address?: string;
}

export interface AssetOption {
  id: string;
  name: string;
  assetNumber?: string;
  category?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount?: number;
  };
}

// ============= AUTH API =============

export const portalAuthApi = {
  register: async (data: CustomerRegisterData) => {
    const response = await portalApi.post('/auth/register', data);
    return response.data?.data || response.data;
  },

  login: async (credentials: CustomerLoginCredentials): Promise<CustomerLoginResponse> => {
    const response = await portalApi.post('/auth/login', credentials);
    return response.data?.data || response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await portalApi.post('/auth/forgot-password', { email });
    return response.data?.data || response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await portalApi.post('/auth/reset-password', { token, newPassword });
    return response.data?.data || response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await portalApi.get(`/auth/verify-email?token=${token}`);
    return response.data?.data || response.data;
  },

  getProfile: async () => {
    const response = await portalApi.get('/auth/profile');
    return response.data?.data || response.data;
  },
};

// ============= DASHBOARD API =============

export const portalDashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await portalApi.get('/dashboard');
    return response.data?.data || response.data;
  },
};

// ============= SERVICE REQUESTS API =============

export const portalRequestsApi = {
  submit: async (data: CreateServiceRequestData): Promise<ServiceRequest> => {
    const response = await portalApi.post('/requests', data);
    return response.data?.data || response.data;
  },

  getAll: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ServiceRequest>> => {
    const response = await portalApi.get('/requests', { params });
    return response.data?.data || response.data;
  },

  getById: async (id: string): Promise<ServiceRequest> => {
    const response = await portalApi.get(`/requests/${id}`);
    return response.data?.data || response.data;
  },

  addComment: async (id: string, message: string): Promise<ServiceRequest> => {
    const response = await portalApi.post(`/requests/${id}/comments`, { message });
    return response.data?.data || response.data;
  },

  rate: async (id: string, rating: number, feedback?: string): Promise<ServiceRequest> => {
    const response = await portalApi.post(`/requests/${id}/rate`, { rating, feedback });
    return response.data?.data || response.data;
  },
};

// ============= NOTIFICATIONS API =============

export const portalNotificationsApi = {
  getAll: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CustomerNotification>> => {
    const response = await portalApi.get('/notifications', { params });
    return response.data?.data || response.data;
  },

  markAsRead: async (id: string): Promise<CustomerNotification> => {
    const response = await portalApi.post(`/notifications/${id}/read`);
    return response.data?.data || response.data;
  },

  markAllAsRead: async () => {
    const response = await portalApi.post('/notifications/read-all');
    return response.data?.data || response.data;
  },
};

// ============= REFERENCE DATA API =============

export const portalReferenceApi = {
  getCategories: async (): Promise<ServiceCategory[]> => {
    const response = await portalApi.get('/categories');
    return response.data?.data || response.data || [];
  },

  getLocations: async (): Promise<LocationOption[]> => {
    const response = await portalApi.get('/locations');
    return response.data?.data || response.data || [];
  },

  getAssets: async (locationId?: string): Promise<AssetOption[]> => {
    const response = await portalApi.get('/assets', {
      params: locationId ? { locationId } : undefined,
    });
    return response.data?.data || response.data || [];
  },
};
