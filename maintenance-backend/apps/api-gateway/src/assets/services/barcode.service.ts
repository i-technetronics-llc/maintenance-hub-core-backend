import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '@app/database/entities/asset.entity';
import * as crypto from 'crypto';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Generate unique barcode for an asset
   */
  generateBarcode(prefix: string = 'AST'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Generate QR code data for an asset
   */
  generateQrCodeData(asset: Asset): string {
    const qrData = {
      id: asset.id,
      code: asset.assetCode,
      name: asset.name,
      type: asset.type,
      location: asset.locationId,
      url: `/assets/${asset.id}`,
    };
    return JSON.stringify(qrData);
  }

  /**
   * Generate QR code URL (using external service)
   */
  generateQrCodeUrl(data: string, size: number = 200): string {
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
  }

  /**
   * Assign barcode to asset
   */
  async assignBarcode(assetId: string, barcode?: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new Error(`Asset with ID ${assetId} not found`);
    }

    asset.barcode = barcode || this.generateBarcode();
    asset.qrCode = this.generateQrCodeData(asset);

    return await this.assetRepository.save(asset);
  }

  /**
   * Lookup asset by barcode
   */
  async findByBarcode(barcode: string): Promise<Asset | null> {
    return await this.assetRepository.findOne({
      where: { barcode },
      relations: ['location', 'organization'],
    });
  }

  /**
   * Lookup asset by QR code data
   */
  async findByQrCode(qrData: string): Promise<Asset | null> {
    try {
      const data = JSON.parse(qrData);
      if (data.id) {
        return await this.assetRepository.findOne({
          where: { id: data.id },
          relations: ['location', 'organization'],
        });
      }
      if (data.code) {
        return await this.assetRepository.findOne({
          where: { assetCode: data.code },
          relations: ['location', 'organization'],
        });
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to parse QR code data: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate bulk barcodes for multiple assets
   */
  async generateBulkBarcodes(assetIds: string[]): Promise<Asset[]> {
    const assets: Asset[] = [];

    for (const assetId of assetIds) {
      const asset = await this.assignBarcode(assetId);
      assets.push(asset);
    }

    return assets;
  }

  /**
   * Validate barcode format
   */
  validateBarcodeFormat(barcode: string): boolean {
    // Format: PREFIX-TIMESTAMP-RANDOM (e.g., AST-LK5ABC-1A2B3C)
    const pattern = /^[A-Z]{2,5}-[A-Z0-9]{6,8}-[A-Z0-9]{6}$/;
    return pattern.test(barcode);
  }
}
