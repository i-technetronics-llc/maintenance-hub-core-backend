import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Replace default logger with Pino
  app.useLogger(app.get(Logger));

  // Enable CORS with comprehensive configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      // Check if origin is in allowed list or allow all in development
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'X-Company-Id',
    ],
    exposedHeaders: ['Authorization', 'X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow type coercion
      },
    }),
  );

  // API prefix
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation (only in non-production)
  if (configService.get<boolean>('ENABLE_SWAGGER')) {
    const config = new DocumentBuilder()
      .setTitle('Maintenance Automation Platform API')
      .setDescription('API documentation for Maintenance Automation Platform')
      .setVersion(configService.get<string>('API_VERSION', '1'))
      .addBearerAuth()
      .addTag('authentication', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('organizations', 'Organization management')
      .addTag('assets', 'Asset management')
      .addTag('work-orders', 'Work order management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    console.log(`\n📚 Swagger documentation available at: http://localhost:${configService.get('APP_PORT')}/api-docs\n`);
  }

  // Start server
  const port = configService.get<number>('APP_PORT', 3000);
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}${apiPrefix}\n`);
}

bootstrap();
