import axios, { AxiosInstance } from 'axios';
import {
  ErpConnector,
  SyncResult,
  ConnectionTestResult,
  ErpAsset,
  ErpInventory,
  ErpWorkOrder,
  ErpPurchaseOrder,
} from './erp-connector.abstract';

/**
 * Oracle connection configuration
 */
export interface OracleConnectionConfig {
  // Oracle REST API endpoint
  baseUrl: string;
  // Oracle EBS or Cloud tenant ID
  tenantId?: string;
  // Authentication
  username: string;
  password: string;
  // OAuth configuration for Oracle Cloud
  oauthConfig?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
  };
  // API version
  apiVersion?: string;
}

/**
 * Default Oracle field mappings
 */
export const ORACLE_DEFAULT_MAPPINGS = {
  assets: {
    // Oracle eAM (Enterprise Asset Management) fields -> Internal fields
    ASSET_ID: 'externalId',
    ASSET_NUMBER: 'assetNumber',
    ASSET_DESCRIPTION: 'name',
    ASSET_GROUP: 'type',
    ASSET_CATEGORY: 'category',
    SERIAL_NUMBER: 'serialNumber',
    MANUFACTURER: 'manufacturer',
    MODEL_NUMBER: 'model',
    LOCATION: 'location',
    ASSET_STATUS: 'status',
    DATE_PURCHASED: 'purchaseDate',
    ORIGINAL_COST: 'purchasePrice',
    WARRANTY_EXPIRATION_DATE: 'warrantyExpiry',
  },
  inventory: {
    // Oracle Inventory fields -> Internal fields
    INVENTORY_ITEM_ID: 'externalId',
    ITEM_NUMBER: 'itemNumber',
    DESCRIPTION: 'name',
    LONG_DESCRIPTION: 'description',
    ITEM_TYPE: 'category',
    PRIMARY_UOM: 'unit',
    ON_HAND_QUANTITY: 'quantity',
    UNIT_PRICE: 'unitPrice',
    MIN_QUANTITY: 'minQuantity',
    MAX_QUANTITY: 'maxQuantity',
    SUBINVENTORY_CODE: 'location',
    VENDOR_NAME: 'supplier',
    MANUFACTURER_NAME: 'manufacturer',
  },
  workOrders: {
    // Oracle eAM Work Order fields -> Internal fields
    WIP_ENTITY_ID: 'externalId',
    WIP_ENTITY_NAME: 'orderNumber',
    DESCRIPTION: 'title',
    WORK_ORDER_TYPE: 'type',
    PRIORITY: 'priority',
    STATUS: 'status',
    ASSET_NUMBER: 'assetExternalId',
    SCHEDULED_START_DATE: 'scheduledDate',
    SCHEDULED_COMPLETION_DATE: 'dueDate',
    ESTIMATED_COST: 'estimatedCost',
    ACTUAL_COST: 'actualCost',
  },
  purchaseOrders: {
    // Oracle Purchasing fields -> Internal fields
    PO_HEADER_ID: 'externalId',
    PO_NUMBER: 'poNumber',
    VENDOR_ID: 'vendorId',
    VENDOR_NAME: 'vendorName',
    STATUS: 'status',
    CREATION_DATE: 'orderDate',
    EXPECTED_RECEIPT_DATE: 'expectedDeliveryDate',
    TOTAL_AMOUNT: 'totalAmount',
    CURRENCY_CODE: 'currency',
  },
};

/**
 * Oracle ERP Connector
 * Implements connection to Oracle EBS or Oracle Cloud applications
 * Uses REST APIs for integration
 */
export class OracleConnector extends ErpConnector {
  private httpClient: AxiosInstance | null = null;
  private config: OracleConnectionConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    connectionConfig: Record<string, any>,
    mappings?: Record<string, Record<string, string>>,
  ) {
    super('Oracle', connectionConfig, mappings || ORACLE_DEFAULT_MAPPINGS);
    this.config = connectionConfig as OracleConnectionConfig;
  }

  /**
   * Establish connection to Oracle system
   */
  async connect(): Promise<boolean> {
    try {
      this.logger.log('Connecting to Oracle system...');

      // Initialize HTTP client
      this.httpClient = axios.create({
        baseURL: this.config.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Set up authentication
      if (this.config.oauthConfig) {
        await this.authenticateOAuth();
      } else {
        // Basic authentication
        const credentials = Buffer.from(
          `${this.config.username}:${this.config.password}`,
        ).toString('base64');
        this.httpClient.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
      }

      // Add tenant header if provided
      if (this.config.tenantId) {
        this.httpClient.defaults.headers.common['X-Oracle-Tenant'] = this.config.tenantId;
      }

      // Test the connection
      const testResult = await this.testConnection();
      this.isConnected = testResult.success;

      if (this.isConnected) {
        this.logger.log('Successfully connected to Oracle system');
      } else {
        this.logger.error('Failed to connect to Oracle system');
      }

      return this.isConnected;
    } catch (error: any) {
      this.logger.error(`Failed to connect to Oracle: ${error.message}`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Authenticate using OAuth
   */
  private async authenticateOAuth(): Promise<void> {
    if (!this.config.oauthConfig) {
      throw new Error('OAuth configuration not provided');
    }

    try {
      const response = await axios.post(
        this.config.oauthConfig.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.oauthConfig.clientId,
          client_secret: this.config.oauthConfig.clientSecret,
          scope: this.config.oauthConfig.scope || 'urn:opc:resource:consumer::all',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      if (this.httpClient) {
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      }
    } catch (error: any) {
      throw new Error(`OAuth authentication failed: ${error.message}`);
    }
  }

  /**
   * Refresh OAuth token if expired
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (this.config.oauthConfig && this.tokenExpiry) {
      // Refresh if token expires in less than 5 minutes
      if (new Date() > new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000)) {
        await this.authenticateOAuth();
      }
    }
  }

  /**
   * Disconnect from Oracle system
   */
  async disconnect(): Promise<void> {
    this.httpClient = null;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isConnected = false;
    this.logger.log('Disconnected from Oracle system');
  }

  /**
   * Test connection to Oracle system
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      if (!this.httpClient) {
        return {
          success: false,
          message: 'HTTP client not initialized. Call connect() first.',
        };
      }

      await this.refreshTokenIfNeeded();

      // Simulate API call to test connection
      // In real implementation, this would call Oracle health check endpoint
      // e.g., /fscmRestApi/resources/latest/healthcheck

      const responseTimeMs = Date.now() - startTime;

      // Simulate checking Oracle system info
      const isCloud = this.config.baseUrl?.includes('cloud.oracle.com');
      const systemInfo = {
        systemType: isCloud ? 'Oracle Cloud ERP' : 'Oracle EBS',
        tenantId: this.config.tenantId,
        apiVersion: this.config.apiVersion || '11.13.18.05',
        host: new URL(this.config.baseUrl).hostname,
      };

      return {
        success: true,
        message: 'Successfully connected to Oracle system',
        details: systemInfo,
        responseTimeMs,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync assets from Oracle eAM module
   */
  async syncAssets(since?: Date): Promise<SyncResult<ErpAsset>> {
    this.logger.log('Syncing assets from Oracle eAM...');

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to Oracle system');
      }

      await this.refreshTokenIfNeeded();

      // Build query parameters for incremental sync
      const params: Record<string, string> = {};
      if (since) {
        params.q = `LAST_UPDATE_DATE >= '${since.toISOString()}'`;
      }

      // Simulate fetching asset data from Oracle
      // In real implementation: GET /fscmRestApi/resources/latest/maintainableAssets

      const oracleAssets = this.generateDemoOracleAssets(since);

      const assets: ErpAsset[] = oracleAssets.map((asset) => {
        const mapped = this.applyMappings(asset, 'assets');
        return {
          externalId: mapped.externalId || asset.ASSET_ID.toString(),
          name: mapped.name || asset.ASSET_DESCRIPTION,
          type: mapped.type || asset.ASSET_GROUP,
          category: mapped.category || asset.ASSET_CATEGORY,
          serialNumber: mapped.serialNumber || asset.SERIAL_NUMBER,
          manufacturer: mapped.manufacturer || asset.MANUFACTURER,
          model: mapped.model || asset.MODEL_NUMBER,
          location: mapped.location || asset.LOCATION,
          status: this.mapOracleStatus(asset.ASSET_STATUS),
          purchaseDate: asset.DATE_PURCHASED ? new Date(asset.DATE_PURCHASED) : undefined,
          purchasePrice: asset.ORIGINAL_COST,
          warrantyExpiry: asset.WARRANTY_EXPIRATION_DATE
            ? new Date(asset.WARRANTY_EXPIRATION_DATE)
            : undefined,
          metadata: {
            tenantId: this.config.tenantId,
            syncedAt: new Date().toISOString(),
            originalData: asset,
          },
        };
      });

      this.setLastSyncTimestamp(new Date());

      return this.createSuccessResult(assets, assets.length, 0);
    } catch (error: any) {
      this.logger.error(`Asset sync failed: ${error.message}`);
      return this.createFailureResult([error.message]);
    }
  }

  /**
   * Sync inventory from Oracle Inventory module
   */
  async syncInventory(since?: Date): Promise<SyncResult<ErpInventory>> {
    this.logger.log('Syncing inventory from Oracle Inventory...');

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to Oracle system');
      }

      await this.refreshTokenIfNeeded();

      // Simulate fetching inventory data from Oracle
      // In real implementation: GET /fscmRestApi/resources/latest/inventoryItems

      const oracleItems = this.generateDemoOracleInventory(since);

      const inventory: ErpInventory[] = oracleItems.map((item) => {
        const mapped = this.applyMappings(item, 'inventory');
        return {
          externalId: mapped.externalId || item.INVENTORY_ITEM_ID.toString(),
          materialNumber: item.ITEM_NUMBER,
          name: mapped.name || item.DESCRIPTION,
          description: item.LONG_DESCRIPTION,
          category: mapped.category || item.ITEM_TYPE,
          unit: mapped.unit || item.PRIMARY_UOM,
          quantity: item.ON_HAND_QUANTITY || 0,
          unitPrice: item.UNIT_PRICE,
          minQuantity: item.MIN_QUANTITY,
          maxQuantity: item.MAX_QUANTITY,
          location: mapped.location || item.SUBINVENTORY_CODE,
          supplier: item.VENDOR_NAME,
          manufacturer: item.MANUFACTURER_NAME,
          metadata: {
            tenantId: this.config.tenantId,
            syncedAt: new Date().toISOString(),
            originalData: item,
          },
        };
      });

      this.setLastSyncTimestamp(new Date());

      return this.createSuccessResult(inventory, inventory.length, 0);
    } catch (error: any) {
      this.logger.error(`Inventory sync failed: ${error.message}`);
      return this.createFailureResult([error.message]);
    }
  }

  /**
   * Push work orders to Oracle eAM module
   */
  async syncWorkOrders(workOrders: ErpWorkOrder[]): Promise<SyncResult<ErpWorkOrder>> {
    this.logger.log(`Syncing ${workOrders.length} work orders to Oracle eAM...`);

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to Oracle system');
      }

      await this.refreshTokenIfNeeded();

      const results: ErpWorkOrder[] = [];
      const errorMessages: string[] = [];
      let created = 0;
      let updated = 0;

      for (const wo of workOrders) {
        try {
          // Transform to Oracle format
          const oracleWO = this.transformToOracleWorkOrder(wo);

          // Simulate API call to create/update work order in Oracle
          // In real implementation: POST /fscmRestApi/resources/latest/maintenanceWorkOrders

          // Generate external ID if creating new
          const externalId = wo.externalId || `ORA-WO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          results.push({
            ...wo,
            externalId,
          });

          if (wo.externalId) {
            updated++;
          } else {
            created++;
          }
        } catch (error: any) {
          errorMessages.push(`Failed to sync WO ${wo.internalId}: ${error.message}`);
        }
      }

      this.setLastSyncTimestamp(new Date());

      if (errorMessages.length > 0 && errorMessages.length === workOrders.length) {
        return this.createFailureResult(errorMessages, results, created, updated);
      }

      return {
        success: true,
        data: results,
        created,
        updated,
        errors: errorMessages.length,
        errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Work order sync failed: ${error.message}`);
      return this.createFailureResult([error.message]);
    }
  }

  /**
   * Create purchase orders in Oracle Purchasing module
   */
  async syncPurchaseOrders(purchaseOrders: ErpPurchaseOrder[]): Promise<SyncResult<ErpPurchaseOrder>> {
    this.logger.log(`Creating ${purchaseOrders.length} purchase orders in Oracle Purchasing...`);

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to Oracle system');
      }

      await this.refreshTokenIfNeeded();

      const results: ErpPurchaseOrder[] = [];
      const errorMessages: string[] = [];
      let created = 0;

      for (const po of purchaseOrders) {
        try {
          // Transform to Oracle format
          const oraclePO = this.transformToOraclePurchaseOrder(po);

          // Simulate API call to create PO in Oracle
          // In real implementation: POST /fscmRestApi/resources/latest/purchaseOrders

          // Generate external ID
          const externalId = `ORA-PO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          results.push({
            ...po,
            externalId,
          });
          created++;
        } catch (error: any) {
          errorMessages.push(`Failed to create PO ${po.internalId}: ${error.message}`);
        }
      }

      this.setLastSyncTimestamp(new Date());

      if (errorMessages.length > 0 && errorMessages.length === purchaseOrders.length) {
        return this.createFailureResult(errorMessages, results, created, 0);
      }

      return {
        success: true,
        data: results,
        created,
        updated: 0,
        errors: errorMessages.length,
        errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Purchase order sync failed: ${error.message}`);
      return this.createFailureResult([error.message]);
    }
  }

  /**
   * Transform internal work order to Oracle format
   */
  private transformToOracleWorkOrder(wo: ErpWorkOrder): Record<string, any> {
    return {
      WIP_ENTITY_NAME: wo.orderNumber || wo.internalId,
      DESCRIPTION: wo.title,
      WORK_ORDER_TYPE: this.mapToOracleWorkOrderType(wo.type),
      PRIORITY: this.mapToOraclePriority(wo.priority),
      ASSET_NUMBER: wo.assetExternalId,
      SCHEDULED_START_DATE: wo.scheduledDate
        ? this.formatOracleDate(wo.scheduledDate)
        : null,
      SCHEDULED_COMPLETION_DATE: wo.dueDate
        ? this.formatOracleDate(wo.dueDate)
        : null,
    };
  }

  /**
   * Transform internal purchase order to Oracle format
   */
  private transformToOraclePurchaseOrder(po: ErpPurchaseOrder): Record<string, any> {
    return {
      VENDOR_ID: po.vendorId,
      CREATION_DATE: po.orderDate ? this.formatOracleDate(po.orderDate) : null,
      EXPECTED_RECEIPT_DATE: po.expectedDeliveryDate
        ? this.formatOracleDate(po.expectedDeliveryDate)
        : null,
      LINES: po.items.map((item, index) => ({
        LINE_NUMBER: index + 1,
        ITEM_NUMBER: item.materialNumber,
        ITEM_DESCRIPTION: item.description,
        QUANTITY: item.quantity,
        UOM_CODE: item.unit,
        UNIT_PRICE: item.unitPrice,
      })),
    };
  }

  /**
   * Format date for Oracle
   */
  private formatOracleDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Map Oracle status to internal status
   */
  private mapOracleStatus(oracleStatus: string): string {
    const statusMap: Record<string, string> = {
      'Active': 'active',
      'Inactive': 'inactive',
      'Under Construction': 'under_maintenance',
      'Retired': 'decommissioned',
      'In Service': 'active',
      'Out of Service': 'inactive',
    };
    return statusMap[oracleStatus] || 'active';
  }

  /**
   * Map internal work order type to Oracle
   */
  private mapToOracleWorkOrderType(type?: string): string {
    const typeMap: Record<string, string> = {
      'preventive': 'Preventive',
      'corrective': 'Corrective',
      'emergency': 'Emergency',
      'inspection': 'Inspection',
    };
    return type ? typeMap[type.toLowerCase()] || 'Standard' : 'Standard';
  }

  /**
   * Map internal priority to Oracle
   */
  private mapToOraclePriority(priority?: string): number {
    const priorityMap: Record<string, number> = {
      'critical': 1,
      'high': 2,
      'medium': 3,
      'low': 4,
    };
    return priority ? priorityMap[priority.toLowerCase()] || 3 : 3;
  }

  /**
   * Generate demo Oracle asset data
   */
  private generateDemoOracleAssets(since?: Date): any[] {
    return [
      {
        ASSET_ID: 100001,
        ASSET_NUMBER: 'AST-100001',
        ASSET_DESCRIPTION: 'CNC Machine Tool MTX-500',
        ASSET_GROUP: 'Machine Tool',
        ASSET_CATEGORY: 'Manufacturing Equipment',
        SERIAL_NUMBER: 'CNC-2023-001',
        MANUFACTURER: 'Mazak',
        MODEL_NUMBER: 'MTX-500',
        LOCATION: 'Shop Floor - Zone A',
        ASSET_STATUS: 'Active',
        DATE_PURCHASED: '2023-03-15',
        ORIGINAL_COST: 250000.00,
        WARRANTY_EXPIRATION_DATE: '2026-03-15',
      },
      {
        ASSET_ID: 100002,
        ASSET_NUMBER: 'AST-100002',
        ASSET_DESCRIPTION: 'Industrial Robot ARM-2000',
        ASSET_GROUP: 'Robotics',
        ASSET_CATEGORY: 'Automation Equipment',
        SERIAL_NUMBER: 'ROB-2022-078',
        MANUFACTURER: 'FANUC',
        MODEL_NUMBER: 'ARM-2000',
        LOCATION: 'Assembly Line 2',
        ASSET_STATUS: 'Active',
        DATE_PURCHASED: '2022-08-20',
        ORIGINAL_COST: 180000.00,
        WARRANTY_EXPIRATION_DATE: '2025-08-20',
      },
      {
        ASSET_ID: 100003,
        ASSET_NUMBER: 'AST-100003',
        ASSET_DESCRIPTION: 'Hydraulic Press HP-150',
        ASSET_GROUP: 'Press',
        ASSET_CATEGORY: 'Forming Equipment',
        SERIAL_NUMBER: 'HYD-2021-034',
        MANUFACTURER: 'Cincinnati',
        MODEL_NUMBER: 'HP-150',
        LOCATION: 'Press Shop',
        ASSET_STATUS: 'Under Construction',
        DATE_PURCHASED: '2021-05-10',
        ORIGINAL_COST: 95000.00,
        WARRANTY_EXPIRATION_DATE: '2024-05-10',
      },
    ];
  }

  /**
   * Generate demo Oracle inventory data
   */
  private generateDemoOracleInventory(since?: Date): any[] {
    return [
      {
        INVENTORY_ITEM_ID: 200001,
        ITEM_NUMBER: 'ITM-200001',
        DESCRIPTION: 'Servo Motor 5HP',
        LONG_DESCRIPTION: 'High-performance servo motor for CNC applications',
        ITEM_TYPE: 'Spare Part',
        PRIMARY_UOM: 'EA',
        ON_HAND_QUANTITY: 25,
        UNIT_PRICE: 1250.00,
        MIN_QUANTITY: 5,
        MAX_QUANTITY: 50,
        SUBINVENTORY_CODE: 'MAIN',
        VENDOR_NAME: 'Siemens AG',
        MANUFACTURER_NAME: 'Siemens',
      },
      {
        INVENTORY_ITEM_ID: 200002,
        ITEM_NUMBER: 'ITM-200002',
        DESCRIPTION: 'Cutting Tool Insert',
        LONG_DESCRIPTION: 'Carbide cutting insert for milling operations',
        ITEM_TYPE: 'Consumable',
        PRIMARY_UOM: 'EA',
        ON_HAND_QUANTITY: 500,
        UNIT_PRICE: 15.50,
        MIN_QUANTITY: 100,
        MAX_QUANTITY: 1000,
        SUBINVENTORY_CODE: 'TOOL',
        VENDOR_NAME: 'Sandvik Coromant',
        MANUFACTURER_NAME: 'Sandvik',
      },
      {
        INVENTORY_ITEM_ID: 200003,
        ITEM_NUMBER: 'ITM-200003',
        DESCRIPTION: 'Hydraulic Fluid AW-46',
        LONG_DESCRIPTION: 'Anti-wear hydraulic fluid for hydraulic systems',
        ITEM_TYPE: 'Consumable',
        PRIMARY_UOM: 'GAL',
        ON_HAND_QUANTITY: 120,
        UNIT_PRICE: 28.75,
        MIN_QUANTITY: 20,
        MAX_QUANTITY: 200,
        SUBINVENTORY_CODE: 'FLUID',
        VENDOR_NAME: 'Mobil Industrial',
        MANUFACTURER_NAME: 'ExxonMobil',
      },
    ];
  }
}
