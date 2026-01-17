import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { DomainVerification } from '@app/database/entities/domain-verification.entity';
import { Company } from '@app/database/entities/company.entity';
import { VerificationStatus } from '@app/common/enums';
import { InitiateVerificationDto } from './dto';

@Injectable()
export class DomainVerificationService {
  private readonly logger = new Logger(DomainVerificationService.name);
  private readonly MAX_VERIFICATION_ATTEMPTS = 10;
  private readonly VERIFICATION_TIMEOUT = 5000; // 5 seconds

  constructor(
    @InjectRepository(DomainVerification)
    private domainVerificationRepository: Repository<DomainVerification>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  /**
   * Initiate domain verification for a company
   * Generates verification file info and creates verification record
   */
  async initiateVerification(initiateDto: InitiateVerificationDto): Promise<DomainVerification> {
    const { companyId } = initiateDto;

    // Get company
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`);
    }

    if (!company.verifiedDomain) {
      throw new BadRequestException('Company does not have a verified domain set. Please update company website first.');
    }

    // Check if there's already a pending or verified verification
    const existingVerification = await this.domainVerificationRepository.findOne({
      where: {
        companyId,
        status: VerificationStatus.VERIFIED,
      },
    });

    if (existingVerification) {
      throw new BadRequestException('Domain is already verified. If you need to re-verify, please contact support.');
    }

    // Check for existing pending verification
    const pendingVerification = await this.domainVerificationRepository.findOne({
      where: {
        companyId,
        status: VerificationStatus.PENDING,
      },
    });

    // If pending exists and not expired, return it
    if (pendingVerification && pendingVerification.attemptCount < this.MAX_VERIFICATION_ATTEMPTS) {
      return pendingVerification;
    }

    // Generate unique verification hash
    const verificationHash = this.generateVerificationHash(company.verifiedDomain);
    const verificationFileName = `company-verification-${verificationHash}.txt`;

    // Create new verification record
    const verification = this.domainVerificationRepository.create({
      companyId,
      domain: company.verifiedDomain,
      verificationHash,
      verificationFileName,
      status: VerificationStatus.PENDING,
      attemptCount: 0,
    });

    const savedVerification = await this.domainVerificationRepository.save(verification);

    this.logger.log(`Domain verification initiated for company ${companyId}, domain: ${company.verifiedDomain}`);

    return savedVerification;
  }

  /**
   * Generate unique verification hash using crypto
   */
  generateVerificationHash(domain: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const dataToHash = `${domain}-${timestamp}-${randomBytes}`;

    return crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex')
      .substring(0, 32); // Use first 32 characters
  }

  /**
   * Manually verify domain (triggered by "Verify Now" button)
   */
  async verifyDomainManually(verificationId: string): Promise<DomainVerification> {
    const verification = await this.domainVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['company'],
    });

    if (!verification) {
      throw new NotFoundException(`Verification with ID '${verificationId}' not found`);
    }

    if (verification.status === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Domain is already verified');
    }

    if (verification.attemptCount >= this.MAX_VERIFICATION_ATTEMPTS) {
      throw new BadRequestException(
        `Maximum verification attempts (${this.MAX_VERIFICATION_ATTEMPTS}) reached. Please contact support.`
      );
    }

    return await this.performVerification(verification);
  }

  /**
   * Automatically verify domain (called by background job)
   */
  async verifyDomainAutomatically(verificationId: string): Promise<DomainVerification> {
    const verification = await this.domainVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['company'],
    });

    if (!verification) {
      this.logger.warn(`Verification with ID '${verificationId}' not found`);
      return null;
    }

    if (verification.status === VerificationStatus.VERIFIED) {
      return verification;
    }

    if (verification.attemptCount >= this.MAX_VERIFICATION_ATTEMPTS) {
      this.logger.warn(
        `Verification ${verificationId} has reached max attempts (${this.MAX_VERIFICATION_ATTEMPTS})`
      );
      return verification;
    }

    return await this.performVerification(verification);
  }

  /**
   * Perform the actual verification check
   */
  private async performVerification(verification: DomainVerification): Promise<DomainVerification> {
    verification.attemptCount += 1;
    verification.lastCheckedAt = new Date();

    try {
      const isVerified = await this.checkVerificationFile(
        verification.domain,
        verification.verificationFileName,
        verification.verificationHash
      );

      if (isVerified) {
        verification.status = VerificationStatus.VERIFIED;
        verification.verifiedAt = new Date();
        verification.failureReason = null;

        // Update company's isDomainVerified flag
        await this.companyRepository.update(
          { id: verification.companyId },
          { isDomainVerified: true }
        );

        this.logger.log(`Domain verified successfully for verification ${verification.id}`);
      } else {
        verification.status = VerificationStatus.FAILED;
        verification.failureReason = 'Verification file not found or content mismatch';
        this.logger.warn(`Domain verification failed for verification ${verification.id}`);
      }
    } catch (error) {
      verification.status = VerificationStatus.FAILED;
      verification.failureReason = `HTTP request failed: ${error.message}`;
      this.logger.error(
        `Error verifying domain for verification ${verification.id}: ${error.message}`,
        error.stack
      );
    }

    return await this.domainVerificationRepository.save(verification);
  }

  /**
   * Check if verification file exists at domain root with correct content
   */
  async checkVerificationFile(
    domain: string,
    fileName: string,
    expectedHash: string
  ): Promise<boolean> {
    try {
      // Try HTTPS first
      let url = `https://${domain}/${fileName}`;

      this.logger.debug(`Checking verification file at: ${url}`);

      let response;
      try {
        response = await axios.get(url, {
          timeout: this.VERIFICATION_TIMEOUT,
          validateStatus: (status) => status === 200,
          maxRedirects: 5,
        });
      } catch (httpsError) {
        // If HTTPS fails, try HTTP
        this.logger.debug(`HTTPS failed, trying HTTP for ${domain}`);
        url = `http://${domain}/${fileName}`;

        response = await axios.get(url, {
          timeout: this.VERIFICATION_TIMEOUT,
          validateStatus: (status) => status === 200,
          maxRedirects: 5,
        });
      }

      const fileContent = response.data.toString().trim();
      const expectedContent = expectedHash.trim();

      this.logger.debug(
        `File content: "${fileContent}", Expected: "${expectedContent}"`
      );

      return fileContent === expectedContent;
    } catch (error) {
      this.logger.debug(
        `Failed to fetch verification file from ${domain}/${fileName}: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Get verification status for a company
   */
  async getVerificationStatus(companyId: string): Promise<DomainVerification | null> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`);
    }

    // Get the latest verification record
    const verification = await this.domainVerificationRepository.findOne({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return verification;
  }

  /**
   * Retry verification (resets attempt count)
   */
  async retryVerification(verificationId: string): Promise<DomainVerification> {
    const verification = await this.domainVerificationRepository.findOne({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException(`Verification with ID '${verificationId}' not found`);
    }

    if (verification.status === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Domain is already verified');
    }

    // Reset verification status and attempt count
    verification.status = VerificationStatus.PENDING;
    verification.attemptCount = 0;
    verification.failureReason = null;

    const updated = await this.domainVerificationRepository.save(verification);

    this.logger.log(`Verification ${verificationId} reset for retry`);

    return updated;
  }

  /**
   * Get all pending verifications (for background job)
   */
  async getPendingVerifications(): Promise<DomainVerification[]> {
    return await this.domainVerificationRepository.find({
      where: {
        status: VerificationStatus.PENDING,
      },
      relations: ['company'],
    });
  }

  /**
   * Get verification by ID
   */
  async getVerificationById(id: string): Promise<DomainVerification> {
    const verification = await this.domainVerificationRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!verification) {
      throw new NotFoundException(`Verification with ID '${id}' not found`);
    }

    return verification;
  }

  /**
   * Get verification instructions (for frontend display)
   */
  async getVerificationInstructions(verificationId: string): Promise<any> {
    const verification = await this.getVerificationById(verificationId);

    return {
      verificationId: verification.id,
      domain: verification.domain,
      fileName: verification.verificationFileName,
      fileContent: verification.verificationHash,
      instructions: [
        `1. Create a text file named: ${verification.verificationFileName}`,
        `2. Add the following content to the file (exactly as shown):`,
        `   ${verification.verificationHash}`,
        `3. Upload the file to the root directory of your website (${verification.domain})`,
        `4. The file should be accessible at: https://${verification.domain}/${verification.verificationFileName}`,
        `5. Click "Verify Now" or wait for automatic verification (runs every 4 hours)`,
      ],
      status: verification.status,
      attemptCount: verification.attemptCount,
      maxAttempts: this.MAX_VERIFICATION_ATTEMPTS,
      lastCheckedAt: verification.lastCheckedAt,
      failureReason: verification.failureReason,
    };
  }
}
