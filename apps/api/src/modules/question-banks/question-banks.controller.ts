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
import { QuestionBanksService } from './question-banks.service';
import { CreateQuestionBankDto, QuestionBankQueryDto, UpdateQuestionBankDto } from './dto';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import type { PaginatedResult, QuestionBank } from '@quizforge/shared-types';

@ApiTags('question-banks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('question-banks')
export class QuestionBanksController {
  constructor(private readonly questionBanksService: QuestionBanksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo ngân hàng câu hỏi mới' })
  @ApiCreatedResponse({ description: 'Ngân hàng câu hỏi được tạo thành công' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuestionBankDto,
  ): Promise<QuestionBank> {
    return this.questionBanksService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách ngân hàng câu hỏi có phân trang và tìm kiếm' })
  @ApiOkResponse({ description: 'Danh sách ngân hàng câu hỏi' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QuestionBankQueryDto,
  ): Promise<PaginatedResult<QuestionBank>> {
    return this.questionBanksService.findAll(userId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một ngân hàng câu hỏi' })
  @ApiOkResponse({ description: 'Thông tin chi tiết ngân hàng câu hỏi' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ngân hàng câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<QuestionBank> {
    return this.questionBanksService.findOne(userId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật ngân hàng câu hỏi' })
  @ApiOkResponse({ description: 'Cập nhật thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ngân hàng câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionBankDto,
  ): Promise<QuestionBank> {
    return this.questionBanksService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa hoặc lưu trữ ngân hàng câu hỏi' })
  @ApiOkResponse({ description: 'Xóa hoặc lưu trữ thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ngân hàng câu hỏi' })
  @ApiForbiddenResponse({ description: 'Không có quyền xóa' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ message: string; isArchived: boolean }> {
    return this.questionBanksService.delete(userId, id);
  }
}
