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
 * SAP connection configuration
 */
export interface SapConnectionConfig {
  // SAP Gateway/REST API endpoint
  baseUrl: string;
  // SAP Client number (typically 100, 200, etc.)
  client: string;
  // SAP System number
  systemNumber?: string;
  // Authentication
  username: string;
  password: string;
  // Language (EN, DE, etc.)
  language?: string;
  // API Key for OAuth (if using)
  apiKey?: string;
  // OAuth tokens (if using OAuth)
  oauthConfig?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
  };
}

/**
 * Default SAP field mappings
 */
export const SAP_DEFAULT_MAPPINGS = {
  assets: {
    // SAP PM (Plant Maintenance) equipment fields -> Internal fields
    EQUNR: 'externalId', // Equipment number
    EQKTX: 'name', // Equipment description
    EQTYP: 'type', // Equipment type
    EQART: 'category', // Equipment category
    SERGE: 'serialNumber', // Serial number
    HERST: 'manufacturer', // Manufacturer
    TYPBZ: 'model', // Model
    STORT: 'location', // Location
    STATXT: 'status', // Status text
    ANSDT: 'purchaseDate', // Acquisition date
    ANSWRT: 'purchasePrice', // Acquisition value
    GWLDT: 'warrantyExpiry', // Warranty end date
  },
  inventory: {
    // SAP MM (Materials Management) fields -> Internal fields
    MATNR: 'externalId', // Material number
    MAKTX: 'name', // Material description
    MATKL: 'category', // Material group
    MEINS: 'unit', // Base unit of measure
    LABST: 'quantity', // Unrestricted stock
    STPRS: 'unitPrice', // Standard price
    MINBE: 'minQuantity', // Minimum stock level
    MXLBE: 'maxQuantity', // Maximum stock level
    LGORT: 'location', // Storage location
    LIFNR: 'supplier', // Vendor number
    MFRPN: 'manufacturer', // Manufacturer part number
  },
  workOrders: {
    // SAP PM Work Order fields -> Internal fields
    AUFNR: 'externalId', // Order number
    KTEXT: 'title', // Short text
    LTXA1: 'description', // Long text
    AUART: 'type', // Order type
    PRIOK: 'priority', // Priority
    STAT: 'status', // Status
    EQUNR: 'assetExternalId', // Equipment number
    GSTRP: 'scheduledDate', // Basic start date
    GLTRP: 'dueDate', // Basic finish date
    KOESSION: 'estimatedCost', // Estimated cost
    ISTAT: 'actualCost', // Actual cost
  },
  purchaseOrders: {
    // SAP MM Purchase Order fields -> Internal fields
    EBELN: 'externalId', // PO number
    LIFNR: 'vendorId', // Vendor number
    NAME1: 'vendorName', // Vendor name
    STATU: 'status', // Status
    BEDAT: 'orderDate', // Order date
    EINDT: 'expectedDeliveryDate', // Delivery date
    NETWR: 'totalAmount', // Net value
    WAERS: 'currency', // Currency
  },
};

/**
 * SAP ERP Connector
 * Implements connection to SAP systems via REST API (simulated for demo)
 * In production, this would use SAP RFC/BAPI calls or SAP Gateway OData services
 */
export class SapConnector extends ErpConnector {
  private httpClient: AxiosInstance | null = null;
  private config: SapConnectionConfig;
  private accessToken: string | null = null;

  constructor(
    connectionConfig: Record<string, any>,
    mappings?: Record<string, Record<string, string>>,
  ) {
    super('SAP', connectionConfig, mappings || SAP_DEFAULT_MAPPINGS);
    this.config = connectionConfig as SapConnectionConfig;
  }

  /**
   * Establish connection to SAP system
   */
  async connect(): Promise<boolean> {
    try {
      this.logger.log('Connecting to SAP system...');

      // Initialize HTTP client
      this.httpClient = axios.create({
        baseURL: this.config.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'sap-client': this.config.client,
          'sap-language': this.config.language || 'EN',
        },
      });

      // Set up authentication
      if (this.config.oauthConfig) {
        await this.authenticateOAuth();
      } else if (this.config.apiKey) {
        this.httpClient.defaults.headers.common['X-API-Key'] = this.config.apiKey;
      } else {
        // Basic authentication
        const credentials = Buffer.from(
          `${this.config.username}:${this.config.password}`,
        ).toString('base64');
        this.httpClient.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
      }

      // Test the connection
      const testResult = await this.testConnection();
      this.isConnected = testResult.success;

      if (this.isConnected) {
        this.logger.log('Successfully connected to SAP system');
      } else {
        this.logger.error('Failed to connect to SAP system');
      }

      return this.isConnected;
    } catch (error: any) {
      this.logger.error(`Failed to connect to SAP: ${error.message}`);
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
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      if (this.httpClient) {
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      }
    } catch (error: any) {
      throw new Error(`OAuth authentication failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from SAP system
   */
  async disconnect(): Promise<void> {
    this.httpClient = null;
    this.accessToken = null;
    this.isConnected = false;
    this.logger.log('Disconnected from SAP system');
  }

  /**
   * Test connection to SAP system
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

      // Simulate API call to test connection
      // In real implementation, this would call a SAP health check endpoint
      // e.g., /sap/opu/odata/sap/API_SYSTEM_INFO/SystemInfo

      // For demo purposes, simulate a successful connection
      const responseTimeMs = Date.now() - startTime;

      // Simulate checking SAP system info
      const systemInfo = {
        systemId: 'S4H',
        systemType: 'SAP S/4HANA',
        client: this.config.client,
        host: new URL(this.config.baseUrl).hostname,
      };

      return {
        success: true,
        message: 'Successfully connected to SAP system',
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
   * Sync assets from SAP PM (Plant Maintenance) module
   */
  async syncAssets(since?: Date): Promise<SyncResult<ErpAsset>> {
    this.logger.log('Syncing assets from SAP PM...');

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to SAP system');
      }

      // Build filter for incremental sync
      const filter = since
        ? `$filter=AEDAT ge datetime'${since.toISOString()}'`
        : '';

      // Simulate fetching equipment data from SAP
      // In real implementation: GET /sap/opu/odata/sap/API_EQUIPMENT/A_Equipment

      // Demo data simulating SAP equipment records
      const sapEquipment = this.generateDemoSapAssets(since);

      const assets: ErpAsset[] = sapEquipment.map((equip) => {
        const mapped = this.applyMappings(equip, 'assets');
        return {
          externalId: mapped.externalId || equip.EQUNR,
          name: mapped.name || equip.EQKTX,
          type: mapped.type || equip.EQTYP,
          category: mapped.category || equip.EQART,
          serialNumber: mapped.serialNumber || equip.SERGE,
          manufacturer: mapped.manufacturer || equip.HERST,
          model: mapped.model || equip.TYPBZ,
          location: mapped.location || equip.STORT,
          status: this.mapSapStatus(equip.STATXT),
          purchaseDate: equip.ANSDT ? new Date(equip.ANSDT) : undefined,
          purchasePrice: equip.ANSWRT ? parseFloat(equip.ANSWRT) : undefined,
          warrantyExpiry: equip.GWLDT ? new Date(equip.GWLDT) : undefined,
          metadata: {
            sapClient: this.config.client,
            syncedAt: new Date().toISOString(),
            originalData: equip,
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
   * Sync inventory/materials from SAP MM module
   */
  async syncInventory(since?: Date): Promise<SyncResult<ErpInventory>> {
    this.logger.log('Syncing inventory from SAP MM...');

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to SAP system');
      }

      // Simulate fetching material data from SAP
      // In real implementation: GET /sap/opu/odata/sap/API_MATERIAL_STOCK/A_MatlStkInAcctMod

      const sapMaterials = this.generateDemoSapMaterials(since);

      const inventory: ErpInventory[] = sapMaterials.map((mat) => {
        const mapped = this.applyMappings(mat, 'inventory');
        return {
          externalId: mapped.externalId || mat.MATNR,
          materialNumber: mat.MATNR,
          name: mapped.name || mat.MAKTX,
          description: mat.MAKTX,
          category: mapped.category || mat.MATKL,
          unit: mapped.unit || mat.MEINS,
          quantity: mat.LABST ? parseFloat(mat.LABST) : 0,
          unitPrice: mat.STPRS ? parseFloat(mat.STPRS) : undefined,
          minQuantity: mat.MINBE ? parseFloat(mat.MINBE) : undefined,
          maxQuantity: mat.MXLBE ? parseFloat(mat.MXLBE) : undefined,
          location: mapped.location || mat.LGORT,
          supplier: mat.LIFNR,
          manufacturer: mat.MFRPN,
          metadata: {
            sapClient: this.config.client,
            syncedAt: new Date().toISOString(),
            originalData: mat,
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
   * Push work orders to SAP PM module
   */
  async syncWorkOrders(workOrders: ErpWorkOrder[]): Promise<SyncResult<ErpWorkOrder>> {
    this.logger.log(`Syncing ${workOrders.length} work orders to SAP PM...`);

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to SAP system');
      }

      const results: ErpWorkOrder[] = [];
      const errorMessages: string[] = [];
      let created = 0;
      let updated = 0;

      for (const wo of workOrders) {
        try {
          // Transform to SAP format
          const sapOrder = this.transformToSapWorkOrder(wo);

          // Simulate API call to create/update work order in SAP
          // In real implementation: POST /sap/opu/odata/sap/API_MAINTENANCEORDER/MaintenanceOrder

          // Generate external ID if creating new
          const externalId = wo.externalId || `SAP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

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
   * Create purchase orders in SAP MM module
   */
  async syncPurchaseOrders(purchaseOrders: ErpPurchaseOrder[]): Promise<SyncResult<ErpPurchaseOrder>> {
    this.logger.log(`Creating ${purchaseOrders.length} purchase orders in SAP MM...`);

    try {
      if (!this.httpClient) {
        throw new Error('Not connected to SAP system');
      }

      const results: ErpPurchaseOrder[] = [];
      const errorMessages: string[] = [];
      let created = 0;

      for (const po of purchaseOrders) {
        try {
          // Transform to SAP format
          const sapPO = this.transformToSapPurchaseOrder(po);

          // Simulate API call to create PO in SAP
          // In real implementation: POST /sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder

          // Generate external ID
          const externalId = `SAP-PO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

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
   * Transform internal work order to SAP format
   */
  private transformToSapWorkOrder(wo: ErpWorkOrder): Record<string, any> {
    return {
      AUFNR: wo.externalId,
      KTEXT: wo.title,
      LTXA1: wo.description,
      AUART: this.mapToSapOrderType(wo.type),
      PRIOK: this.mapToSapPriority(wo.priority),
      EQUNR: wo.assetExternalId,
      GSTRP: wo.scheduledDate ? this.formatSapDate(wo.scheduledDate) : null,
      GLTRP: wo.dueDate ? this.formatSapDate(wo.dueDate) : null,
    };
  }

  /**
   * Transform internal purchase order to SAP format
   */
  private transformToSapPurchaseOrder(po: ErpPurchaseOrder): Record<string, any> {
    return {
      EBELN: po.externalId,
      LIFNR: po.vendorId,
      BEDAT: po.orderDate ? this.formatSapDate(po.orderDate) : null,
      EINDT: po.expectedDeliveryDate ? this.formatSapDate(po.expectedDeliveryDate) : null,
      ITEMS: po.items.map((item) => ({
        MATNR: item.materialNumber,
        TXZ01: item.description,
        MENGE: item.quantity,
        MEINS: item.unit,
        NETPR: item.unitPrice,
      })),
    };
  }

  /**
   * Format date for SAP
   */
  private formatSapDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  /**
   * Map SAP status to internal status
   */
  private mapSapStatus(sapStatus: string): string {
    const statusMap: Record<string, string> = {
      'ACTV': 'active',
      'AVLB': 'active',
      'INAC': 'inactive',
      'DLFL': 'decommissioned',
      'MAINT': 'under_maintenance',
    };
    return statusMap[sapStatus] || 'active';
  }

  /**
   * Map internal order type to SAP
   */
  private mapToSapOrderType(type?: string): string {
    const typeMap: Record<string, string> = {
      'preventive': 'PM01',
      'corrective': 'PM02',
      'emergency': 'PM03',
      'inspection': 'PM04',
    };
    return type ? typeMap[type.toLowerCase()] || 'PM01' : 'PM01';
  }

  /**
   * Map internal priority to SAP
   */
  private mapToSapPriority(priority?: string): string {
    const priorityMap: Record<string, string> = {
      'critical': '1',
      'high': '2',
      'medium': '3',
      'low': '4',
    };
    return priority ? priorityMap[priority.toLowerCase()] || '3' : '3';
  }

  /**
   * Generate demo SAP asset data
   */
  private generateDemoSapAssets(since?: Date): any[] {
    return [
      {
        EQUNR: 'EQ-10001',
        EQKTX: 'Industrial Pump P-101',
        EQTYP: 'PUMP',
        EQART: 'Rotating Equipment',
        SERGE: 'SN-2023-001',
        HERST: 'Grundfos',
        TYPBZ: 'CR-45-3',
        STORT: 'Plant-A/Building-1',
        STATXT: 'ACTV',
        ANSDT: '2023-01-15',
        ANSWRT: '45000.00',
        GWLDT: '2026-01-15',
      },
      {
        EQUNR: 'EQ-10002',
        EQKTX: 'Conveyor Belt CB-201',
        EQTYP: 'CONV',
        EQART: 'Material Handling',
        SERGE: 'SN-2022-045',
        HERST: 'Siemens',
        TYPBZ: 'BD-500',
        STORT: 'Plant-A/Building-2',
        STATXT: 'ACTV',
        ANSDT: '2022-06-20',
        ANSWRT: '120000.00',
        GWLDT: '2025-06-20',
      },
      {
        EQUNR: 'EQ-10003',
        EQKTX: 'Air Compressor AC-301',
        EQTYP: 'COMP',
        EQART: 'Utilities',
        SERGE: 'SN-2021-112',
        HERST: 'Atlas Copco',
        TYPBZ: 'GA-55',
        STORT: 'Plant-B/Utilities',
        STATXT: 'MAINT',
        ANSDT: '2021-03-10',
        ANSWRT: '78000.00',
        GWLDT: '2024-03-10',
      },
    ];
  }

  /**
   * Generate demo SAP material data
   */
  private generateDemoSapMaterials(since?: Date): any[] {
    return [
      {
        MATNR: 'MAT-001',
        MAKTX: 'Bearing SKF 6205',
        MATKL: 'SPARE',
        MEINS: 'EA',
        LABST: '150',
        STPRS: '25.50',
        MINBE: '20',
        MXLBE: '200',
        LGORT: 'WH-01',
        LIFNR: 'V-1001',
        MFRPN: 'SKF',
      },
      {
        MATNR: 'MAT-002',
        MAKTX: 'Hydraulic Oil ISO 46',
        MATKL: 'CONSUM',
        MEINS: 'L',
        LABST: '500',
        STPRS: '4.25',
        MINBE: '100',
        MXLBE: '1000',
        LGORT: 'WH-02',
        LIFNR: 'V-1002',
        MFRPN: 'Shell',
      },
      {
        MATNR: 'MAT-003',
        MAKTX: 'V-Belt A68',
        MATKL: 'SPARE',
        MEINS: 'EA',
        LABST: '45',
        STPRS: '18.75',
        MINBE: '10',
        MXLBE: '100',
        LGORT: 'WH-01',
        LIFNR: 'V-1003',
        MFRPN: 'Gates',
      },
    ];
  }
}
