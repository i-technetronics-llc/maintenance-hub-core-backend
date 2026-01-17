import { Logger } from '@nestjs/common';

/**
 * Result of a sync operation
 */
export interface SyncResult<T = any> {
  success: boolean;
  data?: T[];
  created: number;
  updated: number;
  errors: number;
  errorMessages?: string[];
  timestamp: Date;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  responseTimeMs?: number;
}

/**
 * Asset data structure for syncing
 */
export interface ErpAsset {
  externalId: string;
  name: string;
  type?: string;
  category?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  status?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  specifications?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Inventory/Material data structure for syncing
 */
export interface ErpInventory {
  externalId: string;
  materialNumber?: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  location?: string;
  manufacturer?: string;
  supplier?: string;
  metadata?: Record<string, any>;
}

/**
 * Work Order data structure for syncing
 */
export interface ErpWorkOrder {
  externalId?: string;
  internalId: string;
  orderNumber?: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  assetId?: string;
  assetExternalId?: string;
  scheduledDate?: Date;
  dueDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  metadata?: Record<string, any>;
}

/**
 * Purchase Order data structure for syncing
 */
export interface ErpPurchaseOrder {
  externalId?: string;
  internalId: string;
  poNumber?: string;
  vendorId?: string;
  vendorName?: string;
  status?: string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  items: ErpPurchaseOrderItem[];
  totalAmount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface ErpPurchaseOrderItem {
  materialNumber?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

/**
 * Abstract base class for ERP connectors
 * Implement this class to create connectors for specific ERP systems
 */
export abstract class ErpConnector {
  protected readonly logger: Logger;
  protected connectionConfig: Record<string, any>;
  protected mappings: Record<string, Record<string, string>>;
  protected isConnected: boolean = false;
  protected lastSyncTimestamp: Date | null = null;

  constructor(
    protected readonly connectorName: string,
    connectionConfig: Record<string, any>,
    mappings?: Record<string, Record<string, string>>,
  ) {
    this.logger = new Logger(`${connectorName}Connector`);
    this.connectionConfig = connectionConfig;
    this.mappings = mappings || {};
  }

  /**
   * Establish connection to the ERP system
   */
  abstract connect(): Promise<boolean>;

  /**
   * Close connection to the ERP system
   */
  abstract disconnect(): Promise<void>;

  /**
   * Test the connection to verify connectivity
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Sync assets from ERP to internal system
   * @param since Optional timestamp to sync only records modified after this date
   */
  abstract syncAssets(since?: Date): Promise<SyncResult<ErpAsset>>;

  /**
   * Sync inventory/materials from ERP to internal system
   * @param since Optional timestamp to sync only records modified after this date
   */
  abstract syncInventory(since?: Date): Promise<SyncResult<ErpInventory>>;

  /**
   * Push work orders to ERP system
   * @param workOrders Work orders to sync
   */
  abstract syncWorkOrders(workOrders: ErpWorkOrder[]): Promise<SyncResult<ErpWorkOrder>>;

  /**
   * Create purchase orders in ERP system
   * @param purchaseOrders Purchase orders to create
   */
  abstract syncPurchaseOrders(purchaseOrders: ErpPurchaseOrder[]): Promise<SyncResult<ErpPurchaseOrder>>;

  /**
   * Get the timestamp of the last successful sync
   */
  getLastSyncTimestamp(): Date | null {
    return this.lastSyncTimestamp;
  }

  /**
   * Set the last sync timestamp
   */
  protected setLastSyncTimestamp(timestamp: Date): void {
    this.lastSyncTimestamp = timestamp;
  }

  /**
   * Check if connector is currently connected
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Update connection configuration
   */
  updateConnectionConfig(config: Record<string, any>): void {
    this.connectionConfig = { ...this.connectionConfig, ...config };
  }

  /**
   * Update field mappings
   */
  updateMappings(mappings: Record<string, Record<string, string>>): void {
    this.mappings = { ...this.mappings, ...mappings };
  }

  /**
   * Apply field mappings to transform ERP data to internal format
   */
  protected applyMappings(
    data: Record<string, any>,
    entityType: string,
  ): Record<string, any> {
    const entityMappings = this.mappings[entityType];
    if (!entityMappings) {
      return data;
    }

    const mapped: Record<string, any> = {};
    for (const [erpField, internalField] of Object.entries(entityMappings)) {
      if (data[erpField] !== undefined) {
        mapped[internalField] = data[erpField];
      }
    }

    // Include any fields not in mappings
    for (const [key, value] of Object.entries(data)) {
      if (!entityMappings[key] && mapped[key] === undefined) {
        mapped[key] = value;
      }
    }

    return mapped;
  }

  /**
   * Apply reverse mappings to transform internal data to ERP format
   */
  protected applyReverseMappings(
    data: Record<string, any>,
    entityType: string,
  ): Record<string, any> {
    const entityMappings = this.mappings[entityType];
    if (!entityMappings) {
      return data;
    }

    // Create reverse mapping
    const reverseMappings: Record<string, string> = {};
    for (const [erpField, internalField] of Object.entries(entityMappings)) {
      reverseMappings[internalField] = erpField;
    }

    const mapped: Record<string, any> = {};
    for (const [internalField, erpField] of Object.entries(reverseMappings)) {
      if (data[internalField] !== undefined) {
        mapped[erpField] = data[internalField];
      }
    }

    return mapped;
  }

  /**
   * Create a success sync result
   */
  protected createSuccessResult<T>(
    data: T[],
    created: number,
    updated: number,
  ): SyncResult<T> {
    return {
      success: true,
      data,
      created,
      updated,
      errors: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Create a failure sync result
   */
  protected createFailureResult<T>(
    errorMessages: string[],
    partialData?: T[],
    created = 0,
    updated = 0,
  ): SyncResult<T> {
    return {
      success: false,
      data: partialData,
      created,
      updated,
      errors: errorMessages.length,
      errorMessages,
      timestamp: new Date(),
    };
  }
}
