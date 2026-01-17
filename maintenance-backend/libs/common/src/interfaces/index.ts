import { UserRole, UserStatus, OrganizationType } from '../enums';

export interface IJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  roleId: string;
  companyId: string;
  companyType: OrganizationType;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface IAuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roleId: string;
  status: UserStatus;
  companyId: string;
  companyType: OrganizationType;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export interface IFileUpload {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

export interface IAuditLog {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
