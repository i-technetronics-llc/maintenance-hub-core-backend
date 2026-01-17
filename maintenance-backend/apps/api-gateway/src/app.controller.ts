import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getRoot() {
    return {
      message: 'Maintenance Automation Platform API',
      version: this.configService.get('API_VERSION', '1'),
      environment: this.configService.get('NODE_ENV'),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
