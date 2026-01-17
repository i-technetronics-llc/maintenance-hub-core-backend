export enum UserRole {
  // Platform Level
  SUPER_ADMIN = 'super_admin',

  // Company Level - Administration
  COMPANY_ADMIN = 'company_admin',

  // Maintenance Roles
  MAINTENANCE_MANAGER = 'maintenance_manager',
  MAINTENANCE_SUPERVISOR = 'maintenance_supervisor',
  PLANNER_SCHEDULER = 'planner_scheduler',
  TECHNICIAN = 'technician',

  // Inventory/Store Roles
  STOREKEEPER = 'storekeeper',

  // Engineering Roles
  RELIABILITY_ENGINEER = 'reliability_engineer',

  // Finance Roles
  FINANCE_CONTROLLER = 'finance_controller',

  // Basic Roles
  REQUESTER = 'requester',
  VIEWER = 'viewer',
  MANAGER = 'manager', // Generic manager role
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum OrganizationType {
  VENDOR = 'vendor',
  CLIENT = 'client',
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum WorkOrderType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  PREDICTIVE = 'predictive',
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum WorkOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_MAINTENANCE = 'under_maintenance',
  DECOMMISSIONED = 'decommissioned',
}

export enum InventoryTransactionType {
  ISSUE = 'issue',
  RETURN = 'return',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RECEIPT = 'receipt',
}

export enum NotificationType {
  WORK_ORDER_ASSIGNED = 'work_order_assigned',
  WORK_ORDER_STATUS_CHANGED = 'work_order_status_changed',
  WORK_ORDER_OVERDUE = 'work_order_overdue',
  COMMENT_ADDED = 'comment_added',
  ASSIGNMENT_CHANGED = 'assignment_changed',
  SLA_BREACH_WARNING = 'sla_breach_warning',
  SLA_BREACH = 'sla_breach',
  APPROVAL_REQUIRED = 'approval_required',
  APPROVAL_STATUS_CHANGED = 'approval_status_changed',
  LOW_STOCK_ALERT = 'low_stock_alert',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// SaaS Multi-Tenant Enums

// Permission Modules matching the README matrix
export enum PermissionModule {
  // Core Modules from README Matrix
  COMPANY_MANAGEMENT = 'company_management',
  ASSET_MANAGEMENT = 'asset_management',
  WORK_ORDER_MANAGEMENT = 'work_order_management',
  PM_SCHEDULES = 'pm_schedules', // Preventive Maintenance
  INVENTORY = 'inventory',
  MOBILE = 'mobile',
  REPORTING = 'reporting',
  USER_MANAGEMENT = 'user_management',
  BILLING = 'billing',

  // Additional System Modules
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  AUDIT = 'audit',
}

export enum PermissionAction {
  // Standard CRUD Actions
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',

  // Extended Actions
  APPROVE = 'approve',
  ASSIGN = 'assign',
  EXECUTE = 'execute',
  SCHEDULE = 'schedule',
  DISPATCH = 'dispatch',
  CONFIGURE = 'configure',
  ADJUST = 'adjust',
  RESERVE = 'reserve',
  REQUEST = 'request',
  EXPORT = 'export',
  MANAGE = 'manage',
  FULL_ACCESS = 'full_access',
}

export enum CompanyStatus {
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum EmailValidationMode {
  STRICT = 'strict', // Require domain match
  FLEXIBLE = 'flexible', // Allow any corporate email
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

export enum InventoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  LOW_STOCK = 'low_stock',
  DISCONTINUED = 'discontinued',
}

export enum InventoryCategory {
  SPARE_PARTS = 'spare_parts',
  CONSUMABLES = 'consumables',
  TOOLS = 'tools',
  EQUIPMENT = 'equipment',
  SAFETY = 'safety',
  ELECTRICAL = 'electrical',
  MECHANICAL = 'mechanical',
  OTHER = 'other',
}

// Subscription Plan Enums
export enum SubscriptionPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// Work Order Risk and Urgency Enums
export enum WorkOrderRiskLevel {
  LOW = 'low',
  HIGH = 'high',
}

export enum WorkOrderUrgency {
  NORMAL = 'normal',
  URGENT = 'urgent',
}
