import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Core User & Company Entities
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationType } from './entities/organization-type.entity';
import { Company } from './entities/company.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { DomainVerification } from './entities/domain-verification.entity';

// Asset Management Entities
import { Asset } from './entities/asset.entity';
import { AssetLocation } from './entities/asset-location.entity';
import { AssetHistory } from './entities/asset-history.entity';
import { AssetDocument } from './entities/asset-document.entity';
import { MeterReading } from './entities/meter-reading.entity';

// Work Order Entities
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { WorkOrderTemplate } from './entities/work-order-template.entity';
import { WorkOrderTimeEntry } from './entities/work-order-time-entry.entity';
import { WorkOrderSignature } from './entities/work-order-signature.entity';
import { PartsReservation } from './entities/parts-reservation.entity';

// Preventive Maintenance Entities
import { PMSchedule } from './entities/pm-schedule.entity';
import { PMTask } from './entities/pm-task.entity';
import { PMExecutionHistory } from './entities/pm-execution-history.entity';

// Inventory Management Entities
import { Inventory } from './entities/inventory.entity';
import { InventoryLocation } from './entities/inventory-location.entity';
import { InventoryCategory } from './entities/inventory-category.entity';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { Manufacturer } from './entities/manufacturer.entity';
import { Supplier } from './entities/supplier.entity';
import { StockTransaction } from './entities/stock-transaction.entity';

// Procurement Entities
import { PurchaseRequisition, PurchaseRequisitionItem } from './entities/purchase-requisition.entity';
import { PurchaseOrder, PurchaseOrderItem } from './entities/purchase-order.entity';
import { GoodsReceipt, GoodsReceiptItem } from './entities/goods-receipt.entity';

// Subscription Entities
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CompanySubscription } from './entities/company-subscription.entity';

// API & Integration Entities
import { ApiKey } from './entities/api-key.entity';
import { Webhook, WebhookDelivery } from './entities/webhook.entity';

// Reporting & Analytics Entities
import { SavedReport } from './entities/saved-report.entity';

// System Entities
import { Notification } from './entities/notification.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Settings } from './entities/settings.entity';

// Price Book Entities
import { PriceBook, PriceBookItem } from './entities/price-book.entity';

// Onboarding Entities
import { Client } from './entities/client.entity';
import { Site } from './entities/site.entity';
import { SLA } from './entities/sla.entity';

// Integration Entities
import { IntegrationConfig } from './entities/integration-config.entity';
import { IntegrationLog } from './entities/integration-log.entity';
import { SyncQueue } from './entities/sync-queue.entity';

// Predictive Maintenance Entities
import { PredictionModel } from './entities/prediction-model.entity';
import { AssetPrediction } from './entities/asset-prediction.entity';
import { SensorData } from './entities/sensor-data.entity';

// Customer Portal Entities
import { CustomerAccount } from './entities/customer-account.entity';
import { ServiceRequest } from './entities/service-request.entity';
import { CustomerNotification } from './entities/customer-notification.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [
          // Core User & Company Entities
          User,
          Organization,
          OrganizationType,
          Company,
          Role,
          Permission,
          RolePermission,
          DomainVerification,
          // Asset Management Entities
          Asset,
          AssetLocation,
          AssetHistory,
          AssetDocument,
          MeterReading,
          // Work Order Entities
          WorkOrder,
          WorkOrderAttachment,
          WorkOrderTemplate,
          WorkOrderTimeEntry,
          WorkOrderSignature,
          PartsReservation,
          // Preventive Maintenance Entities
          PMSchedule,
          PMTask,
          PMExecutionHistory,
          // Inventory Management Entities
          Inventory,
          InventoryLocation,
          InventoryCategory,
          InventoryBatch,
          Manufacturer,
          Supplier,
          StockTransaction,
          // Procurement Entities
          PurchaseRequisition,
          PurchaseRequisitionItem,
          PurchaseOrder,
          PurchaseOrderItem,
          GoodsReceipt,
          GoodsReceiptItem,
          // Subscription Entities
          SubscriptionPlan,
          CompanySubscription,
          // API & Integration Entities
          ApiKey,
          Webhook,
          WebhookDelivery,
          // Reporting & Analytics Entities
          SavedReport,
          // System Entities
          Notification,
          AuditLog,
          Settings,
          // Price Book Entities
          PriceBook,
          PriceBookItem,
          // Integration Entities
          IntegrationConfig,
          IntegrationLog,
          SyncQueue,
          // Predictive Maintenance Entities
          PredictionModel,
          AssetPrediction,
          SensorData,
          // Customer Portal Entities
          CustomerAccount,
          ServiceRequest,
          CustomerNotification,
          // Onboarding Entities
          Client,
          Site,
          SLA,
        ],
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        logging: configService.get('DB_LOGGING') === 'true',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      // Core User & Company Entities
      User,
      Organization,
      OrganizationType,
      Company,
      Role,
      Permission,
      RolePermission,
      DomainVerification,
      // Asset Management Entities
      Asset,
      AssetLocation,
      AssetHistory,
      AssetDocument,
      MeterReading,
      // Work Order Entities
      WorkOrder,
      WorkOrderAttachment,
      WorkOrderTemplate,
      WorkOrderTimeEntry,
      WorkOrderSignature,
      PartsReservation,
      // Preventive Maintenance Entities
      PMSchedule,
      PMTask,
      PMExecutionHistory,
      // Inventory Management Entities
      Inventory,
      InventoryLocation,
      InventoryCategory,
      InventoryBatch,
      Manufacturer,
      Supplier,
      StockTransaction,
      // Procurement Entities
      PurchaseRequisition,
      PurchaseRequisitionItem,
      PurchaseOrder,
      PurchaseOrderItem,
      GoodsReceipt,
      GoodsReceiptItem,
      // Subscription Entities
      SubscriptionPlan,
      CompanySubscription,
      // API & Integration Entities
      ApiKey,
      Webhook,
      WebhookDelivery,
      // Reporting & Analytics Entities
      SavedReport,
      // System Entities
      Notification,
      AuditLog,
      Settings,
      // Price Book Entities
      PriceBook,
      PriceBookItem,
      // Integration Entities
      IntegrationConfig,
      IntegrationLog,
      SyncQueue,
      // Predictive Maintenance Entities
      PredictionModel,
      AssetPrediction,
      SensorData,
      // Customer Portal Entities
      CustomerAccount,
      ServiceRequest,
      CustomerNotification,
      // Onboarding Entities
      Client,
      Site,
      SLA,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
