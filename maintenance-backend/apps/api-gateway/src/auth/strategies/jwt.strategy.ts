import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database/entities/user.entity';
import { Company } from '@app/database/entities/company.entity';
import { CompanyStatus, UserRole, UserStatus } from '@app/common/enums';
import { IAuthUser } from '@app/common/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<IAuthUser> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['role', 'company'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check company status for non-super-admin users
    if (!payload.isSuperAdmin && user.company) {
      if (user.company.status === CompanyStatus.SUSPENDED) {
        throw new UnauthorizedException('Company account is suspended');
      }
      if (user.company.status === CompanyStatus.INACTIVE) {
        throw new UnauthorizedException('Company account is inactive');
      }
      if (user.company.status === CompanyStatus.PENDING_APPROVAL) {
        throw new UnauthorizedException('Company account is pending approval');
      }
      if (user.company.status === CompanyStatus.REJECTED) {
        throw new UnauthorizedException('Company account has been rejected');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: payload.role,
      roleId: payload.roleId,
      status: user.status,
      companyId: payload.companyId,
      companyType: payload.companyType,
      permissions: payload.permissions,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
