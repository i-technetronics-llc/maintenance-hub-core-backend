import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainVerificationService } from './domain-verification.service';

@Injectable()
export class DomainVerificationJob {
  private readonly logger = new Logger(DomainVerificationJob.name);

  constructor(
    private readonly domainVerificationService: DomainVerificationService,
  ) {}

  /**
   * Automatic domain verification check
   * Runs every 4 hours
   */
  @Cron('0 */4 * * *', {
    name: 'domain-verification-check',
    timeZone: 'UTC',
  })
  async checkPendingVerifications() {
    this.logger.log('Starting automatic domain verification check...');

    try {
      const pendingVerifications = await this.domainVerificationService.getPendingVerifications();

      this.logger.log(`Found ${pendingVerifications.length} pending verification(s)`);

      let verifiedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const verification of pendingVerifications) {
        // Skip if max attempts reached
        if (verification.attemptCount >= 10) {
          this.logger.warn(
            `Skipping verification ${verification.id} - max attempts (10) reached`
          );
          skippedCount++;
          continue;
        }

        try {
          const result = await this.domainVerificationService.verifyDomainAutomatically(
            verification.id
          );

          if (result.status === 'verified') {
            verifiedCount++;
            this.logger.log(
              `✓ Domain verified successfully: ${result.domain} (verification: ${result.id})`
            );
          } else if (result.status === 'failed') {
            failedCount++;
            this.logger.warn(
              `✗ Domain verification failed: ${result.domain} (verification: ${result.id}). Attempt ${result.attemptCount}/10`
            );
          }
        } catch (error) {
          failedCount++;
          this.logger.error(
            `Error processing verification ${verification.id}: ${error.message}`,
            error.stack
          );
        }
      }

      this.logger.log(
        `Domain verification check completed. ` +
        `Verified: ${verifiedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}, Total: ${pendingVerifications.length}`
      );
    } catch (error) {
      this.logger.error(
        `Error in automatic domain verification check: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Manual trigger for testing (can be called via admin endpoint if needed)
   */
  async triggerManualCheck() {
    this.logger.log('Manually triggered domain verification check');
    await this.checkPendingVerifications();
  }
}
