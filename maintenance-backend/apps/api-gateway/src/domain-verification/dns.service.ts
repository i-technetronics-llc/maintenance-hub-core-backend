import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

@Injectable()
export class DnsService {
  private readonly logger = new Logger(DnsService.name);

  /**
   * Verify TXT record for domain verification
   */
  async verifyTxtRecord(domain: string, expectedValue: string): Promise<boolean> {
    try {
      const recordName = `_cmms-verification.${domain}`;
      this.logger.debug(`Looking up TXT record for: ${recordName}`);

      const records = await resolveTxt(recordName);

      // TXT records come as array of arrays
      for (const record of records) {
        const txtValue = record.join('');
        this.logger.debug(`Found TXT record: ${txtValue}`);

        if (txtValue.includes(expectedValue) || txtValue === expectedValue) {
          this.logger.log(`TXT record verification successful for ${domain}`);
          return true;
        }
      }

      this.logger.warn(`TXT record not found or value mismatch for ${domain}`);
      return false;
    } catch (error) {
      this.logger.error(`DNS lookup failed for ${domain}: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify CNAME record for domain verification
   */
  async verifyCnameRecord(domain: string, expectedTarget: string): Promise<boolean> {
    try {
      const recordName = `_cmms-verification.${domain}`;
      this.logger.debug(`Looking up CNAME record for: ${recordName}`);

      const records = await resolveCname(recordName);

      for (const record of records) {
        this.logger.debug(`Found CNAME record: ${record}`);

        if (record === expectedTarget || record.includes(expectedTarget)) {
          this.logger.log(`CNAME record verification successful for ${domain}`);
          return true;
        }
      }

      this.logger.warn(`CNAME record not found or value mismatch for ${domain}`);
      return false;
    } catch (error) {
      this.logger.error(`CNAME DNS lookup failed for ${domain}: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate TXT record value for verification
   */
  generateTxtRecordValue(verificationCode: string): string {
    return `cmms-verify=${verificationCode}`;
  }

  /**
   * Get TXT record instructions
   */
  getTxtRecordInstructions(domain: string, verificationCode: string): {
    recordType: string;
    recordName: string;
    recordValue: string;
    instructions: string[];
  } {
    const txtValue = this.generateTxtRecordValue(verificationCode);

    return {
      recordType: 'TXT',
      recordName: `_cmms-verification.${domain}`,
      recordValue: txtValue,
      instructions: [
        '1. Log in to your domain registrar or DNS provider',
        '2. Navigate to DNS settings for your domain',
        '3. Add a new TXT record with the following details:',
        `   - Host/Name: _cmms-verification`,
        `   - Type: TXT`,
        `   - Value: ${txtValue}`,
        '4. Save the changes and wait for DNS propagation (usually 5-30 minutes)',
        '5. Click "Verify Now" to complete verification',
      ],
    };
  }

  /**
   * Extract domain from email
   */
  extractDomainFromEmail(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }

  /**
   * Check if email domain is a personal/free email provider
   */
  isPersonalEmailDomain(email: string): boolean {
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'msn.com',
      'aol.com',
      'icloud.com',
      'me.com',
      'mac.com',
      'protonmail.com',
      'proton.me',
      'zoho.com',
      'yandex.com',
      'mail.com',
      'gmx.com',
      'gmx.net',
      'inbox.com',
      'fastmail.com',
      'tutanota.com',
      'qq.com',
      '163.com',
      '126.com',
      'sina.com',
      'rediffmail.com',
      'mail.ru',
    ];

    const domain = this.extractDomainFromEmail(email);
    return personalDomains.includes(domain.toLowerCase());
  }

  /**
   * Validate corporate email
   */
  validateCorporateEmail(email: string): { valid: boolean; message?: string } {
    if (!email || !email.includes('@')) {
      return { valid: false, message: 'Invalid email format' };
    }

    if (this.isPersonalEmailDomain(email)) {
      return {
        valid: false,
        message: 'Personal email addresses are not allowed. Please use your corporate email.'
      };
    }

    return { valid: true };
  }
}
