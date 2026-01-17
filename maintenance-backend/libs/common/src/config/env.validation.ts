import * as Joi from 'joi';

/**
 * Environment Variable Validation Schema using Joi
 * This schema validates all environment variables at application startup
 * If validation fails, the application will not start
 */
export const envValidationSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  // Application
  APP_PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().required(),
  API_PREFIX: Joi.string().default('/api/v1'),
  API_VERSION: Joi.number().default(1),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL_ENABLED: Joi.boolean().default(true),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_TTL: Joi.number().default(3600),
  REDIS_ENABLED: Joi.boolean().default(false),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_DEST: Joi.string().default('./uploads'),
  ALLOWED_FILE_TYPES: Joi.string().default('image/jpeg,image/png,application/pdf'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  LOG_PRETTY_PRINT: Joi.boolean().default(false),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // Email
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASSWORD: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().email().optional(),

  // Security
  BCRYPT_ROUNDS: Joi.number().min(4).max(15).default(10),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_DURATION_MINUTES: Joi.number().default(30),

  // Feature Flags
  ENABLE_SWAGGER: Joi.boolean().default(false),
  ENABLE_METRICS: Joi.boolean().default(true),
  ENABLE_DEBUG_ROUTES: Joi.boolean().default(false),

  // AWS (Optional)
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_S3_BUCKET: Joi.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: Joi.string().uri().optional(),
  NEW_RELIC_LICENSE_KEY: Joi.string().optional(),
});

/**
 * Custom validation function for ConfigModule
 * @param config - Raw environment variables
 * @returns Validated configuration object
 * @throws Error if validation fails
 */
export function validate(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false, // Show all errors, not just the first one
    allowUnknown: true, // Allow environment variables not in schema
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`❌ Environment validation failed: ${errorMessages}`);
  }

  return value;
}
