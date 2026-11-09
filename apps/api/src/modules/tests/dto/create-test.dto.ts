import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ResultReleaseMode, TestMode } from '@prisma/client';

export class CreateTestDto {
  @ApiProperty({
    example: 'Đề kiểm tra giữa kỳ 1 Toán 12',
    description: 'Tiêu đề đề thi',
  })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề đề thi không được để trống' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Đề kiểm tra trắc nghiệm 45 phút',
    description: 'Mô tả chi tiết về đề thi',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Mô tả không được vượt quá 2000 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    example: 'Học sinh không được sử dụng tài liệu ngoài máy tính cầm tay',
    description: 'Hướng dẫn làm bài cho thí sinh',
  })
  @IsOptional()
  @IsString({ message: 'Hướng dẫn phải là chuỗi ký tự' })
  @MaxLength(5000, { message: 'Hướng dẫn không được vượt quá 5000 ký tự' })
  instructions?: string;

  @ApiPropertyOptional({
    enum: TestMode,
    default: TestMode.ASSIGNMENT,
    description: 'Chế độ thi: ASSIGNMENT (bài tập), PRACTICE (luyện tập), hoặc LIVE (trực tiếp)',
  })
  @IsOptional()
  @IsEnum(TestMode, { message: 'Chế độ thi không hợp lệ (ASSIGNMENT, PRACTICE hoặc LIVE)' })
  mode?: TestMode;

  @ApiPropertyOptional({
    example: 45,
    description: 'Thời gian làm bài tính bằng phút (1 - 1440)',
  })
  @IsOptional()
  @IsInt({ message: 'Thời gian làm bài phải là số nguyên' })
  @Min(1, { message: 'Thời gian làm bài tối thiểu là 1 phút' })
  @Max(1440, { message: 'Thời gian làm bài tối đa là 1440 phút (24 giờ)' })
  timeLimitMinutes?: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Số lần làm bài tối đa cho phép (1 - 100)',
  })
  @IsOptional()
  @IsInt({ message: 'Số lần làm bài phải là số nguyên' })
  @Min(1, { message: 'Số lần làm bài tối thiểu là 1' })
  @Max(100, { message: 'Số lần làm bài tối đa là 100' })
  maxAttempts?: number;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Xáo trộn thứ tự câu hỏi khi làm bài',
  })
  @IsOptional()
  @IsBoolean({ message: 'shuffleQuestions phải là giá trị boolean' })
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Xáo trộn thứ tự các lựa chọn trong câu hỏi trắc nghiệm',
  })
  @IsOptional()
  @IsBoolean({ message: 'shuffleOptions phải là giá trị boolean' })
  shuffleOptions?: boolean;

  @ApiPropertyOptional({
    enum: ResultReleaseMode,
    default: ResultReleaseMode.ON_FINALIZATION,
    description: 'Thời điểm công bố kết quả và đáp án chi tiết',
  })
  @IsOptional()
  @IsEnum(ResultReleaseMode, { message: 'Chế độ công bố kết quả không hợp lệ' })
  releaseMode?: ResultReleaseMode;

  @ApiPropertyOptional({
    example: 5.0,
    description: 'Điểm số tối thiểu để vượt qua bài thi',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm đạt phải là số' })
  @Min(0, { message: 'Điểm đạt tối thiểu là 0' })
  passScore?: number;
}
