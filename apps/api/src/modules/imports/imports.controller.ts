import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportsService } from './imports.service';
import { CommitMarkdownDto, ParseMarkdownDto } from './dto';
import type { MarkdownImportResult, UserProfile } from '@quizforge/shared-types';

@ApiTags('Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('imports/markdown')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Phân tích cú pháp tệp Markdown và trả về bản xem trước cùng chẩn đoán lỗi',
  })
  @ApiResponse({ status: 200, description: 'Phân tích thành công' })
  async parseMarkdown(@Body() dto: ParseMarkdownDto): Promise<MarkdownImportResult> {
    return this.importsService.parseMarkdown(dto);
  }

  @Post('commit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Lưu các câu hỏi hợp lệ vào ngân hàng câu hỏi đích (giao dịch nguyên tử)',
  })
  @ApiResponse({ status: 201, description: 'Nhập câu hỏi thành công' })
  async commitQuestions(
    @CurrentUser() user: UserProfile,
    @Body() dto: CommitMarkdownDto,
  ): Promise<{ count: number; bankId: string; message: string }> {
    return this.importsService.commitQuestions(user.id, dto);
  }
}
