import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PredictionModel, PredictionModelType, PredictionModelStatus } from '@app/database/entities/prediction-model.entity';
import { AssetPrediction, PredictionType, PredictionStatus, RiskLevel } from '@app/database/entities/asset-prediction.entity';
import { SensorData, SensorType } from '@app/database/entities/sensor-data.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '@app/common/enums';
import {
  CreateSensorDataDto,
  BulkSensorDataDto,
  CreatePredictionModelDto,
  UpdatePredictionModelDto,
  TrainModelDto,
  AcknowledgePredictionDto,
  ResolvePredictionDto,
  CreateWorkOrderFromPredictionDto,
} from './dto';

interface StatisticalResult {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  count: number;
}

interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface FailurePredictionResult {
  probability: number;
  confidence: number;
  predictedDate: Date;
  riskLevel: RiskLevel;
  factors: Array<{
    name: string;
    contribution: number;
    value: number;
    threshold?: number;
    unit?: string;
    description?: string;
  }>;
  recommendedAction: string;
}

interface RemainingLifeResult {
  remainingDays: number;
  confidence: number;
  predictedFailureDate: Date;
  survivalProbability: number;
  factors: Array<{
    name: string;
    contribution: number;
    value: number;
    description?: string;
  }>;
}

@Injectable()
export class PredictiveMaintenanceService {
  private readonly logger = new Logger(PredictiveMaintenanceService.name);

  constructor(
    @InjectRepository(PredictionModel)
    private predictionModelRepository: Repository<PredictionModel>,
    @InjectRepository(AssetPrediction)
    private assetPredictionRepository: Repository<AssetPrediction>,
    @InjectRepository(SensorData)
    private sensorDataRepository: Repository<SensorData>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
  ) {}

  // ==================== STATISTICAL HELPER METHODS ====================

  /**
   * Calculate basic statistics for an array of numbers
   */
  private calculateStatistics(values: number[]): StatisticalResult {
    if (values.length === 0) {
      return {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        iqr: 0,
        count: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);

    return {
      mean,
      stdDev,
      min: sorted[0],
      max: sorted[n - 1],
      q1: sorted[q1Index],
      q2: sorted[q2Index],
      q3: sorted[q3Index],
      iqr: sorted[q3Index] - sorted[q1Index],
      count: n,
    };
  }

  /**
   * Calculate Z-score for a value given mean and standard deviation
   */
  private calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  /**
   * Detect anomaly using Z-score method
   */
  private detectAnomalyZScore(value: number, stats: StatisticalResult, threshold: number = 3): AnomalyResult {
    const zScore = this.calculateZScore(value, stats.mean, stats.stdDev);
    const absZScore = Math.abs(zScore);

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let isAnomaly = false;
    let message = 'Value within normal range';

    if (absZScore >= threshold * 2) {
      severity = 'critical';
      isAnomaly = true;
      message = `Critical anomaly: value is ${absZScore.toFixed(2)} standard deviations from mean`;
    } else if (absZScore >= threshold * 1.5) {
      severity = 'high';
      isAnomaly = true;
      message = `High severity anomaly: value is ${absZScore.toFixed(2)} standard deviations from mean`;
    } else if (absZScore >= threshold) {
      severity = 'medium';
      isAnomaly = true;
      message = `Medium severity anomaly: value is ${absZScore.toFixed(2)} standard deviations from mean`;
    } else if (absZScore >= threshold * 0.75) {
      severity = 'low';
      message = `Value approaching anomaly threshold (${absZScore.toFixed(2)} std dev)`;
    }

    return { isAnomaly, zScore, severity, message };
  }

  /**
   * Detect anomaly using IQR (Interquartile Range) method
   */
  private detectAnomalyIQR(value: number, stats: StatisticalResult, multiplier: number = 1.5): AnomalyResult {
    const lowerBound = stats.q1 - multiplier * stats.iqr;
    const upperBound = stats.q3 + multiplier * stats.iqr;

    const isAnomaly = value < lowerBound || value > upperBound;
    const zScore = this.calculateZScore(value, stats.mean, stats.stdDev);

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let message = 'Value within interquartile range';

    if (isAnomaly) {
      const extremeLowerBound = stats.q1 - 3 * stats.iqr;
      const extremeUpperBound = stats.q3 + 3 * stats.iqr;

      if (value < extremeLowerBound || value > extremeUpperBound) {
        severity = 'critical';
        message = 'Extreme outlier detected (beyond 3x IQR)';
      } else if (value < stats.q1 - 2 * stats.iqr || value > stats.q3 + 2 * stats.iqr) {
        severity = 'high';
        message = 'Significant outlier detected (beyond 2x IQR)';
      } else {
        severity = 'medium';
        message = 'Moderate outlier detected (beyond 1.5x IQR)';
      }
    }

    return { isAnomaly, zScore, severity, message };
  }

  /**
   * Exponential smoothing for trend prediction
   * Uses Holt's double exponential smoothing for trend estimation
   */
  private exponentialSmoothing(
    values: number[],
    alpha: number = 0.3,
    beta: number = 0.1,
    periodsAhead: number = 30
  ): { forecast: number[]; trend: number; level: number } {
    if (values.length < 2) {
      return { forecast: [], trend: 0, level: values[0] || 0 };
    }

    // Initialize
    let level = values[0];
    let trend = values[1] - values[0];

    // Apply double exponential smoothing
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Generate forecast
    const forecast: number[] = [];
    for (let i = 1; i <= periodsAhead; i++) {
      forecast.push(level + i * trend);
    }

    return { forecast, trend, level };
  }

  /**
   * Weibull distribution for remaining useful life estimation
   * Shape (k): determines failure rate behavior
   *   k < 1: decreasing failure rate (infant mortality)
   *   k = 1: constant failure rate (exponential)
   *   k > 1: increasing failure rate (wear-out failures)
   * Scale (lambda): characteristic life
   */
  private weibullSurvival(
    currentAge: number,
    shape: number = 2,
    scale: number = 1000
  ): { survivalProbability: number; hazardRate: number; remainingLife: number } {
    // Survival function: S(t) = exp(-(t/lambda)^k)
    const survivalProbability = Math.exp(-Math.pow(currentAge / scale, shape));

    // Hazard rate: h(t) = (k/lambda) * (t/lambda)^(k-1)
    const hazardRate = (shape / scale) * Math.pow(currentAge / scale, shape - 1);

    // Mean remaining life (approximate using integration)
    // For Weibull: E[T-t|T>t] can be computed numerically
    const remainingLife = this.estimateRemainingLife(currentAge, shape, scale, survivalProbability);

    return { survivalProbability, hazardRate, remainingLife };
  }

  /**
   * Estimate remaining useful life using numerical integration
   */
  private estimateRemainingLife(
    currentAge: number,
    shape: number,
    scale: number,
    currentSurvival: number
  ): number {
    // Simplified: use median remaining life
    // Solve for t: S(currentAge + t) / S(currentAge) = 0.5
    // This gives us the time when half of similar components would have failed

    const targetSurvival = currentSurvival * 0.5;

    // Binary search for the time when survival drops to target
    let low = 0;
    let high = scale * 5; // Upper bound

    while (high - low > 1) {
      const mid = (low + high) / 2;
      const survival = Math.exp(-Math.pow((currentAge + mid) / scale, shape));

      if (survival > targetSurvival) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return Math.round((low + high) / 2);
  }

  // ==================== SENSOR DATA METHODS ====================

  /**
   * Ingest sensor data and perform real-time anomaly detection
   */
  async ingestSensorData(
    dto: CreateSensorDataDto,
    organizationId: string
  ): Promise<SensorData & { anomalyResult?: AnomalyResult }> {
    // Verify asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: dto.assetId, organizationId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${dto.assetId} not found`);
    }

    // Get historical data for anomaly detection
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalData = await this.sensorDataRepository.find({
      where: {
        assetId: dto.assetId,
        sensorType: dto.sensorType,
        timestamp: MoreThanOrEqual(thirtyDaysAgo),
        organizationId,
      },
      order: { timestamp: 'ASC' },
    });

    // Calculate statistics and detect anomaly
    const values = historicalData.map(d => Number(d.value));
    const stats = this.calculateStatistics(values);
    const anomalyResult = this.detectAnomalyZScore(dto.value, stats, 3);

    // Create sensor data record
    const sensorData = this.sensorDataRepository.create({
      ...dto,
      timestamp: dto.timestamp || new Date(),
      organizationId,
      isAnomaly: anomalyResult.isAnomaly,
      zScore: anomalyResult.zScore,
      isOutOfRange: dto.minExpected !== undefined && dto.maxExpected !== undefined
        ? (dto.value < dto.minExpected || dto.value > dto.maxExpected)
        : false,
    });

    const savedData = await this.sensorDataRepository.save(sensorData);

    // If anomaly detected, create a prediction
    if (anomalyResult.isAnomaly) {
      await this.createAnomalyPrediction(asset, savedData, anomalyResult, stats, organizationId);
    }

    return { ...savedData, anomalyResult };
  }

  /**
   * Bulk ingest sensor data
   */
  async bulkIngestSensorData(
    dto: BulkSensorDataDto,
    organizationId: string
  ): Promise<{ processed: number; anomalies: number }> {
    let anomalies = 0;

    for (const reading of dto.readings) {
      const result = await this.ingestSensorData(reading, organizationId);
      if (result.isAnomaly) anomalies++;
    }

    return {
      processed: dto.readings.length,
      anomalies,
    };
  }

  /**
   * Create an anomaly prediction from detected sensor anomaly
   */
  private async createAnomalyPrediction(
    asset: Asset,
    sensorData: SensorData,
    anomalyResult: AnomalyResult,
    stats: StatisticalResult,
    organizationId: string
  ): Promise<AssetPrediction> {
    const riskLevel = this.mapSeverityToRiskLevel(anomalyResult.severity);

    const prediction = this.assetPredictionRepository.create({
      assetId: asset.id,
      organizationId,
      predictionType: PredictionType.ANOMALY,
      prediction: `Anomaly detected in ${sensorData.sensorType} readings: ${anomalyResult.message}`,
      probability: Math.min(100, Math.abs(anomalyResult.zScore) * 20),
      confidence: stats.count >= 30 ? 85 : Math.min(85, stats.count * 2.8),
      riskLevel,
      status: PredictionStatus.NEW,
      factors: [
        {
          name: 'Sensor Reading',
          contribution: 100,
          value: Number(sensorData.value),
          threshold: stats.mean + (3 * stats.stdDev),
          unit: sensorData.unit || '',
          description: `Current value deviates ${Math.abs(anomalyResult.zScore).toFixed(2)} standard deviations from mean`,
        },
      ],
      recommendedAction: this.getRecommendedAction(anomalyResult.severity, sensorData.sensorType),
      estimatedCost: this.estimateRepairCost(anomalyResult.severity, asset.type),
    });

    return this.assetPredictionRepository.save(prediction);
  }

  private mapSeverityToRiskLevel(severity: string): RiskLevel {
    switch (severity) {
      case 'critical': return RiskLevel.CRITICAL;
      case 'high': return RiskLevel.HIGH;
      case 'medium': return RiskLevel.MEDIUM;
      default: return RiskLevel.LOW;
    }
  }

  private getRecommendedAction(severity: string, sensorType: SensorType): string {
    const actions: Record<string, Record<string, string>> = {
      critical: {
        temperature: 'Immediate shutdown and inspection required. Check cooling system and thermal overload protection.',
        vibration: 'Stop equipment immediately. Inspect bearings, alignment, and mounting.',
        pressure: 'Emergency pressure relief required. Check for blockages and valve functionality.',
        current: 'Disconnect and inspect electrical connections. Check for short circuits.',
        default: 'Stop operation and perform immediate inspection.',
      },
      high: {
        temperature: 'Schedule urgent maintenance. Monitor continuously and reduce load if possible.',
        vibration: 'Schedule bearing inspection within 48 hours. Reduce operating speed.',
        pressure: 'Check pressure relief valves and seals. Monitor closely.',
        current: 'Check electrical load and connections. Consider load reduction.',
        default: 'Schedule maintenance within 48 hours.',
      },
      medium: {
        temperature: 'Schedule inspection during next maintenance window. Check cooling efficiency.',
        vibration: 'Add to next preventive maintenance cycle. Monitor trend.',
        pressure: 'Verify calibration and check for minor leaks.',
        current: 'Review electrical load distribution.',
        default: 'Include in next scheduled maintenance.',
      },
      low: {
        default: 'Continue monitoring. No immediate action required.',
      },
    };

    return actions[severity]?.[sensorType] || actions[severity]?.default || actions.low.default;
  }

  private estimateRepairCost(severity: string, assetType: string): number {
    // Simplified cost estimation based on severity
    const baseCosts: Record<string, number> = {
      critical: 5000,
      high: 2500,
      medium: 1000,
      low: 250,
    };

    return baseCosts[severity] || 500;
  }

  // ==================== ANALYSIS METHODS ====================

  /**
   * Analyze sensor data for an asset and generate predictions
   */
  async analyzeSensorData(assetId: string, organizationId: string): Promise<{
    anomalies: AssetPrediction[];
    statistics: Record<string, StatisticalResult>;
    trends: Record<string, { trend: 'increasing' | 'decreasing' | 'stable'; rate: number }>;
  }> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, organizationId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sensorData = await this.sensorDataRepository.find({
      where: {
        assetId,
        organizationId,
        timestamp: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { timestamp: 'ASC' },
    });

    // Group by sensor type
    const groupedData: Record<string, SensorData[]> = {};
    for (const data of sensorData) {
      if (!groupedData[data.sensorType]) {
        groupedData[data.sensorType] = [];
      }
      groupedData[data.sensorType].push(data);
    }

    const statistics: Record<string, StatisticalResult> = {};
    const trends: Record<string, { trend: 'increasing' | 'decreasing' | 'stable'; rate: number }> = {};
    const anomalies: AssetPrediction[] = [];

    for (const [sensorType, dataPoints] of Object.entries(groupedData)) {
      const values = dataPoints.map(d => Number(d.value));
      statistics[sensorType] = this.calculateStatistics(values);

      // Calculate trend using exponential smoothing
      const smoothed = this.exponentialSmoothing(values);
      const trendDirection = smoothed.trend > 0.01 ? 'increasing'
        : smoothed.trend < -0.01 ? 'decreasing' : 'stable';
      trends[sensorType] = { trend: trendDirection, rate: smoothed.trend };

      // Find anomalies in recent data (last 24 hours)
      const recentData = dataPoints.filter(d =>
        new Date(d.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      for (const data of recentData) {
        if (data.isAnomaly) {
          const existingPrediction = await this.assetPredictionRepository.findOne({
            where: {
              assetId,
              predictionType: PredictionType.ANOMALY,
              status: PredictionStatus.NEW,
              createdAt: MoreThanOrEqual(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            },
          });

          if (!existingPrediction) {
            const anomalyResult = this.detectAnomalyZScore(Number(data.value), statistics[sensorType]);
            const prediction = await this.createAnomalyPrediction(
              asset,
              data,
              anomalyResult,
              statistics[sensorType],
              organizationId
            );
            anomalies.push(prediction);
          }
        }
      }
    }

    return { anomalies, statistics, trends };
  }

  /**
   * Predict failure probability for an asset
   */
  async predictFailure(assetId: string, organizationId: string): Promise<FailurePredictionResult> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, organizationId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Get sensor data and maintenance history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sensorData = await this.sensorDataRepository.find({
      where: {
        assetId,
        organizationId,
        timestamp: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { timestamp: 'DESC' },
    });

    const workOrders = await this.workOrderRepository.find({
      where: {
        assetId,
        clientOrgId: organizationId,
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    // Calculate factors contributing to failure probability
    const factors: FailurePredictionResult['factors'] = [];
    let totalProbability = 0;
    let factorWeights = 0;

    // Factor 1: Anomaly frequency
    const anomalyCount = sensorData.filter(d => d.isAnomaly).length;
    const anomalyRate = sensorData.length > 0 ? (anomalyCount / sensorData.length) * 100 : 0;
    const anomalyContribution = Math.min(30, anomalyRate * 3);
    factors.push({
      name: 'Anomaly Frequency',
      contribution: anomalyContribution,
      value: anomalyRate,
      threshold: 10,
      unit: '%',
      description: `${anomalyCount} anomalies detected in ${sensorData.length} readings`,
    });
    totalProbability += anomalyContribution;
    factorWeights += 30;

    // Factor 2: Age since last maintenance
    const daysSinceLastMaintenance = asset.lastMaintenanceDate
      ? Math.floor((Date.now() - new Date(asset.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const expectedMaintenanceInterval = 90; // Default 90 days
    const ageContribution = Math.min(25, (daysSinceLastMaintenance / expectedMaintenanceInterval) * 15);
    factors.push({
      name: 'Days Since Maintenance',
      contribution: ageContribution,
      value: daysSinceLastMaintenance,
      threshold: expectedMaintenanceInterval,
      unit: 'days',
      description: `Last maintained ${daysSinceLastMaintenance} days ago`,
    });
    totalProbability += ageContribution;
    factorWeights += 25;

    // Factor 3: Recent work order frequency
    const recentWorkOrders = workOrders.filter(wo =>
      new Date(wo.createdAt).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
    );
    const workOrderContribution = Math.min(20, recentWorkOrders.length * 4);
    factors.push({
      name: 'Recent Work Orders',
      contribution: workOrderContribution,
      value: recentWorkOrders.length,
      threshold: 3,
      description: `${recentWorkOrders.length} work orders in last 90 days`,
    });
    totalProbability += workOrderContribution;
    factorWeights += 20;

    // Factor 4: Asset criticality
    const criticalityContribution = (asset.criticality || 3) * 3;
    factors.push({
      name: 'Asset Criticality',
      contribution: criticalityContribution,
      value: asset.criticality || 3,
      threshold: 5,
      description: `Criticality level: ${asset.criticality || 3}/5`,
    });
    totalProbability += criticalityContribution;
    factorWeights += 15;

    // Factor 5: Trend analysis (if we have enough data)
    if (sensorData.length >= 10) {
      const values = sensorData.map(d => Number(d.value)).reverse();
      const smoothed = this.exponentialSmoothing(values);
      const trendContribution = smoothed.trend > 0.05 ? 10 : smoothed.trend > 0 ? 5 : 0;
      factors.push({
        name: 'Trend Direction',
        contribution: trendContribution,
        value: smoothed.trend,
        description: smoothed.trend > 0.05 ? 'Strong upward trend detected' :
          smoothed.trend > 0 ? 'Slight upward trend' : 'Stable or decreasing trend',
      });
      totalProbability += trendContribution;
      factorWeights += 10;
    }

    // Normalize probability
    const probability = Math.min(100, (totalProbability / factorWeights) * 100);

    // Calculate confidence based on data availability
    const confidence = Math.min(95,
      (sensorData.length >= 100 ? 40 : sensorData.length * 0.4) +
      (workOrders.length >= 5 ? 30 : workOrders.length * 6) +
      25
    );

    // Estimate failure date
    const daysUntilFailure = Math.max(1, Math.round(100 / (probability || 1) * 30));
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysUntilFailure);

    // Determine risk level
    let riskLevel: RiskLevel;
    if (probability >= 75) riskLevel = RiskLevel.CRITICAL;
    else if (probability >= 50) riskLevel = RiskLevel.HIGH;
    else if (probability >= 25) riskLevel = RiskLevel.MEDIUM;
    else riskLevel = RiskLevel.LOW;

    // Generate recommended action
    let recommendedAction = '';
    if (probability >= 75) {
      recommendedAction = 'Schedule emergency maintenance immediately. High failure probability detected.';
    } else if (probability >= 50) {
      recommendedAction = 'Plan maintenance within the next 7 days. Significant failure indicators present.';
    } else if (probability >= 25) {
      recommendedAction = 'Include in next preventive maintenance cycle. Monitor trends closely.';
    } else {
      recommendedAction = 'Continue regular monitoring. No immediate action required.';
    }

    // Save prediction
    const prediction = this.assetPredictionRepository.create({
      assetId,
      organizationId,
      predictionType: PredictionType.FAILURE,
      prediction: `Failure probability: ${probability.toFixed(1)}%`,
      probability,
      confidence,
      predictedDate,
      riskLevel,
      status: PredictionStatus.NEW,
      factors,
      recommendedAction,
      estimatedCost: this.estimateRepairCost(riskLevel, asset.type),
      potentialSavings: this.estimateRepairCost('critical', asset.type) * (probability / 100),
    });

    await this.assetPredictionRepository.save(prediction);

    return {
      probability,
      confidence,
      predictedDate,
      riskLevel,
      factors,
      recommendedAction,
    };
  }

  /**
   * Calculate remaining useful life for an asset
   */
  async calculateRemainingLife(assetId: string, organizationId: string): Promise<RemainingLifeResult> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, organizationId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Calculate age in days
    const installedDate = asset.installedDate ? new Date(asset.installedDate) : new Date(asset.createdAt);
    const ageInDays = Math.floor((Date.now() - installedDate.getTime()) / (1000 * 60 * 60 * 24));

    // Expected useful life from asset or default
    const usefulLifeDays = (asset.usefulLifeYears || 10) * 365;

    // Get Weibull parameters (could be from a trained model or defaults)
    const model = await this.predictionModelRepository.findOne({
      where: {
        assetType: asset.type,
        modelType: PredictionModelType.REMAINING_LIFE,
        organizationId,
        status: PredictionModelStatus.ACTIVE,
      },
    });

    const shape = model?.parameters?.shape || 2.5; // Typical wear-out value
    const scale = model?.parameters?.scale || usefulLifeDays;

    // Calculate Weibull survival
    const weibull = this.weibullSurvival(ageInDays, shape, scale);

    const factors: RemainingLifeResult['factors'] = [
      {
        name: 'Current Age',
        contribution: 40,
        value: ageInDays,
        description: `Asset has been operational for ${ageInDays} days`,
      },
      {
        name: 'Survival Probability',
        contribution: 30,
        value: weibull.survivalProbability * 100,
        description: `${(weibull.survivalProbability * 100).toFixed(1)}% probability of continued operation`,
      },
      {
        name: 'Hazard Rate',
        contribution: 20,
        value: weibull.hazardRate * 1000, // Per 1000 days for readability
        description: `Current failure hazard rate: ${(weibull.hazardRate * 1000).toFixed(4)}/1000 days`,
      },
      {
        name: 'Maintenance History',
        contribution: 10,
        value: asset.totalMaintenanceCount || 0,
        description: `${asset.totalMaintenanceCount || 0} maintenance events recorded`,
      },
    ];

    // Calculate confidence based on data quality
    const confidence = Math.min(90,
      (asset.installedDate ? 30 : 10) +
      (asset.usefulLifeYears ? 20 : 5) +
      (model ? 30 : 15) +
      (asset.totalMaintenanceCount > 0 ? 15 : 5)
    );

    // Predicted failure date
    const predictedFailureDate = new Date();
    predictedFailureDate.setDate(predictedFailureDate.getDate() + weibull.remainingLife);

    // Save prediction
    const prediction = this.assetPredictionRepository.create({
      assetId,
      organizationId,
      predictionType: PredictionType.REMAINING_LIFE,
      prediction: `Estimated remaining useful life: ${weibull.remainingLife} days`,
      probability: (1 - weibull.survivalProbability) * 100,
      confidence,
      predictedDate: predictedFailureDate,
      remainingLifeDays: weibull.remainingLife,
      riskLevel: weibull.remainingLife < 30 ? RiskLevel.CRITICAL :
                 weibull.remainingLife < 90 ? RiskLevel.HIGH :
                 weibull.remainingLife < 180 ? RiskLevel.MEDIUM : RiskLevel.LOW,
      status: PredictionStatus.NEW,
      factors,
      recommendedAction: weibull.remainingLife < 30
        ? 'Plan for asset replacement within the next month'
        : weibull.remainingLife < 90
        ? 'Begin procurement process for replacement parts or equipment'
        : 'Continue regular maintenance and monitoring',
      estimatedCost: asset.replacementCost ? Number(asset.replacementCost) : 10000,
    });

    await this.assetPredictionRepository.save(prediction);

    return {
      remainingDays: weibull.remainingLife,
      confidence,
      predictedFailureDate,
      survivalProbability: weibull.survivalProbability * 100,
      factors,
    };
  }

  // ==================== MODEL MANAGEMENT ====================

  /**
   * Create a new prediction model
   */
  async createModel(dto: CreatePredictionModelDto, organizationId: string): Promise<PredictionModel> {
    const model = this.predictionModelRepository.create({
      ...dto,
      organizationId,
      parameters: dto.parameters || this.getDefaultParameters(dto.modelType),
    });

    return this.predictionModelRepository.save(model);
  }

  private getDefaultParameters(modelType: PredictionModelType): Record<string, any> {
    switch (modelType) {
      case PredictionModelType.ANOMALY_DETECTION:
        return {
          zScoreThreshold: 3,
          iqrMultiplier: 1.5,
          windowSize: 100,
          minDataPoints: 30,
        };
      case PredictionModelType.FAILURE_PREDICTION:
        return {
          alpha: 0.3,
          beta: 0.1,
          windowSize: 30,
          minDataPoints: 50,
        };
      case PredictionModelType.REMAINING_LIFE:
        return {
          shape: 2.5,
          scale: 3650, // 10 years in days
          minDataPoints: 10,
        };
      default:
        return {};
    }
  }

  /**
   * Train or update a prediction model based on historical data
   */
  async trainModel(
    modelId: string,
    organizationId: string,
    dto: TrainModelDto = {}
  ): Promise<PredictionModel> {
    const model = await this.predictionModelRepository.findOne({
      where: { id: modelId, organizationId },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found`);
    }

    const historicalDays = dto.historicalDays || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    // Get historical sensor data for assets of this type
    const assets = await this.assetRepository.find({
      where: { type: model.assetType, organizationId },
    });

    const assetIds = assets.map(a => a.id);

    if (assetIds.length === 0) {
      throw new BadRequestException(`No assets found for type: ${model.assetType}`);
    }

    // Get sensor data
    const sensorData = await this.sensorDataRepository
      .createQueryBuilder('sd')
      .where('sd.assetId IN (:...assetIds)', { assetIds })
      .andWhere('sd.timestamp >= :startDate', { startDate })
      .andWhere('sd.organizationId = :organizationId', { organizationId })
      .orderBy('sd.timestamp', 'ASC')
      .getMany();

    if (sensorData.length < (model.parameters.minDataPoints || 30)) {
      throw new BadRequestException(
        `Insufficient training data. Found ${sensorData.length} points, need at least ${model.parameters.minDataPoints || 30}`
      );
    }

    // Update model status to training
    model.status = PredictionModelStatus.TRAINING;
    await this.predictionModelRepository.save(model);

    try {
      // Calculate training statistics
      const values = sensorData.map(d => Number(d.value));
      const stats = this.calculateStatistics(values);

      // Update model parameters based on training
      model.trainingStats = {
        mean: stats.mean,
        stdDev: stats.stdDev,
        min: stats.min,
        max: stats.max,
        q1: stats.q1,
        q2: stats.q2,
        q3: stats.q3,
      };

      model.trainingDataPoints = sensorData.length;
      model.lastTrainedAt = new Date();

      // For anomaly detection, optimize threshold based on data
      if (model.modelType === PredictionModelType.ANOMALY_DETECTION) {
        // Use adaptive threshold based on data distribution
        const adaptiveThreshold = this.calculateAdaptiveThreshold(values, stats);
        model.parameters = {
          ...model.parameters,
          zScoreThreshold: adaptiveThreshold,
        };
      }

      // Calculate accuracy based on predictions vs actuals (if we have resolved predictions)
      const resolvedPredictions = await this.assetPredictionRepository.find({
        where: {
          organizationId,
          status: PredictionStatus.RESOLVED,
          wasAccurate: true,
        },
      });

      if (resolvedPredictions.length > 0) {
        const totalResolved = await this.assetPredictionRepository.count({
          where: {
            organizationId,
            status: PredictionStatus.RESOLVED,
          },
        });
        model.accuracy = (resolvedPredictions.length / totalResolved) * 100;
        model.correctPredictions = resolvedPredictions.length;
        model.totalPredictions = totalResolved;
      }

      model.status = PredictionModelStatus.ACTIVE;
      return this.predictionModelRepository.save(model);

    } catch (error) {
      model.status = PredictionModelStatus.FAILED;
      await this.predictionModelRepository.save(model);
      throw error;
    }
  }

  private calculateAdaptiveThreshold(values: number[], stats: StatisticalResult): number {
    // If data is highly variable, use a higher threshold
    const coefficientOfVariation = stats.stdDev / Math.abs(stats.mean);

    if (coefficientOfVariation > 0.5) {
      return 4; // High variability - be more lenient
    } else if (coefficientOfVariation > 0.25) {
      return 3; // Normal variability
    } else {
      return 2.5; // Low variability - be more strict
    }
  }

  // ==================== WORK ORDER GENERATION ====================

  /**
   * Generate a predictive work order from a prediction
   */
  async generatePredictiveWorkOrder(
    dto: CreateWorkOrderFromPredictionDto,
    organizationId: string,
    userId: string
  ): Promise<WorkOrder> {
    const prediction = await this.assetPredictionRepository.findOne({
      where: { id: dto.predictionId, organizationId },
      relations: ['asset'],
    });

    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${dto.predictionId} not found`);
    }

    if (!prediction.asset) {
      throw new BadRequestException('Prediction has no associated asset');
    }

    // Determine priority based on risk level
    let priority: WorkOrderPriority;
    switch (prediction.riskLevel) {
      case RiskLevel.CRITICAL:
        priority = WorkOrderPriority.CRITICAL;
        break;
      case RiskLevel.HIGH:
        priority = WorkOrderPriority.HIGH;
        break;
      case RiskLevel.MEDIUM:
        priority = WorkOrderPriority.MEDIUM;
        break;
      default:
        priority = WorkOrderPriority.LOW;
    }

    // Generate work order number
    const woCount = await this.workOrderRepository.count({ where: { clientOrgId: organizationId } });
    const woNumber = `PM-WO-${String(woCount + 1).padStart(6, '0')}`;

    const workOrder = this.workOrderRepository.create({
      woNumber,
      title: dto.title || `Predictive Maintenance: ${prediction.asset.name}`,
      description: dto.description ||
        `${prediction.prediction}\n\nRecommended Action: ${prediction.recommendedAction}\n\nConfidence: ${prediction.confidence}%`,
      type: WorkOrderType.PREDICTIVE,
      priority,
      status: WorkOrderStatus.DRAFT,
      assetId: prediction.assetId,
      clientOrgId: organizationId,
      assignedToId: dto.assignedToId,
      scheduledDate: dto.scheduledDate || prediction.predictedDate,
      estimatedCost: prediction.estimatedCost ? Number(prediction.estimatedCost) : undefined,
      createdById: userId,
    });

    const savedWorkOrder = await this.workOrderRepository.save(workOrder);

    // Update prediction status
    prediction.status = PredictionStatus.WORK_ORDER_CREATED;
    prediction.workOrderId = savedWorkOrder.id;
    await this.assetPredictionRepository.save(prediction);

    return savedWorkOrder;
  }

  // ==================== QUERY METHODS ====================

  /**
   * Get predictions for an asset
   */
  async getPredictions(
    assetId: string,
    organizationId: string,
    options: {
      status?: PredictionStatus;
      type?: PredictionType;
      riskLevel?: RiskLevel;
      limit?: number;
    } = {}
  ): Promise<AssetPrediction[]> {
    const query = this.assetPredictionRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.asset', 'asset')
      .leftJoinAndSelect('prediction.predictionModel', 'model')
      .where('prediction.assetId = :assetId', { assetId })
      .andWhere('prediction.organizationId = :organizationId', { organizationId });

    if (options.status) {
      query.andWhere('prediction.status = :status', { status: options.status });
    }

    if (options.type) {
      query.andWhere('prediction.predictionType = :type', { type: options.type });
    }

    if (options.riskLevel) {
      query.andWhere('prediction.riskLevel = :riskLevel', { riskLevel: options.riskLevel });
    }

    query.orderBy('prediction.createdAt', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }

    return query.getMany();
  }

  /**
   * Get all anomalies for an organization
   */
  async getAnomalies(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      assetId?: string;
      riskLevel?: RiskLevel;
      limit?: number;
    } = {}
  ): Promise<AssetPrediction[]> {
    const query = this.assetPredictionRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.asset', 'asset')
      .where('prediction.organizationId = :organizationId', { organizationId })
      .andWhere('prediction.predictionType = :type', { type: PredictionType.ANOMALY });

    if (options.startDate) {
      query.andWhere('prediction.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      query.andWhere('prediction.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (options.assetId) {
      query.andWhere('prediction.assetId = :assetId', { assetId: options.assetId });
    }

    if (options.riskLevel) {
      query.andWhere('prediction.riskLevel = :riskLevel', { riskLevel: options.riskLevel });
    }

    query.orderBy('prediction.createdAt', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }

    return query.getMany();
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(organizationId: string): Promise<{
    activePredictions: number;
    criticalAlerts: number;
    highRiskAlerts: number;
    mediumRiskAlerts: number;
    lowRiskAlerts: number;
    anomaliesLast24h: number;
    failuresPrevented: number;
    potentialSavings: number;
    modelAccuracy: number;
    assetsMonitored: number;
    predictionsByType: Record<string, number>;
    recentPredictions: AssetPrediction[];
    assetHealthScores: Array<{ assetId: string; assetName: string; healthScore: number; riskLevel: string }>;
  }> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Count predictions by status
    const [
      activePredictions,
      criticalAlerts,
      highRiskAlerts,
      mediumRiskAlerts,
      lowRiskAlerts,
      anomaliesLast24h,
      failuresPrevented,
    ] = await Promise.all([
      this.assetPredictionRepository.count({
        where: { organizationId, status: PredictionStatus.NEW },
      }),
      this.assetPredictionRepository.count({
        where: { organizationId, status: PredictionStatus.NEW, riskLevel: RiskLevel.CRITICAL },
      }),
      this.assetPredictionRepository.count({
        where: { organizationId, status: PredictionStatus.NEW, riskLevel: RiskLevel.HIGH },
      }),
      this.assetPredictionRepository.count({
        where: { organizationId, status: PredictionStatus.NEW, riskLevel: RiskLevel.MEDIUM },
      }),
      this.assetPredictionRepository.count({
        where: { organizationId, status: PredictionStatus.NEW, riskLevel: RiskLevel.LOW },
      }),
      this.assetPredictionRepository.count({
        where: {
          organizationId,
          predictionType: PredictionType.ANOMALY,
          createdAt: MoreThanOrEqual(yesterday),
        },
      }),
      this.assetPredictionRepository.count({
        where: { organizationId, status: PredictionStatus.RESOLVED, wasAccurate: true },
      }),
    ]);

    // Calculate potential savings
    const savingsResult = await this.assetPredictionRepository
      .createQueryBuilder('prediction')
      .select('SUM(prediction.potentialSavings)', 'total')
      .where('prediction.organizationId = :organizationId', { organizationId })
      .andWhere('prediction.status IN (:...statuses)', {
        statuses: [PredictionStatus.WORK_ORDER_CREATED, PredictionStatus.RESOLVED],
      })
      .getRawOne();

    // Get model accuracy
    const models = await this.predictionModelRepository.find({
      where: { organizationId, status: PredictionModelStatus.ACTIVE },
    });
    const modelAccuracy = models.length > 0
      ? models.reduce((sum, m) => sum + Number(m.accuracy), 0) / models.length
      : 85; // Default

    // Count assets being monitored
    const assetsMonitored = await this.sensorDataRepository
      .createQueryBuilder('sd')
      .select('COUNT(DISTINCT sd.assetId)', 'count')
      .where('sd.organizationId = :organizationId', { organizationId })
      .andWhere('sd.timestamp >= :yesterday', { yesterday })
      .getRawOne();

    // Get predictions by type
    const predictionsByTypeResult = await this.assetPredictionRepository
      .createQueryBuilder('prediction')
      .select('prediction.predictionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('prediction.organizationId = :organizationId', { organizationId })
      .groupBy('prediction.predictionType')
      .getRawMany();

    const predictionsByType: Record<string, number> = {};
    for (const row of predictionsByTypeResult) {
      predictionsByType[row.type] = parseInt(row.count);
    }

    // Get recent predictions
    const recentPredictions = await this.assetPredictionRepository.find({
      where: { organizationId },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Calculate asset health scores
    const assetsWithPredictions = await this.assetPredictionRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.asset', 'asset')
      .where('prediction.organizationId = :organizationId', { organizationId })
      .andWhere('prediction.status = :status', { status: PredictionStatus.NEW })
      .groupBy('prediction.assetId')
      .addGroupBy('asset.id')
      .addGroupBy('asset.name')
      .select([
        'prediction.assetId as assetId',
        'asset.name as assetName',
        'MAX(prediction.probability) as maxProbability',
        'MAX(prediction.riskLevel) as riskLevel',
      ])
      .getRawMany();

    const assetHealthScores = assetsWithPredictions.map(a => ({
      assetId: a.assetId,
      assetName: a.assetName || 'Unknown',
      healthScore: Math.max(0, 100 - (Number(a.maxProbability) || 0)),
      riskLevel: a.riskLevel || 'low',
    }));

    return {
      activePredictions,
      criticalAlerts,
      highRiskAlerts,
      mediumRiskAlerts,
      lowRiskAlerts,
      anomaliesLast24h,
      failuresPrevented,
      potentialSavings: Number(savingsResult?.total) || 0,
      modelAccuracy,
      assetsMonitored: parseInt(assetsMonitored?.count) || 0,
      predictionsByType,
      recentPredictions,
      assetHealthScores,
    };
  }

  /**
   * Acknowledge a prediction
   */
  async acknowledgePrediction(
    predictionId: string,
    organizationId: string,
    userId: string,
    dto: AcknowledgePredictionDto
  ): Promise<AssetPrediction> {
    const prediction = await this.assetPredictionRepository.findOne({
      where: { id: predictionId, organizationId },
    });

    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${predictionId} not found`);
    }

    prediction.status = dto.status || PredictionStatus.ACKNOWLEDGED;
    prediction.acknowledgedAt = new Date();
    prediction.acknowledgedById = userId;

    if (dto.notes) {
      prediction.resolutionNotes = dto.notes;
    }

    return this.assetPredictionRepository.save(prediction);
  }

  /**
   * Resolve a prediction
   */
  async resolvePrediction(
    predictionId: string,
    organizationId: string,
    dto: ResolvePredictionDto
  ): Promise<AssetPrediction> {
    const prediction = await this.assetPredictionRepository.findOne({
      where: { id: predictionId, organizationId },
    });

    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${predictionId} not found`);
    }

    prediction.status = PredictionStatus.RESOLVED;
    prediction.resolvedAt = new Date();

    if (dto.resolutionNotes) {
      prediction.resolutionNotes = dto.resolutionNotes;
    }

    if (dto.wasAccurate !== undefined) {
      prediction.wasAccurate = dto.wasAccurate;
    }

    if (dto.actualFailureDate) {
      prediction.actualFailureDate = dto.actualFailureDate;
    }

    return this.assetPredictionRepository.save(prediction);
  }

  // ==================== SCHEDULED JOBS ====================

  /**
   * Daily job to run predictions on all monitored assets
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyPredictions(): Promise<void> {
    this.logger.log('Starting daily predictive maintenance analysis...');

    try {
      // Get all organizations with active prediction models
      const models = await this.predictionModelRepository.find({
        where: { status: PredictionModelStatus.ACTIVE },
      });

      const organizationIds = [...new Set(models.map(m => m.organizationId))];

      for (const organizationId of organizationIds) {
        await this.runOrganizationPredictions(organizationId);
      }

      this.logger.log('Daily predictive maintenance analysis completed');
    } catch (error) {
      this.logger.error('Error running daily predictions', error);
    }
  }

  private async runOrganizationPredictions(organizationId: string): Promise<void> {
    // Get assets with recent sensor data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const assetsWithData = await this.sensorDataRepository
      .createQueryBuilder('sd')
      .select('DISTINCT sd.assetId', 'assetId')
      .where('sd.organizationId = :organizationId', { organizationId })
      .andWhere('sd.timestamp >= :yesterday', { yesterday })
      .getRawMany();

    for (const { assetId } of assetsWithData) {
      try {
        // Run failure prediction
        await this.predictFailure(assetId, organizationId);

        // Run remaining life calculation
        await this.calculateRemainingLife(assetId, organizationId);
      } catch (error) {
        this.logger.error(`Error running predictions for asset ${assetId}`, error);
      }
    }
  }

  /**
   * Get prediction models for an organization
   */
  async getModels(organizationId: string): Promise<PredictionModel[]> {
    return this.predictionModelRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get sensor data for an asset
   */
  async getSensorData(
    assetId: string,
    organizationId: string,
    options: {
      sensorType?: SensorType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<SensorData[]> {
    const query = this.sensorDataRepository
      .createQueryBuilder('sd')
      .where('sd.assetId = :assetId', { assetId })
      .andWhere('sd.organizationId = :organizationId', { organizationId });

    if (options.sensorType) {
      query.andWhere('sd.sensorType = :sensorType', { sensorType: options.sensorType });
    }

    if (options.startDate) {
      query.andWhere('sd.timestamp >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      query.andWhere('sd.timestamp <= :endDate', { endDate: options.endDate });
    }

    query.orderBy('sd.timestamp', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }

    return query.getMany();
  }
}
