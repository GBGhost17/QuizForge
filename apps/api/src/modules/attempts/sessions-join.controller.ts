import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import type { AttemptDetail, SessionPreview } from '@quizforge/shared-types';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsJoinController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get('join/:code')
  @ApiOperation({ summary: 'Xem trước thông tin phòng thi với mã phòng' })
  @ApiOkResponse({ description: 'Thông tin phòng thi' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async getJoinSessionPreview(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<SessionPreview> {
    return this.attemptsService.getJoinSessionPreview(userId, code);
  }

  @Post('join/:code/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bắt đầu làm bài hoặc tiếp tục bài thi đang dở dang' })
  @ApiOkResponse({ description: 'Bắt đầu bài thi thành công' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async startOrResumeAttempt(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<AttemptDetail> {
    return this.attemptsService.startOrResumeAttempt(userId, code);
  }
}
