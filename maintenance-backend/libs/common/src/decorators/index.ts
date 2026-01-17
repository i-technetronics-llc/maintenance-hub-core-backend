import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { IAuthUser } from '../interfaces';
import { UserRole } from '../enums';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator(
  (data: keyof IAuthUser | undefined, ctx: ExecutionContext): IAuthUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IAuthUser;

    return data ? user?.[data] : user;
  },
);

export const GetIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip || request.connection.remoteAddress;
  },
);

export const GetUserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'] || '';
  },
);
