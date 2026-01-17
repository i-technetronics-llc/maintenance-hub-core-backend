import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DomainVerificationService } from './domain-verification.service';
import { InitiateVerificationDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@app/common/guards';
import { Permissions } from '@app/common/decorators';

@ApiTags('Domain Verification')
@ApiBearerAuth()
@Controller('domain-verification')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DomainVerificationController {
  constructor(
    private readonly domainVerificationService: DomainVerificationService,
  ) {}

  @Post('initiate')
  @Permissions('companies:edit')
  @ApiOperation({ summary: 'Initiate domain verification for a company' })
  @ApiResponse({ status: 201, description: 'Domain verification initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or domain already verified' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async initiateVerification(@Body() initiateDto: InitiateVerificationDto) {
    const verification = await this.domainVerificationService.initiateVerification(initiateDto);
    const instructions = await this.domainVerificationService.getVerificationInstructions(verification.id);

    return {
      success: true,
      message: 'Domain verification initiated. Please follow the instructions below.',
      data: {
        verification,
        instructions,
      },
    };
  }

  @Post(':id/verify')
  @Permissions('companies:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually verify domain (Verify Now button)' })
  @ApiResponse({ status: 200, description: 'Verification check completed' })
  @ApiResponse({ status: 400, description: 'Bad request or max attempts reached' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async verifyDomain(@Param('id') id: string) {
    const verification = await this.domainVerificationService.verifyDomainManually(id);

    const isVerified = verification.status === 'verified';

    return {
      success: isVerified,
      message: isVerified
        ? 'Domain verified successfully! You can now enable STRICT email validation mode.'
        : `Domain verification failed. ${verification.failureReason || 'Please check the verification file and try again.'}`,
      data: verification,
    };
  }

  @Get('company/:companyId/status')
  @Permissions('companies:view')
  @ApiOperation({ summary: 'Get verification status for a company' })
  @ApiResponse({ status: 200, description: 'Verification status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getVerificationStatus(@Param('companyId') companyId: string) {
    const verification = await this.domainVerificationService.getVerificationStatus(companyId);

    if (!verification) {
      return {
        success: true,
        message: 'No verification found for this company',
        data: null,
      };
    }

    const instructions = await this.domainVerificationService.getVerificationInstructions(verification.id);

    return {
      success: true,
      data: {
        verification,
        instructions,
      },
    };
  }

  @Get(':id')
  @Permissions('companies:view')
  @ApiOperation({ summary: 'Get verification by ID' })
  @ApiResponse({ status: 200, description: 'Verification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async getVerificationById(@Param('id') id: string) {
    const verification = await this.domainVerificationService.getVerificationById(id);
    const instructions = await this.domainVerificationService.getVerificationInstructions(id);

    return {
      success: true,
      data: {
        verification,
        instructions,
      },
    };
  }

  @Post(':id/retry')
  @Permissions('companies:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry verification (resets attempt count)' })
  @ApiResponse({ status: 200, description: 'Verification reset for retry' })
  @ApiResponse({ status: 400, description: 'Domain already verified' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async retryVerification(@Param('id') id: string) {
    const verification = await this.domainVerificationService.retryVerification(id);

    return {
      success: true,
      message: 'Verification reset successfully. You can now try verifying again.',
      data: verification,
    };
  }

  @Get(':id/instructions')
  @Permissions('companies:view')
  @ApiOperation({ summary: 'Get verification instructions' })
  @ApiResponse({ status: 200, description: 'Instructions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async getInstructions(@Param('id') id: string) {
    const instructions = await this.domainVerificationService.getVerificationInstructions(id);

    return {
      success: true,
      data: instructions,
    };
  }
}
