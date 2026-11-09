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
import { TestsService } from './tests.service';
import {
  AddQuestionsBatchDto,
  AddQuestionToTestDto,
  CreateTestDto,
  PublishTestDto,
  ReorderQuestionsDto,
  TestQueryDto,
  UpdateTestDto,
} from './dto';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import type { PaginatedResult, Test, TestQuestionSnapshot } from '@quizforge/shared-types';

@ApiTags('tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo đề thi mới (trạng thái DRAFT)' })
  @ApiCreatedResponse({ description: 'Đề thi được tạo thành công' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTestDto): Promise<Test> {
    return this.testsService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách đề thi của người dùng có phân trang và bộ lọc' })
  @ApiOkResponse({ description: 'Danh sách đề thi' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: TestQueryDto,
  ): Promise<PaginatedResult<Test>> {
    return this.testsService.findAll(userId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết một đề thi theo ID' })
  @ApiOkResponse({ description: 'Chi tiết đề thi và danh sách câu hỏi snapshot' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đề thi' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập đề thi này' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') testId: string): Promise<Test> {
    return this.testsService.findOne(userId, testId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin hoặc cấu hình đề thi nháp' })
  @ApiOkResponse({ description: 'Cập nhật đề thi thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đề thi' })
  @ApiForbiddenResponse({ description: 'Không có quyền chỉnh sửa' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
    @Body() dto: UpdateTestDto,
  ): Promise<Test> {
    return this.testsService.update(userId, testId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa đề thi' })
  @ApiOkResponse({ description: 'Xóa đề thi thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đề thi' })
  @ApiForbiddenResponse({ description: 'Không có quyền xóa' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.testsService.remove(userId, testId);
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm một câu hỏi từ ngân hàng vào đề thi nháp' })
  @ApiCreatedResponse({ description: 'Thêm câu hỏi thành công' })
  async addQuestion(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
    @Body() dto: AddQuestionToTestDto,
  ): Promise<TestQuestionSnapshot> {
    return this.testsService.addQuestion(userId, testId, dto);
  }

  @Post(':id/questions/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm nhiều câu hỏi từ ngân hàng vào đề thi nháp' })
  @ApiCreatedResponse({ description: 'Thêm hàng loạt câu hỏi thành công' })
  async addQuestionsBatch(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
    @Body() dto: AddQuestionsBatchDto,
  ): Promise<{ addedCount: number; test: Test }> {
    return this.testsService.addQuestionsBatch(userId, testId, dto);
  }

  @Delete(':id/questions/:snapshotId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa một câu hỏi snapshot khỏi đề thi nháp' })
  @ApiOkResponse({ description: 'Xóa câu hỏi khỏi đề thi thành công' })
  async removeQuestion(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
    @Param('snapshotId') snapshotId: string,
  ): Promise<Test> {
    return this.testsService.removeQuestion(userId, testId, snapshotId);
  }

  @Patch(':id/questions/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sắp xếp lại thứ tự và điểm của các câu hỏi trong đề thi' })
  @ApiOkResponse({ description: 'Sắp xếp lại câu hỏi thành công' })
  async reorderQuestions(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
    @Body() dto: ReorderQuestionsDto,
  ): Promise<Test> {
    return this.testsService.reorderQuestions(userId, testId, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Xuất bản đề thi (Publish): Đóng băng snapshot, tạo TestSession và cấp mã tham gia joinCode',
  })
  @ApiOkResponse({ description: 'Xuất bản đề thi thành công' })
  async publish(
    @CurrentUser('id') userId: string,
    @Param('id') testId: string,
    @Body() dto: PublishTestDto,
  ): Promise<Test> {
    return this.testsService.publish(userId, testId, dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đóng bài kiểm tra: Chuyển trạng thái sang CLOSED và kết thúc các phòng thi (ENDED)',
  })
  @ApiOkResponse({ description: 'Đóng đề thi thành công' })
  async close(@CurrentUser('id') userId: string, @Param('id') testId: string): Promise<Test> {
    return this.testsService.close(userId, testId);
  }
}
