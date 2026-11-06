import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, QuestionQueryDto, UpdateQuestionDto } from './dto';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import type { PaginatedResult, Question } from '@quizforge/shared-types';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('question-banks/:bankId/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo câu hỏi mới trong ngân hàng câu hỏi' })
  @ApiCreatedResponse({ description: 'Câu hỏi được tạo thành công' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ngân hàng câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập ngân hàng câu hỏi' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('bankId') bankId: string,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.create(userId, bankId, dto);
  }

  @Get('question-banks/:bankId/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi trong ngân hàng câu hỏi có phân trang và lọc' })
  @ApiOkResponse({ description: 'Danh sách câu hỏi' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ngân hàng câu hỏi' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Param('bankId') bankId: string,
    @Query() query: QuestionQueryDto,
  ): Promise<PaginatedResult<Question>> {
    return this.questionsService.findAll(userId, bankId, query);
  }

  @Get('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết một câu hỏi' })
  @ApiOkResponse({ description: 'Chi tiết câu hỏi' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<Question> {
    return this.questionsService.findOne(userId, id);
  }

  @Patch('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật nội dung hoặc đáp án của câu hỏi' })
  @ApiOkResponse({ description: 'Cập nhật thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.update(userId, id, dto);
  }

  @Delete('questions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa hoặc lưu trữ câu hỏi' })
  @ApiOkResponse({ description: 'Xóa hoặc lưu trữ thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền xóa' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string; isArchived: boolean }> {
    return this.questionsService.delete(userId, id);
  }
}
