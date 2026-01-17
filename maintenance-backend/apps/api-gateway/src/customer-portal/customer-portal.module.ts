import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { CustomerAccount } from '@app/database/entities/customer-account.entity';
import { ServiceRequest } from '@app/database/entities/service-request.entity';
import { CustomerNotification } from '@app/database/entities/customer-notification.entity';
import { Company } from '@app/database/entities/company.entity';
import { AssetLocation } from '@app/database/entities/asset-location.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';

// Services
import { CustomerAuthService } from './customer-auth.service';
import { CustomerPortalService } from './customer-portal.service';

// Controller
import { CustomerPortalController } from './customer-portal.controller';

// Guards & Strategies
import { CustomerJwtStrategy } from './guards/customer-jwt.strategy';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerAccount,
      ServiceRequest,
      CustomerNotification,
      Company,
      AssetLocation,
      Asset,
      WorkOrder,
    ]),
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CustomerPortalController],
  providers: [
    CustomerAuthService,
    CustomerPortalService,
    CustomerJwtStrategy,
    CustomerAuthGuard,
  ],
  exports: [CustomerAuthService, CustomerPortalService],
})
export class CustomerPortalModule {}
