import { IsEnum, IsNumber, IsString, IsBoolean, Min, Max, IsOptional, IsEmail, IsUrl, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Environment Variable Validation using Class-Validator (Pro Approach)
 * This provides type-safe, decorator-based validation
 */

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
}

export class EnvironmentVariables {
  // Node Environment
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  // Application
  @IsNumber()
  @Min(1)
  @Max(65535)
  APP_PORT: number = 3000;

  @IsString()
  APP_NAME: string;

  @IsString()
  API_PREFIX: string = '/api/v1';

  @IsNumber()
  API_VERSION: number = 1;

  // Database
  @IsString()
  DB_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  @IsString()
  DB_NAME: string;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsBoolean()
  DB_SYNCHRONIZE: boolean = false;

  @IsBoolean()
  DB_LOGGING: boolean = false;

  @IsBoolean()
  DB_SSL_ENABLED: boolean = true;

  // JWT
  @IsString()
  @Min(32)
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRATION: string = '1h';

  @IsString()
  @Min(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_REFRESH_EXPIRATION: string = '7d';

  // Redis
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  REDIS_TTL: number = 3600;

  @IsBoolean()
  REDIS_ENABLED: boolean = false;

  // CORS
  @IsString()
  CORS_ORIGIN: string;

  // File Upload
  @IsNumber()
  MAX_FILE_SIZE: number = 10485760;

  @IsString()
  UPLOAD_DEST: string = './uploads';

  @IsString()
  ALLOWED_FILE_TYPES: string = 'image/jpeg,image/png,application/pdf';

  // Logging
  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsBoolean()
  LOG_PRETTY_PRINT: boolean = false;

  // Rate Limiting
  @IsNumber()
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  RATE_LIMIT_MAX: number = 100;

  // Email
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsEmail()
  @IsOptional()
  EMAIL_FROM?: string;

  // Security
  @IsNumber()
  @Min(4)
  @Max(15)
  BCRYPT_ROUNDS: number = 10;

  @IsNumber()
  MAX_LOGIN_ATTEMPTS: number = 5;

  @IsNumber()
  LOCKOUT_DURATION_MINUTES: number = 30;

  // Feature Flags
  @IsBoolean()
  ENABLE_SWAGGER: boolean = false;

  @IsBoolean()
  ENABLE_METRICS: boolean = true;

  @IsBoolean()
  ENABLE_DEBUG_ROUTES: boolean = false;

  // AWS (Optional)
  @IsString()
  @IsOptional()
  AWS_REGION?: string;

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET?: string;

  // Monitoring (Optional)
  @IsUrl()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  NEW_RELIC_LICENSE_KEY?: string;
}

/**
 * Validate environment variables using class-validator
 * @param config - Raw environment variables
 * @returns Validated configuration object
 * @throws Error if validation fails
 */
export function validateClassValidator(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // Auto-convert strings to numbers/booleans
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`❌ Environment validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}
