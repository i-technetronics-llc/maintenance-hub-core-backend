import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { DatabaseModule } from '@app/database';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AssetsModule } from './assets/assets.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { CompaniesModule } from './companies/companies.module';
import { DomainVerificationModule } from './domain-verification/domain-verification.module';
import { InventoryModule } from './inventory/inventory.module';
import { InventoryMasterModule } from './inventory-master/inventory-master.module';
import { SettingsModule } from './settings/settings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AuditModule } from './audit/audit.module';
import { PreventiveMaintenanceModule } from './preventive-maintenance/preventive-maintenance.module';
import { PriceBooksModule } from './price-books/price-books.module';
import { MeterReadingsModule } from './meter-readings/meter-readings.module';
import { ReportsModule } from './reports/reports.module';
import { PredictiveMaintenanceModule } from './predictive-maintenance/predictive-maintenance.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { ClientsModule } from './clients/clients.module';
import { SitesModule } from './sites/sites.module';
import { SLAModule } from './sla/sla.module';
import { JwtAuthGuard, RolesGuard, PermissionsGuard } from '@app/common/guards';
import { AllExceptionsFilter } from '@app/common/filters';
import { TransformInterceptor, LoggingInterceptor } from '@app/common/interceptors';
import { validate } from '@app/common/config/env.validation';
// Alternative: import { validateClassValidator } from '@app/common/config/env.config';

/**
 * Enhanced AppModule with Best Practices:
 * 1. Global ConfigModule with Joi validation
 * 2. Environment-specific configuration loading
 * 3. Pino structured logging
 * 4. Rate limiting
 * 5. Global guards, filters, and interceptors
 */
@Module({
  imports: [
    // 1. CENTRALIZED CONFIGURATION WITH VALIDATION
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere without imports
      cache: true, // Cache configuration for better performance
      expandVariables: true, // Enable variable expansion like ${DB_HOST}
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
      validate, // Joi validation - application won't start if validation fails
      // Alternative: validate: validateClassValidator, // Class-validator approach
      validationOptions: {
        abortEarly: false, // Show all validation errors
        allowUnknown: true, // Allow extra environment variables
      },
    }),

    // 2. STRUCTURED LOGGING WITH PINO
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get('LOG_LEVEL', 'info'),
          transport:
            configService.get('LOG_PRETTY_PRINT') === 'true'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                    singleLine: false,
                  },
                }
              : undefined,
          serializers: {
            req: (req) => ({
              id: req.id,
              method: req.method,
              url: req.url,
              // Don't log sensitive data
              // headers: req.headers,
            }),
            res: (res) => ({
              statusCode: res.statusCode,
            }),
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.token',
            ],
            remove: true,
          },
          autoLogging: {
            ignore: (req) => {
              // Don't log health checks
              return req.url === '/' || req.url === '/health';
            },
          },
        },
      }),
      inject: [ConfigService],
    }),

    // 3. RATE LIMITING
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000, // Convert to milliseconds
            limit: configService.get<number>('RATE_LIMIT_MAX', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // 4. DATABASE MODULE
    DatabaseModule,

    // 5. FEATURE MODULES
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AssetsModule,
    WorkOrdersModule,
    PermissionsModule,
    RolesModule,
    CompaniesModule,
    DomainVerificationModule,
    InventoryModule,
    InventoryMasterModule,
    SettingsModule,
    AnalyticsModule,
    SubscriptionsModule,
    AuditModule,
    PreventiveMaintenanceModule,
    PriceBooksModule,
    MeterReadingsModule,
    ReportsModule,
    PredictiveMaintenanceModule,
    IntegrationsModule,
    CustomerPortalModule,
    ClientsModule,
    SitesModule,
    SLAModule,
  ],

  controllers: [AppController],

  providers: [
    // Global JWT Authentication Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Roles Guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Permissions Guard
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },

    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global Exception Filter (unified error handling)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global Transform Interceptor (consistent API responses)
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    // Log successful configuration loading
    const env = this.configService.get('NODE_ENV');
    const port = this.configService.get('APP_PORT');
    console.log(`\n✅ Configuration loaded successfully for ${env} environment`);
    console.log(`📝 Application will start on port ${port}\n`);
  }
}
