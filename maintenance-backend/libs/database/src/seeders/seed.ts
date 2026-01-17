import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Company } from '../entities/company.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Asset } from '../entities/asset.entity';
import { AssetLocation } from '../entities/asset-location.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { OrganizationType as OrganizationTypeEntity } from '../entities/organization-type.entity';
import { InventoryLocation } from '../entities/inventory-location.entity';
import { Manufacturer } from '../entities/manufacturer.entity';
import { Supplier } from '../entities/supplier.entity';
import { InventoryCategory } from '../entities/inventory-category.entity';
import { Inventory } from '../entities/inventory.entity';
import {
  UserRole,
  UserStatus,
  OrganizationType,
  OrganizationStatus,
  CompanyStatus,
  EmailValidationMode,
  PermissionModule,
  PermissionAction,
  AssetStatus,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderStatus,
  InventoryStatus,
  InventoryCategory as InventoryCategoryEnum,
} from '@app/common/enums';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'maintenance_db',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: true, // Auto-create schema
});

// Define all permissions based on README permission matrix
const ALL_PERMISSIONS = [
  // Company Management module
  { code: 'company_management:view', module: PermissionModule.COMPANY_MANAGEMENT, action: PermissionAction.VIEW, description: 'View companies' },
  { code: 'company_management:create', module: PermissionModule.COMPANY_MANAGEMENT, action: PermissionAction.CREATE, description: 'Create companies' },
  { code: 'company_management:edit', module: PermissionModule.COMPANY_MANAGEMENT, action: PermissionAction.EDIT, description: 'Edit companies' },
  { code: 'company_management:delete', module: PermissionModule.COMPANY_MANAGEMENT, action: PermissionAction.DELETE, description: 'Delete companies' },
  { code: 'company_management:approve', module: PermissionModule.COMPANY_MANAGEMENT, action: PermissionAction.APPROVE, description: 'Approve/reject companies' },

  // Asset Management module
  { code: 'asset_management:view', module: PermissionModule.ASSET_MANAGEMENT, action: PermissionAction.VIEW, description: 'View assets' },
  { code: 'asset_management:create', module: PermissionModule.ASSET_MANAGEMENT, action: PermissionAction.CREATE, description: 'Create assets' },
  { code: 'asset_management:edit', module: PermissionModule.ASSET_MANAGEMENT, action: PermissionAction.EDIT, description: 'Edit assets' },
  { code: 'asset_management:delete', module: PermissionModule.ASSET_MANAGEMENT, action: PermissionAction.DELETE, description: 'Delete assets' },
  { code: 'asset_management:export', module: PermissionModule.ASSET_MANAGEMENT, action: PermissionAction.EXPORT, description: 'Export assets' },

  // Work Order Management module
  { code: 'work_order_management:view', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.VIEW, description: 'View work orders' },
  { code: 'work_order_management:create', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.CREATE, description: 'Create work orders' },
  { code: 'work_order_management:edit', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.EDIT, description: 'Edit work orders' },
  { code: 'work_order_management:delete', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.DELETE, description: 'Delete work orders' },
  { code: 'work_order_management:approve', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.APPROVE, description: 'Approve work orders' },
  { code: 'work_order_management:assign', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.ASSIGN, description: 'Assign work orders' },
  { code: 'work_order_management:execute', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.EXECUTE, description: 'Execute work orders' },
  { code: 'work_order_management:schedule', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.SCHEDULE, description: 'Schedule work orders' },
  { code: 'work_order_management:dispatch', module: PermissionModule.WORK_ORDER_MANAGEMENT, action: PermissionAction.DISPATCH, description: 'Dispatch work orders' },

  // PM Schedules (Preventive Maintenance) module
  { code: 'pm_schedules:view', module: PermissionModule.PM_SCHEDULES, action: PermissionAction.VIEW, description: 'View PM schedules' },
  { code: 'pm_schedules:create', module: PermissionModule.PM_SCHEDULES, action: PermissionAction.CREATE, description: 'Create PM schedules' },
  { code: 'pm_schedules:edit', module: PermissionModule.PM_SCHEDULES, action: PermissionAction.EDIT, description: 'Edit PM schedules' },
  { code: 'pm_schedules:delete', module: PermissionModule.PM_SCHEDULES, action: PermissionAction.DELETE, description: 'Delete PM schedules' },
  { code: 'pm_schedules:configure', module: PermissionModule.PM_SCHEDULES, action: PermissionAction.CONFIGURE, description: 'Configure predictive maintenance' },

  // Inventory module
  { code: 'inventory:view', module: PermissionModule.INVENTORY, action: PermissionAction.VIEW, description: 'View inventory' },
  { code: 'inventory:create', module: PermissionModule.INVENTORY, action: PermissionAction.CREATE, description: 'Add inventory items' },
  { code: 'inventory:edit', module: PermissionModule.INVENTORY, action: PermissionAction.EDIT, description: 'Edit inventory items' },
  { code: 'inventory:delete', module: PermissionModule.INVENTORY, action: PermissionAction.DELETE, description: 'Delete inventory items' },
  { code: 'inventory:adjust', module: PermissionModule.INVENTORY, action: PermissionAction.ADJUST, description: 'Adjust inventory levels' },
  { code: 'inventory:reserve', module: PermissionModule.INVENTORY, action: PermissionAction.RESERVE, description: 'Reserve inventory parts' },
  { code: 'inventory:request', module: PermissionModule.INVENTORY, action: PermissionAction.REQUEST, description: 'Request inventory parts' },

  // Mobile module
  { code: 'mobile:view', module: PermissionModule.MOBILE, action: PermissionAction.VIEW, description: 'View mobile app' },
  { code: 'mobile:create', module: PermissionModule.MOBILE, action: PermissionAction.CREATE, description: 'Create in mobile app' },
  { code: 'mobile:edit', module: PermissionModule.MOBILE, action: PermissionAction.EDIT, description: 'Edit in mobile app' },
  { code: 'mobile:full_access', module: PermissionModule.MOBILE, action: PermissionAction.FULL_ACCESS, description: 'Full mobile access' },

  // Reporting module
  { code: 'reporting:view', module: PermissionModule.REPORTING, action: PermissionAction.VIEW, description: 'View reports' },
  { code: 'reporting:create', module: PermissionModule.REPORTING, action: PermissionAction.CREATE, description: 'Create custom reports' },
  { code: 'reporting:export', module: PermissionModule.REPORTING, action: PermissionAction.EXPORT, description: 'Export reports' },

  // User Management module
  { code: 'user_management:view', module: PermissionModule.USER_MANAGEMENT, action: PermissionAction.VIEW, description: 'View users' },
  { code: 'user_management:create', module: PermissionModule.USER_MANAGEMENT, action: PermissionAction.CREATE, description: 'Create/invite users' },
  { code: 'user_management:edit', module: PermissionModule.USER_MANAGEMENT, action: PermissionAction.EDIT, description: 'Edit users' },
  { code: 'user_management:delete', module: PermissionModule.USER_MANAGEMENT, action: PermissionAction.DELETE, description: 'Delete users' },
  { code: 'user_management:manage', module: PermissionModule.USER_MANAGEMENT, action: PermissionAction.MANAGE, description: 'Platform-wide user management' },

  // Billing module
  { code: 'billing:view', module: PermissionModule.BILLING, action: PermissionAction.VIEW, description: 'View billing information' },
  { code: 'billing:edit', module: PermissionModule.BILLING, action: PermissionAction.EDIT, description: 'Edit billing settings' },
  { code: 'billing:full_access', module: PermissionModule.BILLING, action: PermissionAction.FULL_ACCESS, description: 'Full billing access' },

  // Roles module
  { code: 'roles:view', module: PermissionModule.ROLES, action: PermissionAction.VIEW, description: 'View roles' },
  { code: 'roles:create', module: PermissionModule.ROLES, action: PermissionAction.CREATE, description: 'Create roles' },
  { code: 'roles:edit', module: PermissionModule.ROLES, action: PermissionAction.EDIT, description: 'Edit roles' },
  { code: 'roles:delete', module: PermissionModule.ROLES, action: PermissionAction.DELETE, description: 'Delete roles' },

  // Permissions module
  { code: 'permissions:view', module: PermissionModule.PERMISSIONS, action: PermissionAction.VIEW, description: 'View permissions' },
  { code: 'permissions:edit', module: PermissionModule.PERMISSIONS, action: PermissionAction.EDIT, description: 'Edit permissions' },

  // Settings module
  { code: 'settings:view', module: PermissionModule.SETTINGS, action: PermissionAction.VIEW, description: 'View settings' },
  { code: 'settings:edit', module: PermissionModule.SETTINGS, action: PermissionAction.EDIT, description: 'Edit settings' },

  // Analytics module
  { code: 'analytics:view', module: PermissionModule.ANALYTICS, action: PermissionAction.VIEW, description: 'View analytics dashboards' },

  // Audit module
  { code: 'audit:view', module: PermissionModule.AUDIT, action: PermissionAction.VIEW, description: 'View audit logs' },
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  await dataSource.initialize();
  console.log('✅ Database connected');

  const companyRepo = dataSource.getRepository(Company);
  const organizationRepo = dataSource.getRepository(Organization);
  const organizationTypeRepo = dataSource.getRepository(OrganizationTypeEntity);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);
  const assetLocationRepo = dataSource.getRepository(AssetLocation);
  const assetRepo = dataSource.getRepository(Asset);
  const workOrderRepo = dataSource.getRepository(WorkOrder);

  // Clear only test data tables (assets, locations, work orders)
  console.log('🗑️  Clearing test data (assets, locations, work orders)...');
  await dataSource.query('TRUNCATE TABLE work_orders CASCADE');
  await dataSource.query('TRUNCATE TABLE assets CASCADE');
  await dataSource.query('TRUNCATE TABLE asset_locations CASCADE');
  console.log('✅ Cleared test data tables');

  // ========================================
  // CREATE ORGANIZATION TYPES
  // ========================================
  console.log('🏢 Creating/updating organization types...');

  // Vendor Company Type
  let vendorOrgType = await organizationTypeRepo.findOne({ where: { code: 'VENDOR' } });
  if (!vendorOrgType) {
    vendorOrgType = await organizationTypeRepo.save({
      name: 'Vendor Company',
      code: 'VENDOR',
      description: 'Service provider organizations that perform maintenance and repair work',
      isActive: true,
      allowSelfOnboarding: true, // Vendors can self-onboard
      settings: {
        canManageAssets: false,
        canCreateWorkOrders: true,
        canViewReports: true,
      },
    });
    console.log('✅ Created organization type: Vendor Company');
  } else {
    console.log('✅ Organization type already exists: Vendor Company');
  }

  // Client Organization Type
  let clientOrgType = await organizationTypeRepo.findOne({ where: { code: 'CLIENT' } });
  if (!clientOrgType) {
    clientOrgType = await organizationTypeRepo.save({
      name: 'Client Organization',
      code: 'CLIENT',
      description: 'Client organizations that own assets and request maintenance services',
      isActive: true,
      allowSelfOnboarding: false, // Clients cannot self-onboard, must be invited by vendor or super-admin
      settings: {
        canManageAssets: true,
        canCreateWorkOrders: true,
        canViewReports: true,
      },
    });
    console.log('✅ Created organization type: Client Organization');
  } else {
    console.log('✅ Organization type already exists: Client Organization');
  }

  // ========================================
  // CREATE OR UPDATE PERMISSIONS
  // ========================================
  console.log('📋 Creating/updating permissions...');
  const permissions = [];
  for (const perm of ALL_PERMISSIONS) {
    const existing = await permissionRepo.findOne({ where: { code: perm.code } });
    if (existing) {
      permissions.push(existing);
    } else {
      const created = await permissionRepo.save(perm);
      permissions.push(created);
    }
  }
  console.log(`✅ Ensured ${permissions.length} permissions exist`);

  // Create permission lookup map
  const permissionMap = Object.fromEntries(
    permissions.map((perm) => [perm.code, perm])
  );

  // ========================================
  // CREATE SUPER_ADMIN ROLE
  // ========================================
  console.log('👑 Ensuring SUPER_ADMIN role exists...');
  let superAdminRole = await roleRepo.findOne({ where: { name: UserRole.SUPER_ADMIN } });
  if (!superAdminRole) {
    superAdminRole = await roleRepo.save({
      name: UserRole.SUPER_ADMIN,
      description: 'System Super Administrator with full access to all modules and companies',
      permissions: ['*'], // Universal permission
      isSystemRole: true,
      companyId: null,
    });
    console.log('✅ Created SUPER_ADMIN role');
  } else {
    console.log('✅ SUPER_ADMIN role already exists');
  }

  // ========================================
  // CREATE COMPANY_ADMIN ROLE
  // ========================================
  console.log('👔 Ensuring COMPANY_ADMIN role exists...');
  let companyAdminRole = await roleRepo.findOne({ where: { name: UserRole.COMPANY_ADMIN } });
  if (!companyAdminRole) {
    companyAdminRole = await roleRepo.save({
      name: UserRole.COMPANY_ADMIN,
      description: 'Company Administrator with full access within their company',
      permissions: [], // Will use RolePermission junction
      isSystemRole: true,
      companyId: null,
    });

    // Assign permissions to COMPANY_ADMIN (all except company_management full access)
    const companyAdminPermissions = permissions.filter(
      (p) => !p.code.startsWith('company_management:') || p.code === 'company_management:view'
    );
    await Promise.all(
      companyAdminPermissions.map((perm) =>
        rolePermissionRepo.save({
          roleId: companyAdminRole.id,
          permissionId: perm.id,
        })
      )
    );
    console.log(`✅ Created COMPANY_ADMIN role with ${companyAdminPermissions.length} permissions`);
  } else {
    console.log('✅ COMPANY_ADMIN role already exists');
  }

  // ========================================
  // CREATE OTHER SYSTEM ROLES (Based on README matrix)
  // ========================================
  console.log('👥 Ensuring other system roles exist...');

  // Helper to find or create role
  const findOrCreateRole = async (roleName: UserRole, description: string, permCodes: string[]) => {
    let role = await roleRepo.findOne({ where: { name: roleName } });
    if (!role) {
      role = await roleRepo.save({
        name: roleName,
        description,
        permissions: [],
        isSystemRole: true,
        companyId: null,
      });
      const rolePerms = permissions.filter(p => permCodes.includes(p.code));
      await Promise.all(rolePerms.map(p => rolePermissionRepo.save({ roleId: role.id, permissionId: p.id })));
    }
    return role;
  };

  // Create all roles based on README permission matrix
  const maintenanceManagerRole = await findOrCreateRole(
    UserRole.MAINTENANCE_MANAGER,
    'Full maintenance operations control',
    [
      'asset_management:view', 'asset_management:create', 'asset_management:edit', 'asset_management:delete',
      'work_order_management:view', 'work_order_management:create', 'work_order_management:edit', 'work_order_management:delete', 'work_order_management:approve', 'work_order_management:assign',
      'pm_schedules:view', 'pm_schedules:create', 'pm_schedules:edit', 'pm_schedules:delete',
      'inventory:view', 'inventory:edit', 'inventory:adjust',
      'mobile:full_access',
      'reporting:view', 'reporting:export',
    ]
  );

  const maintenanceSupervisorRole = await findOrCreateRole(
    UserRole.MAINTENANCE_SUPERVISOR,
    'Team supervision and approval',
    [
      'asset_management:view', 'asset_management:edit',
      'work_order_management:view', 'work_order_management:create', 'work_order_management:edit', 'work_order_management:approve', 'work_order_management:assign',
      'pm_schedules:view', 'pm_schedules:edit',
      'inventory:view',
      'mobile:full_access',
      'reporting:view',
    ]
  );

  const plannerSchedulerRole = await findOrCreateRole(
    UserRole.PLANNER_SCHEDULER,
    'Work planning and scheduling',
    [
      'asset_management:view',
      'work_order_management:view', 'work_order_management:edit', 'work_order_management:schedule', 'work_order_management:dispatch',
      'pm_schedules:view', 'pm_schedules:create', 'pm_schedules:edit',
      'inventory:view', 'inventory:reserve',
      'mobile:view',
      'reporting:view',
    ]
  );

  const technicianRole = await findOrCreateRole(
    UserRole.TECHNICIAN,
    'Field execution and updates',
    [
      'asset_management:view',
      'work_order_management:view', 'work_order_management:edit', 'work_order_management:execute',
      'pm_schedules:view',
      'inventory:view', 'inventory:request',
      'mobile:full_access',
      'reporting:view',
    ]
  );

  const storekeeperRole = await findOrCreateRole(
    UserRole.STOREKEEPER,
    'Inventory management',
    [
      'asset_management:view',
      'work_order_management:view',
      'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete', 'inventory:adjust',
      'mobile:view', 'mobile:create', 'mobile:edit',
      'reporting:view',
    ]
  );

  const reliabilityEngineerRole = await findOrCreateRole(
    UserRole.RELIABILITY_ENGINEER,
    'Predictive maintenance and analysis',
    [
      'asset_management:view', 'asset_management:create', 'asset_management:edit', 'asset_management:delete',
      'work_order_management:view',
      'pm_schedules:view', 'pm_schedules:edit', 'pm_schedules:configure',
      'inventory:view',
      'mobile:view',
      'reporting:view', 'reporting:export', 'analytics:view',
    ]
  );

  const financeControllerRole = await findOrCreateRole(
    UserRole.FINANCE_CONTROLLER,
    'Financial oversight',
    [
      'asset_management:view',
      'work_order_management:view',
      'pm_schedules:view',
      'inventory:view',
      'reporting:view', 'reporting:export',
    ]
  );

  const requesterRole = await findOrCreateRole(
    UserRole.REQUESTER,
    'Submit work requests',
    [
      'asset_management:view',
      'work_order_management:view', 'work_order_management:create',
      'mobile:view', 'mobile:create',
      'reporting:view',
    ]
  );

  const viewerRole = await findOrCreateRole(
    UserRole.VIEWER,
    'Read-only access',
    [
      'asset_management:view',
      'work_order_management:view',
      'pm_schedules:view',
      'inventory:view',
      'reporting:view',
    ]
  );

  const managerRole = await findOrCreateRole(
    UserRole.MANAGER,
    'General management access',
    [
      'asset_management:view', 'asset_management:create', 'asset_management:edit',
      'work_order_management:view', 'work_order_management:create', 'work_order_management:edit', 'work_order_management:delete',
      'pm_schedules:view', 'pm_schedules:create', 'pm_schedules:edit', 'pm_schedules:delete',
      'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
      'reporting:view',
    ]
  );

  console.log('✅ Ensured 10 additional system roles exist');

  // Create role lookup map
  const roleMap = {
    [UserRole.SUPER_ADMIN]: superAdminRole.id,
    [UserRole.COMPANY_ADMIN]: companyAdminRole.id,
    [UserRole.MAINTENANCE_MANAGER]: maintenanceManagerRole.id,
    [UserRole.MAINTENANCE_SUPERVISOR]: maintenanceSupervisorRole.id,
    [UserRole.PLANNER_SCHEDULER]: plannerSchedulerRole.id,
    [UserRole.TECHNICIAN]: technicianRole.id,
    [UserRole.STOREKEEPER]: storekeeperRole.id,
    [UserRole.RELIABILITY_ENGINEER]: reliabilityEngineerRole.id,
    [UserRole.FINANCE_CONTROLLER]: financeControllerRole.id,
    [UserRole.REQUESTER]: requesterRole.id,
    [UserRole.VIEWER]: viewerRole.id,
    [UserRole.MANAGER]: managerRole.id,
  };

  // ========================================
  // CREATE SUPER-ADMIN USER
  // ========================================
  console.log('🔑 Ensuring super-admin user exists...');
  let superAdminUser = await userRepo.findOne({ where: { email: 'superadmin@system.local' } });
  if (!superAdminUser) {
    const hashedPassword = await bcrypt.hash('Admin@12345', 10);
    superAdminUser = await userRepo.save({
      email: 'superadmin@system.local',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Administrator',
      roleId: superAdminRole.id,
      status: UserStatus.ACTIVE,
      isActive: true,
      companyId: null, // Super-admin doesn't belong to any company
      emailVerified: true,
    });
    console.log('✅ Created super-admin user:', superAdminUser.email);
  } else {
    console.log('✅ Super-admin user already exists');
  }

  // ========================================
  // CREATE VENDOR COMPANY
  // ========================================
  console.log('🏢 Ensuring vendor company exists...');
  let vendorCompany = await companyRepo.findOne({ where: { name: 'Tech Services Ltd.' } });
  if (!vendorCompany) {
    vendorCompany = await companyRepo.save({
      name: 'Tech Services Ltd.',
      type: OrganizationType.VENDOR,
      organizationTypeId: vendorOrgType.id, // Link to organization type
      website: 'https://techservices.com',
      workEmail: 'contact@techservices.com',
      verifiedDomain: 'techservices.com',
      isDomainVerified: true,
      status: CompanyStatus.ACTIVE,
      emailValidationMode: EmailValidationMode.STRICT,
      address: '123 Service Street, Business District',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
      postalCode: '100001',
      phone: '+234-800-TECH-SVC',
      industry: 'Technology Services',
      contactInfo: {
        email: 'contact@techservices.com',
        phone: '+234-800-TECH-SVC',
        website: 'https://techservices.com',
      },
      settings: {
        timezone: 'Africa/Lagos',
        currency: 'NGN',
      },
      approvedBy: superAdminUser.id,
      approvedAt: new Date(),
    });
    console.log('✅ Created vendor company:', vendorCompany.name);
  } else {
    console.log('✅ Vendor company already exists');
  }

  // ========================================
  // CREATE CLIENT COMPANY
  // ========================================
  console.log('🏢 Ensuring client company exists...');
  let clientCompany = await companyRepo.findOne({ where: { name: 'ACME Corporation' } });
  if (!clientCompany) {
    clientCompany = await companyRepo.save({
      name: 'ACME Corporation',
      type: OrganizationType.CLIENT,
      organizationTypeId: clientOrgType.id, // Link to organization type
      website: 'https://acmecorp.com',
      workEmail: 'contact@acmecorp.com',
      verifiedDomain: 'acmecorp.com',
      isDomainVerified: true,
      status: CompanyStatus.ACTIVE,
      emailValidationMode: EmailValidationMode.FLEXIBLE,
      address: '456 Enterprise Avenue, Industrial Zone',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
      postalCode: '100002',
      phone: '+234-800-ACME-CO',
      industry: 'Manufacturing',
      contactInfo: {
        email: 'contact@acmecorp.com',
        phone: '+234-800-ACME-CO',
        website: 'https://acmecorp.com',
      },
      settings: {
        timezone: 'Africa/Lagos',
        currency: 'NGN',
      },
      approvedBy: superAdminUser.id,
      approvedAt: new Date(),
    });
    console.log('✅ Created client company:', clientCompany.name);
  } else {
    console.log('✅ Client company already exists');
  }

  // ========================================
  // CREATE VENDOR USERS (Based on README roles)
  // ========================================
  console.log('👤 Creating vendor users...');
  const vendorUsers = [
    {
      email: 'admin@techservices.com',
      firstName: 'Company',
      lastName: 'Admin',
      role: UserRole.COMPANY_ADMIN,
    },
    {
      email: 'maint.manager@techservices.com',
      firstName: 'John',
      lastName: 'Manager',
      role: UserRole.MAINTENANCE_MANAGER,
    },
    {
      email: 'supervisor@techservices.com',
      firstName: 'Sarah',
      lastName: 'Supervisor',
      role: UserRole.MAINTENANCE_SUPERVISOR,
    },
    {
      email: 'planner@techservices.com',
      firstName: 'Mike',
      lastName: 'Planner',
      role: UserRole.PLANNER_SCHEDULER,
    },
    {
      email: 'technician@techservices.com',
      firstName: 'David',
      lastName: 'Technician',
      role: UserRole.TECHNICIAN,
    },
    {
      email: 'storekeeper@techservices.com',
      firstName: 'Lisa',
      lastName: 'Store',
      role: UserRole.STOREKEEPER,
    },
    {
      email: 'reliability@techservices.com',
      firstName: 'James',
      lastName: 'Engineer',
      role: UserRole.RELIABILITY_ENGINEER,
    },
    {
      email: 'finance@techservices.com',
      firstName: 'Emma',
      lastName: 'Finance',
      role: UserRole.FINANCE_CONTROLLER,
    },
  ];

  for (const userData of vendorUsers) {
    const existingUser = await userRepo.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      const hashedPass = await bcrypt.hash('Password123!', 10);
      await userRepo.save({
        email: userData.email,
        passwordHash: hashedPass,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: roleMap[userData.role],
        companyId: vendorCompany.id,
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: true,
      });
      console.log(`  ✅ Created user: ${userData.email}`);
    } else {
      console.log(`  ⏭️  User already exists: ${userData.email}`);
    }
  }

  // ========================================
  // CREATE CLIENT USERS (Based on README roles)
  // ========================================
  console.log('👤 Creating client users...');
  const clientUsers = [
    {
      email: 'viewer@acmecorp.com',
      firstName: 'Alice',
      lastName: 'Viewer',
      role: UserRole.VIEWER,
    },
    {
      email: 'requester@acmecorp.com',
      firstName: 'Bob',
      lastName: 'Requester',
      role: UserRole.REQUESTER,
    },
    {
      email: 'manager@acmecorp.com',
      firstName: 'Carol',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  ];

  for (const userData of clientUsers) {
    const existingUser = await userRepo.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      const hashedPass = await bcrypt.hash('Password123!', 10);
      await userRepo.save({
        email: userData.email,
        passwordHash: hashedPass,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: roleMap[userData.role],
        companyId: clientCompany.id,
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: true,
      });
      console.log(`  ✅ Created user: ${userData.email}`);
    } else {
      console.log(`  ⏭️  User already exists: ${userData.email}`);
    }
  }

  // ========================================
  // CREATE INVITED EMPLOYEES (PENDING)
  // ========================================
  console.log('📧 Creating invited employees...');
  const invitedEmployees = [
    {
      email: 'engineer@techservices.com',
      firstName: 'Robert',
      lastName: 'Engineer',
      role: UserRole.TECHNICIAN,
      companyId: vendorCompany.id,
    },
    {
      email: 'analyst@acmecorp.com',
      firstName: 'Diana',
      lastName: 'Analyst',
      role: UserRole.VIEWER,
      companyId: clientCompany.id,
    },
  ];

  for (const invitedUser of invitedEmployees) {
    const existingUser = await userRepo.findOne({ where: { email: invitedUser.email } });
    if (!existingUser) {
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const tempPassword = await bcrypt.hash('TempPassword@123', 10); // Temporary, will be set during invitation acceptance
      await userRepo.save({
        email: invitedUser.email,
        passwordHash: tempPassword,
        firstName: invitedUser.firstName,
        lastName: invitedUser.lastName,
        roleId: roleMap[invitedUser.role],
        companyId: invitedUser.companyId,
        status: UserStatus.PENDING_VERIFICATION,
        isActive: false,
        emailVerified: false,
        invitationToken,
        invitationAccepted: false,
        invitedBy: superAdminUser.id,
      });
      console.log(`  ✅ Invited user: ${invitedUser.email} (Token: ${invitationToken.substring(0, 16)}...)`);
    } else {
      console.log(`  ⏭️  Invited user already exists: ${invitedUser.email}`);
    }
  }

  // ========================================
  // CREATE OR GET ORGANIZATIONS (Mapped from Companies)
  // ========================================
  console.log('🏢 Ensuring organizations exist...');
  // Check if vendor organization exists
  let vendorOrganization = await organizationRepo.findOne({ where: { name: 'Tech Services Ltd.' } });
  if (!vendorOrganization) {
    vendorOrganization = await organizationRepo.save({
      name: 'Tech Services Ltd.',
      type: OrganizationType.VENDOR,
      organizationTypeId: vendorOrgType.id, // Link to organization type
      address: '123 Service Street, Business District',
      contactInfo: {
        email: 'contact@techservices.com',
        phone: '+234-800-TECH-SVC',
      },
      status: OrganizationStatus.ACTIVE,
    });
    console.log('✅ Created vendor organization');
  } else {
    console.log('✅ Vendor organization already exists');
  }

  // Check if client organization exists
  let clientOrganization = await organizationRepo.findOne({ where: { name: 'ACME Corporation' } });
  if (!clientOrganization) {
    clientOrganization = await organizationRepo.save({
      name: 'ACME Corporation',
      type: OrganizationType.CLIENT,
      organizationTypeId: clientOrgType.id, // Link to organization type
      address: '456 Enterprise Avenue, Industrial Zone',
      contactInfo: {
        email: 'contact@acmecorp.com',
        phone: '+234-800-ACME-CO',
      },
      status: OrganizationStatus.ACTIVE,
    });
    console.log('✅ Created client organization');
  } else {
    console.log('✅ Client organization already exists');
  }

  // ========================================
  // CREATE ASSET LOCATIONS
  // ========================================
  console.log('📍 Creating asset locations...');
  const locations = [
    {
      locationName: 'Main Building - Floor 1',
      address: '456 Enterprise Avenue, Floor 1',
      region: 'Central',
      clientOrgId: clientOrganization.id,
    },
    {
      locationName: 'Main Building - Floor 2',
      address: '456 Enterprise Avenue, Floor 2',
      region: 'Central',
      clientOrgId: clientOrganization.id,
    },
    {
      locationName: 'Warehouse A',
      address: '789 Warehouse Road, Building A',
      region: 'North Zone',
      clientOrgId: clientOrganization.id,
    },
    {
      locationName: 'Factory Floor',
      address: '456 Enterprise Avenue, Production Area',
      region: 'Central',
      clientOrgId: clientOrganization.id,
    },
  ];

  const createdLocations = [];
  for (const location of locations) {
    const savedLocation = await assetLocationRepo.save(location);
    createdLocations.push(savedLocation);
    console.log(`  ✅ Created location: ${location.locationName}`);
  }

  // ========================================
  // CREATE ASSETS
  // ========================================
  console.log('🏭 Creating assets...');
  const assets = [
    // HVAC Systems
    {
      assetCode: 'HVAC-001',
      name: 'Central Air Conditioning Unit 1',
      type: 'HVAC',
      locationId: createdLocations[0].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Carrier',
      model: 'AquaEdge 19DV',
      serialNumber: 'CAR-2023-HVAC-001',
      installedDate: new Date('2023-01-15'),
      warrantyExpiry: new Date('2026-01-15'),
      description: 'Main HVAC unit for Floor 1 climate control',
      specifications: {
        capacity: '100 Tons',
        powerRating: '350kW',
        refrigerant: 'R-134a',
        coolingType: 'Water-cooled',
      },
    },
    {
      assetCode: 'HVAC-002',
      name: 'Central Air Conditioning Unit 2',
      type: 'HVAC',
      locationId: createdLocations[1].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Trane',
      model: 'Centraflow XL',
      serialNumber: 'TRN-2023-HVAC-002',
      installedDate: new Date('2023-02-20'),
      warrantyExpiry: new Date('2026-02-20'),
      description: 'Main HVAC unit for Floor 2 climate control',
      specifications: {
        capacity: '80 Tons',
        powerRating: '280kW',
        refrigerant: 'R-410A',
        coolingType: 'Air-cooled',
      },
    },
    {
      assetCode: 'HVAC-003',
      name: 'Warehouse Ventilation System',
      type: 'HVAC',
      locationId: createdLocations[2].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.UNDER_MAINTENANCE,
      manufacturer: 'Daikin',
      model: 'VRV IV',
      serialNumber: 'DAI-2022-VENT-001',
      installedDate: new Date('2022-06-10'),
      warrantyExpiry: new Date('2025-06-10'),
      description: 'Industrial ventilation system for warehouse',
      specifications: {
        capacity: '50 Tons',
        powerRating: '180kW',
        airflow: '12,000 CFM',
      },
    },
    // Electrical Systems
    {
      assetCode: 'ELEC-001',
      name: 'Main Distribution Panel A',
      type: 'Electrical',
      locationId: createdLocations[0].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Schneider Electric',
      model: 'Prisma Plus P',
      serialNumber: 'SCH-2023-MDP-001',
      installedDate: new Date('2023-01-05'),
      warrantyExpiry: new Date('2028-01-05'),
      description: 'Main electrical distribution panel for Floor 1',
      specifications: {
        voltage: '400V',
        frequency: '50Hz',
        rating: '2000A',
        phases: 3,
      },
    },
    {
      assetCode: 'ELEC-002',
      name: 'Emergency Generator',
      type: 'Electrical',
      locationId: createdLocations[3].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Caterpillar',
      model: 'C18 ACERT',
      serialNumber: 'CAT-2022-GEN-001',
      installedDate: new Date('2022-11-20'),
      warrantyExpiry: new Date('2025-11-20'),
      description: 'Backup diesel generator for emergency power',
      specifications: {
        capacity: '500kVA',
        fuelType: 'Diesel',
        tankCapacity: '1000L',
        runtime: '24 hours',
      },
    },
    // Plumbing Systems
    {
      assetCode: 'PLUMB-001',
      name: 'Main Water Pump 1',
      type: 'Plumbing',
      locationId: createdLocations[0].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Grundfos',
      model: 'CR 64-5',
      serialNumber: 'GRU-2023-PUMP-001',
      installedDate: new Date('2023-03-10'),
      warrantyExpiry: new Date('2026-03-10'),
      description: 'Primary water circulation pump',
      specifications: {
        flow: '500 m³/h',
        head: '50 m',
        power: '75kW',
        material: 'Stainless Steel',
      },
    },
    {
      assetCode: 'PLUMB-002',
      name: 'Fire Suppression System',
      type: 'Safety',
      locationId: createdLocations[2].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Tyco',
      model: 'Wet Pipe Sprinkler',
      serialNumber: 'TYC-2022-FIRE-001',
      installedDate: new Date('2022-08-15'),
      warrantyExpiry: new Date('2027-08-15'),
      description: 'Warehouse fire suppression and sprinkler system',
      specifications: {
        coverage: '5000 sqm',
        heads: 150,
        waterPressure: '7 bar',
        activationType: 'Automatic',
      },
    },
    // Manufacturing Equipment
    {
      assetCode: 'MFG-001',
      name: 'CNC Machining Center',
      type: 'Manufacturing',
      locationId: createdLocations[3].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.ACTIVE,
      manufacturer: 'Haas Automation',
      model: 'VF-4SS',
      serialNumber: 'HAAS-2021-CNC-001',
      installedDate: new Date('2021-09-01'),
      warrantyExpiry: new Date('2024-09-01'),
      description: 'Vertical machining center for precision parts',
      specifications: {
        travel: 'X40" Y20" Z25"',
        spindle: '12,000 RPM',
        power: '30HP',
        toolChanger: '24 positions',
      },
    },
    {
      assetCode: 'MFG-002',
      name: 'Industrial Conveyor Belt',
      type: 'Manufacturing',
      locationId: createdLocations[3].locationId,
      organizationId: clientOrganization.id,
      status: AssetStatus.INACTIVE,
      manufacturer: 'Flexco',
      model: 'Belt Tracker',
      serialNumber: 'FLX-2020-CONV-001',
      installedDate: new Date('2020-05-20'),
      warrantyExpiry: new Date('2023-05-20'),
      description: 'Main production line conveyor system',
      specifications: {
        length: '50 meters',
        width: '1200mm',
        speed: '1.5 m/s',
        loadCapacity: '500 kg/m',
      },
    },
  ];

  const createdAssets = [];
  for (const asset of assets) {
    const savedAsset = await assetRepo.save(asset);
    createdAssets.push(savedAsset);
    console.log(`  ✅ Created asset: ${asset.assetCode} - ${asset.name}`);
  }

  // ========================================
  // CREATE WORK ORDERS
  // ========================================
  console.log('📋 Creating work orders...');

  // Get some vendor users for assignment
  const technicianUser = await userRepo.findOne({ where: { email: 'technician@techservices.com' } });
  const dispatcherUser = await userRepo.findOne({ where: { email: 'dispatcher@techservices.com' } });
  const adminUser = await userRepo.findOne({ where: { email: 'admin@techservices.com' } });

  const workOrders = [
    // Preventive Maintenance
    {
      woNumber: 'WO-2024-001',
      title: 'Quarterly HVAC Maintenance - Floor 1',
      type: WorkOrderType.PREVENTIVE,
      priority: WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.COMPLETED,
      assetId: createdAssets[0].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      assignedToId: technicianUser?.id,
      createdById: adminUser?.id,
      description: 'Routine quarterly maintenance for Central AC Unit 1. Tasks include filter replacement, refrigerant level check, electrical connections inspection, and performance testing.',
      scheduledDate: new Date('2024-12-01'),
      scheduledStart: new Date('2024-12-01T08:00:00'),
      scheduledEnd: new Date('2024-12-01T12:00:00'),
      actualStart: new Date('2024-12-01T08:15:00'),
      actualEnd: new Date('2024-12-01T11:45:00'),
      estimatedCost: 2500.00,
      actualCost: 2350.00,
      checklist: [
        { item: 'Replace air filters', completed: true, mandatory: true },
        { item: 'Check refrigerant levels', completed: true, mandatory: true },
        { item: 'Inspect electrical connections', completed: true, mandatory: true },
        { item: 'Test thermostat calibration', completed: true, mandatory: false },
        { item: 'Clean condenser coils', completed: true, mandatory: true },
      ],
    },
    {
      woNumber: 'WO-2024-002',
      title: 'Monthly Generator Load Test',
      type: WorkOrderType.PREVENTIVE,
      priority: WorkOrderPriority.HIGH,
      status: WorkOrderStatus.IN_PROGRESS,
      assetId: createdAssets[4].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      assignedToId: technicianUser?.id,
      createdById: dispatcherUser?.id,
      description: 'Monthly load test for emergency generator. Run at 75% capacity for 2 hours, inspect all systems, check oil and coolant levels.',
      scheduledDate: new Date('2024-12-20'),
      scheduledStart: new Date('2024-12-20T09:00:00'),
      scheduledEnd: new Date('2024-12-20T13:00:00'),
      actualStart: new Date('2024-12-20T09:10:00'),
      estimatedCost: 800.00,
      checklist: [
        { item: 'Check fuel level', completed: true, mandatory: true },
        { item: 'Inspect battery connections', completed: true, mandatory: true },
        { item: 'Run load test (75% capacity)', completed: false, mandatory: true },
        { item: 'Check oil and coolant levels', completed: false, mandatory: true },
        { item: 'Record voltage and frequency', completed: false, mandatory: true },
      ],
    },
    // Corrective Maintenance
    {
      woNumber: 'WO-2024-003',
      title: 'URGENT: Warehouse HVAC System Failure',
      type: WorkOrderType.CORRECTIVE,
      priority: WorkOrderPriority.CRITICAL,
      status: WorkOrderStatus.ASSIGNED,
      assetId: createdAssets[2].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      assignedToId: technicianUser?.id,
      createdById: adminUser?.id,
      description: 'Warehouse ventilation system has completely stopped working. Temperature rising rapidly. Requires immediate attention. Suspect compressor failure.',
      scheduledDate: new Date('2024-12-21'),
      scheduledStart: new Date('2024-12-21T06:00:00'),
      scheduledEnd: new Date('2024-12-21T18:00:00'),
      dueDate: new Date('2024-12-21T23:59:59'),
      estimatedCost: 15000.00,
      checklist: [
        { item: 'Diagnose root cause', completed: false, mandatory: true },
        { item: 'Replace faulty components', completed: false, mandatory: true },
        { item: 'Test system functionality', completed: false, mandatory: true },
        { item: 'Verify temperature control', completed: false, mandatory: true },
      ],
    },
    {
      woNumber: 'WO-2024-004',
      title: 'Water Pump Vibration Issue',
      type: WorkOrderType.CORRECTIVE,
      priority: WorkOrderPriority.HIGH,
      status: WorkOrderStatus.PENDING_APPROVAL,
      assetId: createdAssets[5].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      createdById: technicianUser?.id,
      description: 'Main water pump showing excessive vibration and unusual noise. Inspection reveals potential bearing wear. Recommend bearing replacement before complete failure.',
      scheduledDate: new Date('2024-12-23'),
      estimatedCost: 5500.00,
      checklist: [
        { item: 'Shutdown and isolate pump', completed: false, mandatory: true },
        { item: 'Replace worn bearings', completed: false, mandatory: true },
        { item: 'Balance impeller', completed: false, mandatory: false },
        { item: 'Restart and test', completed: false, mandatory: true },
      ],
    },
    // Predictive Maintenance
    {
      woNumber: 'WO-2024-005',
      title: 'CNC Machine Predictive Maintenance',
      type: WorkOrderType.PREDICTIVE,
      priority: WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.APPROVED,
      assetId: createdAssets[7].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      assignedToId: technicianUser?.id,
      createdById: adminUser?.id,
      description: 'Predictive analytics indicate potential spindle bearing wear based on vibration analysis. Schedule maintenance before failure occurs.',
      scheduledDate: new Date('2024-12-28'),
      scheduledStart: new Date('2024-12-28T07:00:00'),
      scheduledEnd: new Date('2024-12-28T19:00:00'),
      estimatedCost: 12000.00,
      checklist: [
        { item: 'Perform detailed vibration analysis', completed: false, mandatory: true },
        { item: 'Replace spindle bearings if needed', completed: false, mandatory: true },
        { item: 'Calibrate spindle alignment', completed: false, mandatory: true },
        { item: 'Run test programs', completed: false, mandatory: true },
      ],
    },
    {
      woNumber: 'WO-2024-006',
      title: 'Electrical Panel Thermal Inspection',
      type: WorkOrderType.PREDICTIVE,
      priority: WorkOrderPriority.LOW,
      status: WorkOrderStatus.DRAFT,
      assetId: createdAssets[3].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      createdById: dispatcherUser?.id,
      description: 'Annual thermal imaging inspection of main distribution panel to identify hot spots and potential failures.',
      scheduledDate: new Date('2025-01-10'),
      estimatedCost: 1500.00,
      checklist: [
        { item: 'Conduct thermal imaging scan', completed: false, mandatory: true },
        { item: 'Identify hot spots', completed: false, mandatory: true },
        { item: 'Check all connections', completed: false, mandatory: true },
        { item: 'Generate inspection report', completed: false, mandatory: true },
      ],
    },
    // More Work Orders
    {
      woNumber: 'WO-2024-007',
      title: 'Fire Suppression System Annual Test',
      type: WorkOrderType.PREVENTIVE,
      priority: WorkOrderPriority.HIGH,
      status: WorkOrderStatus.CLOSED,
      assetId: createdAssets[6].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      assignedToId: technicianUser?.id,
      createdById: adminUser?.id,
      description: 'Annual compliance test for fire suppression system. All sprinkler heads tested, water pressure verified, alarm systems checked.',
      scheduledDate: new Date('2024-11-15'),
      scheduledStart: new Date('2024-11-15T08:00:00'),
      scheduledEnd: new Date('2024-11-15T16:00:00'),
      actualStart: new Date('2024-11-15T08:00:00'),
      actualEnd: new Date('2024-11-15T15:30:00'),
      estimatedCost: 3000.00,
      actualCost: 2900.00,
      checklist: [
        { item: 'Test all sprinkler heads', completed: true, mandatory: true },
        { item: 'Verify water pressure', completed: true, mandatory: true },
        { item: 'Test alarm systems', completed: true, mandatory: true },
        { item: 'Check emergency shutoff valves', completed: true, mandatory: true },
        { item: 'Update compliance certificate', completed: true, mandatory: true },
      ],
    },
    {
      woNumber: 'WO-2024-008',
      title: 'Conveyor Belt Repair',
      type: WorkOrderType.CORRECTIVE,
      priority: WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.CANCELLED,
      assetId: createdAssets[8].id,
      clientOrgId: clientOrganization.id,
      vendorOrgId: vendorOrganization.id,
      createdById: dispatcherUser?.id,
      description: 'Conveyor belt showing signs of wear. Scheduled for repair but cancelled due to decision to replace entire system.',
      scheduledDate: new Date('2024-12-15'),
      estimatedCost: 4000.00,
      checklist: [
        { item: 'Inspect belt wear', completed: false, mandatory: true },
        { item: 'Replace worn sections', completed: false, mandatory: true },
      ],
    },
  ];

  for (const wo of workOrders) {
    await workOrderRepo.save(wo);
    console.log(`  ✅ Created work order: ${wo.woNumber} - ${wo.title}`);
  }

  // ========================================
  // CREATE INVENTORY LOCATIONS
  // ========================================
  console.log('📍 Creating inventory locations...');
  const inventoryLocationRepo = dataSource.getRepository(InventoryLocation);
  const inventoryLocations = [
    { name: 'Main Warehouse', code: 'WH-MAIN', description: 'Primary warehouse for all inventory', building: 'Warehouse A', zone: 'A', isActive: true },
    { name: 'Secondary Warehouse', code: 'WH-SEC', description: 'Secondary storage facility', building: 'Warehouse B', zone: 'B', isActive: true },
    { name: 'Tool Storage Room', code: 'TSR-001', description: 'Secure storage for specialized tools', building: 'Main Building', floor: '1', room: '101', isActive: true },
    { name: 'Spare Parts Storage', code: 'SPS-001', description: 'Storage for equipment spare parts', building: 'Warehouse A', zone: 'C', aisle: '1', isActive: true },
    { name: 'Electrical Components', code: 'ELEC-STR', description: 'Electrical components and supplies', building: 'Warehouse A', zone: 'D', aisle: '2', rack: 'R1', isActive: true },
    { name: 'HVAC Parts', code: 'HVAC-STR', description: 'HVAC components and replacement parts', building: 'Warehouse A', zone: 'E', aisle: '3', rack: 'R2', isActive: true },
    { name: 'Safety Equipment', code: 'SAFETY-STR', description: 'Safety gear and equipment storage', building: 'Main Building', floor: '1', room: '102', isActive: true },
    { name: 'Chemicals Storage', code: 'CHEM-STR', description: 'Controlled storage for chemicals', building: 'Warehouse B', zone: 'F', isActive: true },
  ];
  for (const loc of inventoryLocations) {
    const existing = await inventoryLocationRepo.findOne({ where: { code: loc.code } });
    if (!existing) {
      await inventoryLocationRepo.save(loc);
      console.log(`  ✅ Created inventory location: ${loc.name}`);
    } else {
      console.log(`  ⏭️  Location already exists: ${loc.name}`);
    }
  }

  // ========================================
  // CREATE MANUFACTURERS
  // ========================================
  console.log('🏭 Creating manufacturers...');
  const manufacturerRepo = dataSource.getRepository(Manufacturer);
  const manufacturers = [
    { name: 'Carrier Corporation', code: 'CARRIER', description: 'Leading HVAC manufacturer', website: 'https://carrier.com', country: 'USA', isActive: true },
    { name: 'Trane Technologies', code: 'TRANE', description: 'HVAC and building solutions', website: 'https://trane.com', country: 'USA', isActive: true },
    { name: 'Schneider Electric', code: 'SCHNEIDER', description: 'Electrical equipment and automation', website: 'https://se.com', country: 'France', isActive: true },
    { name: 'Siemens AG', code: 'SIEMENS', description: 'Industrial automation and drives', website: 'https://siemens.com', country: 'Germany', isActive: true },
    { name: 'Daikin Industries', code: 'DAIKIN', description: 'Air conditioning systems', website: 'https://daikin.com', country: 'Japan', isActive: true },
    { name: 'Grundfos', code: 'GRUNDFOS', description: 'Pump manufacturer', website: 'https://grundfos.com', country: 'Denmark', isActive: true },
    { name: 'Caterpillar Inc.', code: 'CAT', description: 'Heavy equipment and generators', website: 'https://cat.com', country: 'USA', isActive: true },
    { name: 'ABB Ltd', code: 'ABB', description: 'Robotics and power equipment', website: 'https://abb.com', country: 'Switzerland', isActive: true },
    { name: 'Honeywell International', code: 'HONEYWELL', description: 'Building technologies and automation', website: 'https://honeywell.com', country: 'USA', isActive: true },
    { name: 'Johnson Controls', code: 'JCI', description: 'Building efficiency solutions', website: 'https://johnsoncontrols.com', country: 'USA', isActive: true },
  ];
  for (const mfr of manufacturers) {
    const existing = await manufacturerRepo.findOne({ where: { code: mfr.code } });
    if (!existing) {
      await manufacturerRepo.save(mfr);
      console.log(`  ✅ Created manufacturer: ${mfr.name}`);
    } else {
      console.log(`  ⏭️  Manufacturer already exists: ${mfr.name}`);
    }
  }

  // ========================================
  // CREATE SUPPLIERS
  // ========================================
  console.log('🚚 Creating suppliers...');
  const supplierRepo = dataSource.getRepository(Supplier);
  const suppliers = [
    { name: 'Industrial Supply Co.', code: 'IND-SUP', description: 'General industrial supplies', email: 'sales@industrialsupply.com', phone: '+234-800-IND-SUP', paymentTerms: 'Net 30', rating: 4.5, isActive: true, isPreferred: true },
    { name: 'HVAC Direct', code: 'HVAC-DIR', description: 'HVAC parts and supplies', email: 'orders@hvacdirect.com', phone: '+234-800-HVAC-DR', paymentTerms: 'Net 45', rating: 4.2, isActive: true, isPreferred: true },
    { name: 'Electrical Wholesale', code: 'ELEC-WH', description: 'Electrical components wholesaler', email: 'sales@electricalwholesale.com', phone: '+234-800-ELEC-WH', paymentTerms: 'Net 30', rating: 4.0, isActive: true, isPreferred: false },
    { name: 'Safety First Supplies', code: 'SAFETY-1', description: 'Safety equipment supplier', email: 'orders@safetyfirst.com', phone: '+234-800-SAFE-01', paymentTerms: 'Net 15', rating: 4.8, isActive: true, isPreferred: true },
    { name: 'Plumbing Parts Plus', code: 'PLUMB-PP', description: 'Plumbing supplies and parts', email: 'sales@plumbingpartsplus.com', phone: '+234-800-PLUM-PP', paymentTerms: 'Net 30', rating: 3.8, isActive: true, isPreferred: false },
    { name: 'Tool Depot', code: 'TOOL-DEP', description: 'Professional tools supplier', email: 'orders@tooldepot.com', phone: '+234-800-TOOL-DP', paymentTerms: 'Net 30', rating: 4.3, isActive: true, isPreferred: true },
    { name: 'Chemical Solutions Ltd.', code: 'CHEM-SOL', description: 'Industrial chemicals supplier', email: 'sales@chemsolutions.com', phone: '+234-800-CHEM-SL', paymentTerms: 'Net 60', rating: 4.1, isActive: true, isPreferred: false },
    { name: 'FastParts Express', code: 'FAST-PTS', description: 'Rapid delivery parts supplier', email: 'orders@fastparts.com', phone: '+234-800-FAST-PT', paymentTerms: 'COD', rating: 4.6, isActive: true, isPreferred: true },
  ];
  for (const sup of suppliers) {
    const existing = await supplierRepo.findOne({ where: { code: sup.code } });
    if (!existing) {
      await supplierRepo.save(sup);
      console.log(`  ✅ Created supplier: ${sup.name}`);
    } else {
      console.log(`  ⏭️  Supplier already exists: ${sup.name}`);
    }
  }

  // ========================================
  // CREATE INVENTORY CATEGORIES
  // ========================================
  console.log('📦 Creating inventory categories...');
  const categoryRepo = dataSource.getRepository(InventoryCategory);
  const categories = [
    { name: 'HVAC Parts', code: 'CAT-HVAC', description: 'Heating, ventilation, and air conditioning parts', icon: '❄️', color: '#3B82F6', sortOrder: 1, isActive: true },
    { name: 'Electrical Components', code: 'CAT-ELEC', description: 'Electrical parts and components', icon: '⚡', color: '#F59E0B', sortOrder: 2, isActive: true },
    { name: 'Plumbing Supplies', code: 'CAT-PLUMB', description: 'Plumbing parts and supplies', icon: '🔧', color: '#10B981', sortOrder: 3, isActive: true },
    { name: 'Safety Equipment', code: 'CAT-SAFETY', description: 'Personal protective equipment and safety gear', icon: '🦺', color: '#EF4444', sortOrder: 4, isActive: true },
    { name: 'Tools', code: 'CAT-TOOLS', description: 'Hand tools and power tools', icon: '🔨', color: '#6B7280', sortOrder: 5, isActive: true },
    { name: 'Lubricants & Chemicals', code: 'CAT-CHEM', description: 'Oils, lubricants, and chemicals', icon: '🧪', color: '#8B5CF6', sortOrder: 6, isActive: true },
    { name: 'Filters', code: 'CAT-FILT', description: 'Air, oil, and water filters', icon: '🌀', color: '#06B6D4', sortOrder: 7, isActive: true },
    { name: 'Fasteners', code: 'CAT-FAST', description: 'Bolts, nuts, screws, and fasteners', icon: '🔩', color: '#84CC16', sortOrder: 8, isActive: true },
    { name: 'Bearings & Seals', code: 'CAT-BEAR', description: 'Bearings, seals, and gaskets', icon: '⭕', color: '#F97316', sortOrder: 9, isActive: true },
    { name: 'Motors & Drives', code: 'CAT-MOTOR', description: 'Electric motors and drives', icon: '⚙️', color: '#0EA5E9', sortOrder: 10, isActive: true },
  ];
  for (const cat of categories) {
    const existing = await categoryRepo.findOne({ where: { code: cat.code } });
    if (!existing) {
      await categoryRepo.save(cat);
      console.log(`  ✅ Created category: ${cat.name}`);
    } else {
      console.log(`  ⏭️  Category already exists: ${cat.name}`);
    }
  }

  // ========================================
  // CREATE INVENTORY ITEMS FOR ALL ORGANIZATIONS
  // ========================================
  console.log('📦 Creating inventory items for all organizations...');
  const inventoryRepo = dataSource.getRepository(Inventory);

  // Get all organizations
  const allOrganizations = await organizationRepo.find();
  console.log(`  Found ${allOrganizations.length} organizations to seed inventory for`);

  // Base inventory items template
  const baseInventoryItems = [
    // HVAC Parts
    { name: 'Air Filter 20x25x1', description: 'Standard HVAC air filter', category: InventoryCategoryEnum.SPARE_PARTS, quantity: 150, minQuantity: 20, maxQuantity: 200, unit: 'pieces', unitPrice: 12.50, location: 'WH-MAIN-A1', supplier: 'HVAC Direct', manufacturer: 'Carrier', partNumber: 'CF-20251', status: InventoryStatus.ACTIVE },
    { name: 'Refrigerant R-410A (25lb)', description: 'Puron refrigerant for AC systems', category: InventoryCategoryEnum.CONSUMABLES, quantity: 45, minQuantity: 10, maxQuantity: 100, unit: 'cans', unitPrice: 185.00, location: 'WH-MAIN-A2', supplier: 'HVAC Direct', manufacturer: 'Honeywell', partNumber: 'R410A-25', status: InventoryStatus.ACTIVE },
    { name: 'Condensate Pump', description: 'Mini condensate removal pump', category: InventoryCategoryEnum.SPARE_PARTS, quantity: 25, minQuantity: 5, maxQuantity: 50, unit: 'pieces', unitPrice: 78.00, location: 'WH-MAIN-A3', supplier: 'HVAC Direct', manufacturer: 'Little Giant', partNumber: 'CP-MINI', status: InventoryStatus.ACTIVE },
    { name: 'Thermostat Digital', description: 'Programmable digital thermostat', category: InventoryCategoryEnum.EQUIPMENT, quantity: 18, minQuantity: 5, maxQuantity: 30, unit: 'pieces', unitPrice: 125.00, location: 'WH-MAIN-A4', supplier: 'Industrial Supply Co.', manufacturer: 'Honeywell', partNumber: 'TH8321', status: InventoryStatus.ACTIVE },
    { name: 'Evaporator Coil', description: 'Replacement evaporator coil', category: InventoryCategoryEnum.SPARE_PARTS, quantity: 8, minQuantity: 2, maxQuantity: 15, unit: 'pieces', unitPrice: 450.00, location: 'WH-MAIN-A5', supplier: 'HVAC Direct', manufacturer: 'Trane', partNumber: 'EC-2500', status: InventoryStatus.ACTIVE },

    // Electrical Components
    { name: 'Circuit Breaker 20A', description: '20 Amp single pole breaker', category: InventoryCategoryEnum.ELECTRICAL, quantity: 75, minQuantity: 20, maxQuantity: 150, unit: 'pieces', unitPrice: 15.00, location: 'WH-MAIN-B1', supplier: 'Electrical Wholesale', manufacturer: 'Schneider', partNumber: 'CB-20A-SP', status: InventoryStatus.ACTIVE },
    { name: 'Electrical Wire 12AWG (500ft)', description: 'Copper wire for general wiring', category: InventoryCategoryEnum.ELECTRICAL, quantity: 30, minQuantity: 5, maxQuantity: 50, unit: 'rolls', unitPrice: 145.00, location: 'WH-MAIN-B2', supplier: 'Electrical Wholesale', manufacturer: 'Southwire', partNumber: '12AWG-500', status: InventoryStatus.ACTIVE },
    { name: 'Contactor 40A', description: '3-pole electrical contactor', category: InventoryCategoryEnum.ELECTRICAL, quantity: 12, minQuantity: 3, maxQuantity: 25, unit: 'pieces', unitPrice: 85.00, location: 'WH-MAIN-B3', supplier: 'Electrical Wholesale', manufacturer: 'ABB', partNumber: 'AF40-3P', status: InventoryStatus.ACTIVE },
    { name: 'LED Panel Light 2x4', description: 'Office LED panel light fixture', category: InventoryCategoryEnum.ELECTRICAL, quantity: 5, minQuantity: 10, maxQuantity: 40, unit: 'pieces', unitPrice: 65.00, location: 'WH-MAIN-B4', supplier: 'Industrial Supply Co.', manufacturer: 'Philips', partNumber: 'LED-2X4-40W', status: InventoryStatus.LOW_STOCK },

    // Plumbing Supplies
    { name: 'PVC Pipe 4" (10ft)', description: 'Schedule 40 PVC drain pipe', category: InventoryCategoryEnum.SPARE_PARTS, quantity: 60, minQuantity: 15, maxQuantity: 100, unit: 'pieces', unitPrice: 28.00, location: 'WH-MAIN-C1', supplier: 'Plumbing Parts Plus', manufacturer: 'Charlotte Pipe', partNumber: 'PVC-4-10', status: InventoryStatus.ACTIVE },
    { name: 'Ball Valve 2"', description: 'Brass ball valve', category: InventoryCategoryEnum.SPARE_PARTS, quantity: 35, minQuantity: 10, maxQuantity: 60, unit: 'pieces', unitPrice: 42.00, location: 'WH-MAIN-C2', supplier: 'Plumbing Parts Plus', manufacturer: 'Nibco', partNumber: 'BV-2-BRASS', status: InventoryStatus.ACTIVE },
    { name: 'Pump Seal Kit', description: 'Universal pump seal replacement kit', category: InventoryCategoryEnum.SPARE_PARTS, quantity: 20, minQuantity: 5, maxQuantity: 40, unit: 'kits', unitPrice: 55.00, location: 'WH-MAIN-C3', supplier: 'Industrial Supply Co.', manufacturer: 'Grundfos', partNumber: 'PSK-UNI', status: InventoryStatus.ACTIVE },

    // Safety Equipment
    { name: 'Safety Glasses (Pack of 12)', description: 'Clear safety glasses', category: InventoryCategoryEnum.SAFETY, quantity: 40, minQuantity: 10, maxQuantity: 80, unit: 'packs', unitPrice: 35.00, location: 'WH-MAIN-D1', supplier: 'Safety First Supplies', manufacturer: '3M', partNumber: 'SG-CLR-12', status: InventoryStatus.ACTIVE },
    { name: 'Work Gloves Large (Box)', description: 'Leather work gloves - large', category: InventoryCategoryEnum.SAFETY, quantity: 25, minQuantity: 5, maxQuantity: 50, unit: 'boxes', unitPrice: 48.00, location: 'WH-MAIN-D2', supplier: 'Safety First Supplies', manufacturer: 'Wells Lamont', partNumber: 'WG-LTH-LG', status: InventoryStatus.ACTIVE },
    { name: 'Hard Hat - Yellow', description: 'Type I safety hard hat', category: InventoryCategoryEnum.SAFETY, quantity: 0, minQuantity: 10, maxQuantity: 30, unit: 'pieces', unitPrice: 22.00, location: 'WH-MAIN-D3', supplier: 'Safety First Supplies', manufacturer: 'MSA', partNumber: 'HH-YLW-T1', status: InventoryStatus.OUT_OF_STOCK },

    // Tools
    { name: 'Multimeter Digital', description: 'Professional digital multimeter', category: InventoryCategoryEnum.TOOLS, quantity: 8, minQuantity: 2, maxQuantity: 15, unit: 'pieces', unitPrice: 175.00, location: 'WH-MAIN-E1', supplier: 'Tool Depot', manufacturer: 'Fluke', partNumber: 'DMM-117', status: InventoryStatus.ACTIVE },
    { name: 'Pipe Wrench 18"', description: 'Heavy duty pipe wrench', category: InventoryCategoryEnum.TOOLS, quantity: 12, minQuantity: 3, maxQuantity: 20, unit: 'pieces', unitPrice: 45.00, location: 'WH-MAIN-E2', supplier: 'Tool Depot', manufacturer: 'Ridgid', partNumber: 'PW-18-HD', status: InventoryStatus.ACTIVE },
    { name: 'Cordless Drill Kit', description: '20V cordless drill with batteries', category: InventoryCategoryEnum.TOOLS, quantity: 6, minQuantity: 2, maxQuantity: 10, unit: 'kits', unitPrice: 225.00, location: 'WH-MAIN-E3', supplier: 'Tool Depot', manufacturer: 'DeWalt', partNumber: 'DCD771-KIT', status: InventoryStatus.ACTIVE },
    { name: 'Torque Wrench Set', description: 'Precision torque wrench set', category: InventoryCategoryEnum.TOOLS, quantity: 4, minQuantity: 1, maxQuantity: 8, unit: 'sets', unitPrice: 350.00, location: 'WH-MAIN-E4', supplier: 'Tool Depot', manufacturer: 'Snap-On', partNumber: 'TRQ-SET', status: InventoryStatus.ACTIVE },

    // Consumables
    { name: 'Lubricating Oil (1 Gal)', description: 'General purpose machine oil', category: InventoryCategoryEnum.CONSUMABLES, quantity: 55, minQuantity: 10, maxQuantity: 100, unit: 'gallons', unitPrice: 32.00, location: 'WH-MAIN-F1', supplier: 'Chemical Solutions Ltd.', manufacturer: 'WD-40', partNumber: 'LUB-GAL', status: InventoryStatus.ACTIVE },
    { name: 'Cleaning Solvent (5 Gal)', description: 'Industrial degreaser', category: InventoryCategoryEnum.CONSUMABLES, quantity: 15, minQuantity: 5, maxQuantity: 30, unit: 'pails', unitPrice: 85.00, location: 'WH-MAIN-F2', supplier: 'Chemical Solutions Ltd.', manufacturer: 'ZEP', partNumber: 'DEG-5GAL', status: InventoryStatus.ACTIVE },
  ];

  // Generate SKU prefix from company name
  const getSkuPrefix = (companyName: string) => {
    const words = companyName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  // Create inventory items for each organization
  let totalInventoryCreated = 0;
  for (const org of allOrganizations) {
    console.log(`  Creating inventory for: ${org.name}`);
    const skuPrefix = getSkuPrefix(org.name);
    let orgItemCount = 0;

    for (let i = 0; i < baseInventoryItems.length; i++) {
      const baseItem = baseInventoryItems[i];
      const sku = `${skuPrefix}-INV-${String(i + 1).padStart(3, '0')}`;

      const existing = await inventoryRepo.findOne({ where: { sku } });
      if (!existing) {
        await inventoryRepo.save({
          ...baseItem,
          sku,
          organizationId: org.id,
        });
        orgItemCount++;
        totalInventoryCreated++;
      }
    }
    console.log(`    ✅ Created ${orgItemCount} inventory items for ${org.name}`);
  }
  console.log(`  ✅ Total inventory items created: ${totalInventoryCreated}`)

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('========================================');
  console.log('SEED SUMMARY');
  console.log('========================================');
  console.log(`Organization Types: 2 (Vendor Company, Client Organization)`);
  console.log(`Permissions: ${permissions.length}`);
  console.log(`Roles: 12 (SUPER_ADMIN + COMPANY_ADMIN + 10 others from README matrix)`);
  console.log(`Companies: 2 (1 vendor, 1 client)`);
  console.log(`Users: ${vendorUsers.length + clientUsers.length + 1 + invitedEmployees.length} (1 super-admin + ${vendorUsers.length} vendor + ${clientUsers.length} client + ${invitedEmployees.length} pending invitations)`);
  console.log(`Asset Locations: ${locations.length}`);
  console.log(`Assets: ${assets.length} (HVAC, Electrical, Plumbing, Manufacturing)`);
  console.log(`Work Orders: ${workOrders.length} (Various statuses: Draft, Pending, Approved, In Progress, Completed, Closed, Cancelled)`);
  console.log('========================================\n');
  console.log('SUPER-ADMIN CREDENTIALS:');
  console.log('Email: superadmin@system.local');
  console.log('Password: Admin@12345');
  console.log('========================================\n');
  console.log('SAMPLE CREDENTIALS (all passwords: Password123!):');
  console.log('  Vendor Admin: admin@techservices.com');
  console.log('  Client Viewer: viewer@acmecorp.com');
  console.log('========================================\n');

  await dataSource.destroy();
}

seed()
  .then(() => {
    console.log('✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
