import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAuthUser } from '../interfaces';

/**
 * CompanyGuard ensures multi-tenant data isolation
 * - Super-admin can access all company data
 * - Regular users can only access their own company data
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, CompanyGuard)
 * async getCompanyData(@Param('companyId') companyId: string, @CurrentUser() user: IAuthUser) {
 *   // User can only access if companyId matches their own (unless super-admin)
 * }
 */
@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as IAuthUser;

    if (!user) {
      return false;
    }

    // Super-admin bypasses company isolation
    if (user.isSuperAdmin) {
      return true;
    }

    // Extract companyId from request params, query, or body
    const companyId =
      request.params?.companyId ||
      request.query?.companyId ||
      request.body?.companyId;

    // If no companyId in request, allow (will be filtered in service layer)
    if (!companyId) {
      return true;
    }

    // Check if user's companyId matches the requested companyId
    if (user.companyId !== companyId) {
      throw new ForbiddenException('Access denied: You can only access data from your own company');
    }

    return true;
  }
}
