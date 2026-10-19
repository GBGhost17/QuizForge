import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class ReadyController {
  constructor(private readonly prisma: PrismaService) {}

  /** Readiness: verifies the database is reachable. Error details are not leaked to clients. */
  @Get('ready')
  @ApiOkResponse({ description: 'The API can reach its database.' })
  @ApiServiceUnavailableResponse({ description: 'The database is unreachable.' })
  async readiness(): Promise<{ status: 'ready' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
