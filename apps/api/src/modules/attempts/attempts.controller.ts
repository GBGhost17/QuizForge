import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { SaveAnswersBatchDto } from './dto';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import type {
  AttemptDetail,
  AttemptSummary,
  SaveAnswersResponse,
  SubmitAttemptResponse,
} from '@quizforge/shared-types';

@ApiTags('attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch sử bài làm của thí sinh' })
  @ApiOkResponse({ description: 'Danh sách bài làm' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async getUserAttempts(@CurrentUser('id') userId: string): Promise<AttemptSummary[]> {
    return this.attemptsService.getUserAttempts(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bài làm (dữ liệu đã khử trùng đáp án)' })
  @ApiOkResponse({ description: 'Chi tiết bài làm' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async getAttemptDetail(
    @CurrentUser('id') userId: string,
    @Param('id') attemptId: string,
  ): Promise<AttemptDetail> {
    return this.attemptsService.getAttemptDetail(userId, attemptId);
  }

  @Patch(':id/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tự động lưu câu trả lời bài làm (Autosave Answers)' })
  @ApiOkResponse({ description: 'Lưu câu trả lời thành công' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async saveAnswers(
    @CurrentUser('id') userId: string,
    @Param('id') attemptId: string,
    @Body() dto: SaveAnswersBatchDto,
  ): Promise<SaveAnswersResponse> {
    return this.attemptsService.saveAnswers(userId, attemptId, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nộp bài thi (Atomic Submit-Once)' })
  @ApiOkResponse({ description: 'Nộp bài thành công' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async submitAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') attemptId: string,
  ): Promise<SubmitAttemptResponse> {
    return this.attemptsService.submitAttempt(userId, attemptId);
  }
}
