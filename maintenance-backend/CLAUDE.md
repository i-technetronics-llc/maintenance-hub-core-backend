# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maintenance Hub Core Backend - A NestJS monorepo for enterprise maintenance management. Built with TypeORM/PostgreSQL, JWT authentication, and role-based access control.

## Common Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Build application
npm run start:prod         # Production mode

# Testing
npm run test               # Run unit tests
npm run test:watch         # Tests in watch mode
npm run test:e2e           # End-to-end tests

# Code Quality
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting

# Database
npm run migrate            # Run TypeORM migrations
npm run migrate:create     # Create new migration
npm run migrate:revert     # Revert last migration
npm run seed               # Populate with sample data

# Docker
docker-compose up -d                        # Production with PostgreSQL & Redis
docker-compose -f docker-compose.dev.yml up # Development with hot reload
docker build -t maintenance-api .           # Build image only
```

## Architecture

### Monorepo Structure

```
apps/
  api-gateway/src/         # Main API application
    auth/                  # JWT/Local auth strategies
    users/, roles/, permissions/  # User management
    organizations/, companies/    # Multi-tenancy
    assets/, work-orders/         # Core domain
    inventory/, preventive-maintenance/
    predictive-maintenance/, analytics/

libs/
  common/src/              # Shared utilities
    guards/                # JwtAuthGuard, RolesGuard, PermissionsGuard
    decorators/            # @Public, @Roles, @Permissions, @CurrentUser
    filters/               # AllExceptionsFilter
    interceptors/          # TransformInterceptor, LoggingInterceptor
    config/                # Environment validation (Joi)

  database/src/            # Data layer
    entities/              # 50+ TypeORM entities
    seeders/               # Database seeding
    database.module.ts     # Global TypeORM config
```

### Path Aliases

```typescript
import { ... } from '@app/common';    // libs/common/src
import { ... } from '@app/database';  // libs/database/src
```

### Global Guards (Applied to All Routes)

Routes are protected by default via `APP_GUARD` providers in `app.module.ts`:
1. `JwtAuthGuard` - JWT validation (skip with `@Public()`)
2. `RolesGuard` - Role checking (use `@Roles(UserRole.ADMIN)`)
3. `PermissionsGuard` - Permission checking (use `@Permissions('user_management:view')`)
4. `ThrottlerGuard` - Rate limiting

### Response Format

All responses wrapped by `TransformInterceptor`:
```json
{ "success": true, "data": {...}, "timestamp": "..." }
```

## Key Patterns

### Controller with Auth

```typescript
@ApiTags('feature')
@Controller('feature')
export class FeatureController {
  @Public()  // Skip JWT guard
  @Post('public-endpoint')
  async publicMethod() {}

  @Roles(UserRole.ADMIN)
  @Permissions('feature:edit')
  @Put(':id')
  async protectedMethod(@CurrentUser() user: IAuthUser) {}
}
```

### Service with Repository

```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
  ) {}
}
```

### Entity Relationships

```typescript
@Entity('table_name')
export class Entity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Related, { eager: true })
  @JoinColumn({ name: 'relatedId' })
  related: Related;

  @CreateDateColumn()
  createdAt: Date;
}
```

## Environment Configuration

Required variables validated at startup via Joi (`libs/common/src/config/env.validation.ts`):

- `NODE_ENV`: development|test|production
- `APP_PORT`, `APP_NAME`, `API_PREFIX`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars)
- `CORS_ORIGIN`, `BCRYPT_ROUNDS`

Environment files: `.env.development`, `.env.test`, `.env.production.example`

## API Endpoints

- Health: `GET /health`
- API prefix: `/api/v1` (configurable)
- Swagger: `/api-docs` (development only, when `ENABLE_SWAGGER=true`)

## Adding New Features

1. Create module directory in `apps/api-gateway/src/`
2. Add entities to `libs/database/src/entities/`
3. Create `*.module.ts`, `*.controller.ts`, `*.service.ts`, DTOs
4. Import module in `AppModule`
5. Use existing guards/decorators for authentication
