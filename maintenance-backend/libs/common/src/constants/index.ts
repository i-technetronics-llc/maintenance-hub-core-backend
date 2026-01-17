export const CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

  // Work Orders
  MAX_WORK_ORDERS_PER_TECHNICIAN: 5,
  WORK_ORDER_NUMBER_PREFIX: 'WO',

  // Assets
  ASSET_CODE_PREFIX: 'AST',

  // Inventory
  LOW_STOCK_THRESHOLD_PERCENTAGE: 20,

  // SLA
  SLA_WARNING_THRESHOLD: 80, // Alert at 80% of SLA time
  SLA_CRITICAL_THRESHOLD: 100,

  // Security
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_SALT_ROUNDS: 10,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,

  // Session
  SESSION_TIMEOUT_MINUTES: 60,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,

  // Cache TTL (seconds)
  CACHE_TTL_SHORT: 300, // 5 minutes
  CACHE_TTL_MEDIUM: 1800, // 30 minutes
  CACHE_TTL_LONG: 3600, // 1 hour
};

export const ROLE_PERMISSIONS = {
  admin: ['*'], // All permissions
  head_of_operations: [
    'work_orders:read',
    'work_orders:approve',
    'analytics:read',
    'reports:read',
    'users:read',
    'assets:read',
  ],
  operations_manager: [
    'work_orders:read',
    'work_orders:create',
    'work_orders:update',
    'work_orders:approve',
    'assets:read',
    'assets:update',
    'analytics:read',
  ],
  dispatcher: [
    'work_orders:read',
    'work_orders:assign',
    'technicians:read',
    'scheduling:manage',
  ],
  field_technician: [
    'work_orders:read:own',
    'work_orders:update:own',
    'assets:read',
    'inventory:request',
  ],
  supervisor: [
    'work_orders:read',
    'work_orders:approve',
    'technicians:read',
  ],
  inventory_manager: [
    'inventory:read',
    'inventory:create',
    'inventory:update',
    'inventory:issue',
    'inventory:return',
    'procurement:manage',
  ],
  finance: [
    'procurement:read',
    'procurement:approve',
    'reports:read',
    'costs:read',
  ],
  compliance_officer: [
    'compliance:manage',
    'audits:manage',
    'reports:read',
  ],
  support_agent: [
    'work_orders:create',
    'work_orders:read',
    'clients:read',
  ],
  client_viewer: [
    'work_orders:read:client',
    'assets:read:client',
    'reports:read:client',
  ],
  client_approver: [
    'work_orders:read:client',
    'work_orders:approve:client',
    'assets:read:client',
  ],
  client_contract_manager: [
    'work_orders:read:client',
    'work_orders:create:client',
    'work_orders:approve:client',
    'assets:read:client',
    'vendors:manage',
    'reports:read:client',
  ],
};
