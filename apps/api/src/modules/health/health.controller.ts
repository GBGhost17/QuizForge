import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export interface HealthBody {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  /** Liveness: no dependencies, never touches the database. */
  @Get()
  @ApiOkResponse({ description: 'The API process is running.' })
  liveness(): HealthBody {
    return {
      status: 'ok',
      service: 'quizforge-api',
      version: process.env['npm_package_version'] ?? '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
