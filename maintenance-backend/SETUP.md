# Maintenance Backend - Setup & Configuration Guide

## 🎯 What Has Been Implemented

### Best Practices Integration ✅

The application now implements enterprise-grade best practices for NestJS applications:

1. **Centralized Configuration Management**
   - Global `ConfigModule` available across all modules without repeated imports
   - Environment-specific configuration files (`.env.development`, `.env.test`, `.env.production.example`)
   - Dynamic environment file loading based on `NODE_ENV`
   - Configuration caching for improved performance
   - Variable expansion support (e.g., `${DB_HOST}`)

2. **Environment Validation**
   - **Joi validation** (`libs/common/src/config/env.validation.ts`) - Currently active
   - **Class-validator approach** (`libs/common/src/config/env.config.ts`) - Alternative implementation
   - Application fails to start if environment validation fails
   - Shows all validation errors at once (not just the first one)

3. **Structured Logging with Pino**
   - Replaced default logger with production-ready Pino
   - Automatic sensitive data redaction (passwords, tokens, auth headers)
   - Pretty-printing in development, JSON in production
   - Configurable log levels per environment
   - Request/response logging with duration tracking
   - Health check endpoints excluded from logs

4. **Rate Limiting**
   - Global rate limiting using `@nestjs/throttler`
   - Configurable TTL and request limits
   - Environment-specific settings
   - Protects against DDoS and API abuse

5. **Global Guards, Filters & Interceptors**
   - **JWT Authentication Guard**: Protects all routes by default
   - **Roles Guard**: Role-based access control
   - **Throttler Guard**: Rate limiting
   - **AllExceptionsFilter**: Unified error handling with consistent response format
   - **TransformInterceptor**: Wraps all responses in consistent structure
   - **LoggingInterceptor**: Request/response logging

6. **Security Features**
   - `.gitignore` configured to never commit sensitive files
   - Production secrets use placeholders for secrets managers
   - Password hashing with bcrypt
   - JWT-based authentication
   - CORS configuration
   - Input validation with DTOs

## 📁 Project Structure

```
maintenance-backend/
├── apps/
│   └── api-gateway/
│       ├── src/
│       │   ├── auth/               # Authentication module
│       │   │   ├── strategies/     # Passport strategies (JWT, Local)
│       │   │   ├── dto/            # Data Transfer Objects
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   └── auth.module.ts
│       │   ├── app.controller.ts   # Root & health endpoints
│       │   ├── app.module.ts       # Main application module (with all best practices)
│       │   └── main.ts             # Application bootstrap
│       └── tsconfig.app.json
├── libs/
│   ├── common/
│   │   └── src/
│   │       ├── config/             # Configuration & validation
│   │       │   ├── env.validation.ts    # Joi validation schema
│   │       │   └── env.config.ts        # Class-validator approach
│   │       ├── guards/             # Authentication & authorization guards
│   │       ├── filters/            # Exception filters
│   │       ├── interceptors/       # Response transformation & logging
│   │       ├── decorators/         # Custom decorators (@Public, @Roles, etc.)
│   │       ├── enums/              # Enumerations
│   │       ├── constants/          # Application constants
│   │       └── interfaces/         # TypeScript interfaces
│   └── database/
│       └── src/
│           ├── entities/           # TypeORM entities
│           │   ├── user.entity.ts
│           │   ├── role.entity.ts
│           │   ├── organization.entity.ts
│           │   ├── asset.entity.ts
│           │   ├── work-order.entity.ts
│           │   └── ...
│           ├── seeders/            # Database seeders
│           │   └── seed.ts
│           └── database.module.ts  # Database configuration
├── .env.development                # Development environment config
├── .env.test                       # Test environment config
├── .env.production.example         # Production config template
├── .gitignore                      # Git ignore (includes .env files)
├── package.json
├── nest-cli.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (recommended v20+)
- **PostgreSQL**: 15.x
- **npm**: v9+

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**:
   ```bash
   # Create database
   createdb maintenance-db

   # Or using psql
   psql -U postgres
   CREATE DATABASE maintenance-db;
   \q
   ```

3. **Configure environment**:
   The `.env.development` file is already configured. Review and update if needed:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=maintenance-db
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

4. **Run database synchronization** (development only):
   The app will automatically create tables on first run because `DB_SYNCHRONIZE=true` in development.

5. **Seed the database**:
   ```bash
   npm run seed
   ```

   This creates:
   - 8 roles (Admin, Head of Operations, Operations Manager, etc.)
   - 2 organizations (1 vendor, 1 client)
   - 11 sample users with different roles

6. **Build the application**:
   ```bash
   npm run build
   ```

7. **Start the application**:
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

8. **Access the application**:
   - **API**: http://localhost:3000/api/v1
   - **Swagger Docs** (dev only): http://localhost:3000/api-docs
   - **Health Check**: http://localhost:3000/api/v1/health

## 🔐 Sample Login Credentials

After running the seed script, you can use these credentials to test the application:

### Vendor Organization (Tech Services Ltd.)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techservices.com | Admin@123 |
| Head of Operations | head.ops@techservices.com | HeadOps@123 |
| Operations Manager | ops.manager@techservices.com | OpsManager@123 |
| Dispatcher | dispatcher@techservices.com | Dispatcher@123 |
| Field Technician | technician@techservices.com | Technician@123 |
| Supervisor | supervisor@techservices.com | Supervisor@123 |
| Inventory Manager | inventory@techservices.com | Inventory@123 |
| Finance | finance@techservices.com | Finance@123 |

### Client Organization (ACME Corporation)

| Role | Email | Password |
|------|-------|----------|
| Client Viewer | viewer@acmecorp.com | Viewer@123 |
| Client Requester | requester@acmecorp.com | Requester@123 |
| Contract Manager | contract@acmecorp.com | Contract@123 |

## 📝 API Usage Examples

### Authentication

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techservices.com",
    "password": "Admin@123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@techservices.com",
      "firstName": "System",
      "lastName": "Administrator",
      "role": {
        "id": "uuid",
        "name": "ADMIN",
        "permissions": ["read:all", "write:all", "delete:all"]
      },
      "organization": {
        "id": "uuid",
        "name": "Tech Services Ltd.",
        "type": "VENDOR"
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ⚙️ Environment Variables

### Application Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/test/production) | development | Yes |
| `APP_PORT` | Application port | 3000 | Yes |
| `APP_NAME` | Application name | Maintenance Automation Platform | Yes |
| `API_PREFIX` | API route prefix | /api/v1 | No |

### Database Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | localhost | Yes |
| `DB_PORT` | PostgreSQL port | 5432 | Yes |
| `DB_NAME` | Database name | - | Yes |
| `DB_USER` | Database user | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_SYNCHRONIZE` | Auto-sync schema (⚠️ dev only!) | false | No |
| `DB_LOGGING` | Enable SQL logging | false | No |
| `DB_SSL_ENABLED` | Enable SSL connection | true | No |

### JWT Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | Yes |
| `JWT_EXPIRATION` | Access token expiration | 1h | No |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | - | Yes |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | 7d | No |

### Logging Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Log level (error/warn/info/debug/trace) | info | No |
| `LOG_PRETTY_PRINT` | Pretty print logs (dev only) | false | No |

### Rate Limiting
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_TTL` | Time window in seconds | 60 | No |
| `RATE_LIMIT_MAX` | Max requests per window | 100 | No |

### Security
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BCRYPT_ROUNDS` | Password hashing rounds (4-15) | 10 | No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | - | Yes |

### Feature Flags
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_SWAGGER` | Enable Swagger documentation | false | No |
| `ENABLE_METRICS` | Enable metrics collection | true | No |
| `ENABLE_DEBUG_ROUTES` | Enable debug routes | false | No |

## 🔧 Configuration Validation

The application uses **Joi** for environment validation. If any required variable is missing or invalid, the application will not start and will display detailed error messages.

### Example validation error:
```
❌ Environment validation failed: "JWT_SECRET" is required, "DB_NAME" must be a string
```

### Switching to Class-Validator Approach

To use the Class-validator approach instead of Joi:

1. Open `apps/api-gateway/src/app.module.ts`
2. Change the import:
   ```typescript
   // From:
   import { validate } from '@app/common/config/env.validation';

   // To:
   import { validateClassValidator } from '@app/common/config/env.config';
   ```
3. Update the ConfigModule:
   ```typescript
   ConfigModule.forRoot({
     validate: validateClassValidator, // Changed from 'validate'
     // ... rest of config
   })
   ```

## 🗄️ Database Schema

### Entities Implemented

1. **User**: User accounts with authentication
2. **Role**: User roles with permissions
3. **Organization**: Vendor and client organizations
4. **Asset**: Equipment and asset management
5. **AssetLocation**: Geographic asset locations
6. **WorkOrder**: Maintenance work orders
7. **WorkOrderAttachment**: File attachments for work orders
8. **Notification**: User notifications
9. **AuditLog**: Audit trail (coming soon)

### Entity Relationships

- User → Role (Many-to-One)
- User → Organization (Many-to-One)
- Asset → Organization (Many-to-One)
- WorkOrder → Asset (Many-to-One)
- WorkOrder → User (Many-to-One, assigned technician)

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the application |
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:prod` | Start in production mode |
| `npm run start:debug` | Start in debug mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run seed` | Seed the database with sample data |

## 🛡️ Security Considerations

### Development
- ✅ `.env` files excluded from git
- ✅ Sample credentials provided for development
- ✅ Verbose logging enabled
- ✅ Swagger documentation enabled
- ⚠️ `DB_SYNCHRONIZE=true` (auto schema sync)

### Production
- 🔒 Use secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
- 🔒 Set `DB_SYNCHRONIZE=false` (use migrations)
- 🔒 Disable Swagger (`ENABLE_SWAGGER=false`)
- 🔒 Use strong JWT secrets (min 32 characters)
- 🔒 Enable SSL for database connections
- 🔒 Use production-grade bcrypt rounds (12+)
- 🔒 Set appropriate rate limits
- 🔒 Configure proper CORS origins

## 🎯 Next Steps

1. **Run the Seed Script** to populate the database
2. **Test the API** using the provided credentials
3. **Explore Swagger Documentation** at http://localhost:3000/api-docs
4. **Start Building Features**:
   - Asset Management Module
   - Work Order Management Module
   - Dashboard Analytics
   - Notifications System

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change APP_PORT in .env.development
APP_PORT=3001
```

### Database Connection Failed
1. Ensure PostgreSQL is running
2. Verify credentials in `.env.development`
3. Check if database exists

### Validation Errors on Startup
1. Review the error message carefully
2. Check `.env.development` for missing/invalid values
3. Ensure JWT_SECRET is at least 32 characters

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Pino Logger](https://getpino.io)
- [Joi Validation](https://joi.dev)
- [Class Validator](https://github.com/typestack/class-validator)

## ✅ Verification Checklist

Before deploying to production:

- [ ] All environment variables configured via secrets manager
- [ ] `DB_SYNCHRONIZE=false` in production
- [ ] Database migrations created and tested
- [ ] JWT secrets are strong and unique
- [ ] CORS origins properly restricted
- [ ] Rate limits configured appropriately
- [ ] Swagger documentation disabled (`ENABLE_SWAGGER=false`)
- [ ] SSL enabled for database connections
- [ ] Logging configured for production (no pretty printing)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Health check endpoints working
- [ ] All tests passing

---

**Built with ❤️ using NestJS, TypeORM, and PostgreSQL**
