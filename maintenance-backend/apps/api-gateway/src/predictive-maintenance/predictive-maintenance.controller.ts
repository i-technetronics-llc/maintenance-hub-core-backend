import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PredictiveMaintenanceService } from './predictive-maintenance.service';
import {
  CreateSensorDataDto,
  BulkSensorDataDto,
  CreatePredictionModelDto,
  TrainModelDto,
  AcknowledgePredictionDto,
  ResolvePredictionDto,
  CreateWorkOrderFromPredictionDto,
} from './dto';
import { CurrentUser, Public } from '@app/common/decorators';
import { PredictionStatus, PredictionType, RiskLevel } from '@app/database/entities/asset-prediction.entity';
import { SensorType } from '@app/database/entities/sensor-data.entity';

@ApiTags('Predictive Maintenance')
@ApiBearerAuth()
@Controller('api/v1/predictive')
export class PredictiveMaintenanceController {
  constructor(
    private readonly predictiveMaintenanceService: PredictiveMaintenanceService,
  ) {}

  // ==================== SENSOR DATA ENDPOINTS ====================

  @Post('sensor-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest sensor data with real-time anomaly detection' })
  @ApiResponse({ status: 201, description: 'Sensor data ingested successfully' })
  async ingestSensorData(
    @Body() dto: CreateSensorDataDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.ingestSensorData(dto, user.organizationId);
  }

  @Post('sensor-data/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk ingest sensor data' })
  @ApiResponse({ status: 201, description: 'Sensor data batch processed' })
  async bulkIngestSensorData(
    @Body() dto: BulkSensorDataDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.bulkIngestSensorData(dto, user.organizationId);
  }

  @Get('sensor-data/:assetId')
  @ApiOperation({ summary: 'Get sensor data for an asset' })
  @ApiQuery({ name: 'sensorType', enum: SensorType, required: false })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sensor data retrieved successfully' })
  async getSensorData(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('sensorType') sensorType?: SensorType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.predictiveMaintenanceService.getSensorData(assetId, user.organizationId, {
      sensorType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });
  }

  // ==================== PREDICTION ENDPOINTS ====================

  @Get('predictions/:assetId')
  @ApiOperation({ summary: 'Get predictions for an asset' })
  @ApiQuery({ name: 'status', enum: PredictionStatus, required: false })
  @ApiQuery({ name: 'type', enum: PredictionType, required: false })
  @ApiQuery({ name: 'riskLevel', enum: RiskLevel, required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  async getPredictions(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('status') status?: PredictionStatus,
    @Query('type') type?: PredictionType,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.predictiveMaintenanceService.getPredictions(assetId, user.organizationId, {
      status,
      type,
      riskLevel,
      limit,
    });
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get all detected anomalies' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'assetId', required: false, type: String })
  @ApiQuery({ name: 'riskLevel', enum: RiskLevel, required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Anomalies retrieved successfully' })
  async getAnomalies(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assetId') assetId?: string,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.predictiveMaintenanceService.getAnomalies(user.organizationId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      assetId,
      riskLevel,
      limit,
    });
  }

  // ==================== ANALYSIS ENDPOINTS ====================

  @Post('analyze/:assetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger analysis for an asset' })
  @ApiResponse({ status: 200, description: 'Analysis completed' })
  async triggerAnalysis(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.analyzeSensorData(assetId, user.organizationId);
  }

  @Post('predict-failure/:assetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Predict failure probability for an asset' })
  @ApiResponse({ status: 200, description: 'Failure prediction completed' })
  async predictFailure(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.predictFailure(assetId, user.organizationId);
  }

  @Post('remaining-life/:assetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate remaining useful life for an asset' })
  @ApiResponse({ status: 200, description: 'Remaining life calculated' })
  async calculateRemainingLife(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.calculateRemainingLife(assetId, user.organizationId);
  }

  // ==================== DASHBOARD ENDPOINT ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get predictive analytics dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@CurrentUser() user: any) {
    return this.predictiveMaintenanceService.getDashboardSummary(user.organizationId);
  }

  // ==================== PREDICTION MANAGEMENT ENDPOINTS ====================

  @Post('acknowledge/:predictionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge a prediction' })
  @ApiResponse({ status: 200, description: 'Prediction acknowledged' })
  async acknowledgePrediction(
    @Param('predictionId', ParseUUIDPipe) predictionId: string,
    @Body() dto: AcknowledgePredictionDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.acknowledgePrediction(
      predictionId,
      user.organizationId,
      user.id,
      dto,
    );
  }

  @Post('resolve/:predictionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a prediction' })
  @ApiResponse({ status: 200, description: 'Prediction resolved' })
  async resolvePrediction(
    @Param('predictionId', ParseUUIDPipe) predictionId: string,
    @Body() dto: ResolvePredictionDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.resolvePrediction(
      predictionId,
      user.organizationId,
      dto,
    );
  }

  @Post('dismiss/:predictionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a prediction as false positive' })
  @ApiResponse({ status: 200, description: 'Prediction dismissed' })
  async dismissPrediction(
    @Param('predictionId', ParseUUIDPipe) predictionId: string,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.acknowledgePrediction(
      predictionId,
      user.organizationId,
      user.id,
      { status: PredictionStatus.FALSE_POSITIVE },
    );
  }

  // ==================== WORK ORDER GENERATION ====================

  @Post('generate-work-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a work order from a prediction' })
  @ApiResponse({ status: 201, description: 'Work order created' })
  async generateWorkOrder(
    @Body() dto: CreateWorkOrderFromPredictionDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.generatePredictiveWorkOrder(
      dto,
      user.organizationId,
      user.id,
    );
  }

  // ==================== MODEL MANAGEMENT ENDPOINTS ====================

  @Get('models')
  @ApiOperation({ summary: 'Get prediction models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels(@CurrentUser() user: any) {
    return this.predictiveMaintenanceService.getModels(user.organizationId);
  }

  @Post('models')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new prediction model' })
  @ApiResponse({ status: 201, description: 'Model created successfully' })
  async createModel(
    @Body() dto: CreatePredictionModelDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.createModel(dto, user.organizationId);
  }

  @Post('models/:modelId/train')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Train or retrain a prediction model' })
  @ApiResponse({ status: 200, description: 'Model training completed' })
  async trainModel(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Body() dto: TrainModelDto,
    @CurrentUser() user: any,
  ) {
    return this.predictiveMaintenanceService.trainModel(modelId, user.organizationId, dto);
  }
}
