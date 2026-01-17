import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { IS_CUSTOMER_PUBLIC_KEY } from '../guards/customer-auth.guard';

export interface ICustomerUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  type: string;
  company: any;
}

// Mark a route as public (no authentication required)
export const CustomerPublic = () => SetMetadata(IS_CUSTOMER_PUBLIC_KEY, true);

// Get the current customer from request
export const CurrentCustomer = createParamDecorator(
  (data: keyof ICustomerUser | undefined, ctx: ExecutionContext): ICustomerUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const customer = request.user as ICustomerUser;

    return data ? customer?.[data] : customer;
  },
);
