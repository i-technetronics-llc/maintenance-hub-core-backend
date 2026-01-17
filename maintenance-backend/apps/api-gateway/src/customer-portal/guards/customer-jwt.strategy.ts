import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerAuthService } from '../customer-auth.service';

export interface CustomerJwtPayload {
  sub: string;
  email: string;
  name: string;
  companyId: string;
  type: string;
}

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(
    private configService: ConfigService,
    private customerAuthService: CustomerAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: CustomerJwtPayload) {
    // Verify this is a customer token, not an employee token
    if (payload.type !== 'customer') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Validate customer exists and is active
    const customer = await this.customerAuthService.validateCustomer(payload.sub);

    if (!customer) {
      throw new UnauthorizedException('Customer account not found or inactive');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      companyId: payload.companyId,
      type: 'customer',
      company: customer.company,
    };
  }
}
