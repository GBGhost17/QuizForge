import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ResultReleaseMode } from '@prisma/client';

export class PublishTestDto {
  @ApiPropertyOptional({
    example: 60,
    description: 'Thời gian làm bài tính bằng phút (ghi đè cấu hình trước khi xuất bản nếu có)',
  })
  @IsOptional()
  @IsInt({ message: 'Thời gian làm bài phải là số nguyên' })
  @Min(1, { message: 'Thời gian làm bài tối thiểu là 1 phút' })
  @Max(1440, { message: 'Thời gian làm bài tối đa là 1440 phút' })
  timeLimitMinutes?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số lần làm bài tối đa',
  })
  @IsOptional()
  @IsInt({ message: 'Số lần làm bài phải là số nguyên' })
  @Min(1, { message: 'Số lần làm bài tối thiểu là 1' })
  @Max(100, { message: 'Số lần làm bài tối đa là 100' })
  maxAttempts?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Xáo trộn thứ tự câu hỏi khi làm bài',
  })
  @IsOptional()
  @IsBoolean({ message: 'shuffleQuestions phải là giá trị boolean' })
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Xáo trộn các lựa chọn câu hỏi trắc nghiệm',
  })
  @IsOptional()
  @IsBoolean({ message: 'shuffleOptions phải là giá trị boolean' })
  shuffleOptions?: boolean;

  @ApiPropertyOptional({
    enum: ResultReleaseMode,
    description: 'Thời điểm công bố kết quả',
  })
  @IsOptional()
  @IsEnum(ResultReleaseMode, { message: 'Chế độ công bố kết quả không hợp lệ' })
  releaseMode?: ResultReleaseMode;

  @ApiPropertyOptional({
    example: 5.0,
    description: 'Điểm đạt yêu cầu',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm đạt phải là số' })
  @Min(0, { message: 'Điểm đạt tối thiểu là 0' })
  passScore?: number;

  @ApiPropertyOptional({
    example: '2026-11-15T08:00:00.000Z',
    description: 'Thời gian bắt đầu cho phép tham gia phòng thi',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Thời gian bắt đầu phải là định dạng ISO 8601' })
  startsAt?: string;

  @ApiPropertyOptional({
    example: '2026-11-15T10:00:00.000Z',
    description: 'Thời gian kết thúc phòng thi',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Thời gian kết thúc phải là định dạng ISO 8601' })
  endsAt?: string;
}
