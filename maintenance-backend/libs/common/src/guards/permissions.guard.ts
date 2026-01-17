import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators';
import { IAuthUser } from '../interfaces';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    const authUser = user as IAuthUser;

    // Super-admin has all permissions
    if (authUser.isSuperAdmin || authUser.permissions.includes('*')) {
      return true;
    }

    return requiredPermissions.some((permission) =>
      authUser.permissions.includes(permission),
    );
  }
}
