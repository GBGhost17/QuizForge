import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';

export class QuestionQueryDto {
  @ApiPropertyOptional({
    example: 'Hà Nội',
    description: 'Từ khóa tìm kiếm trong prompt',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: QuestionType,
    example: QuestionType.SINGLE_CHOICE,
    description: 'Lọc theo loại câu hỏi',
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({
    enum: Difficulty,
    example: Difficulty.MEDIUM,
    description: 'Lọc theo độ khó',
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    example: 'Địa lý',
    description: 'Lọc theo chủ đề',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Lọc theo trạng thái lưu trữ (archive)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số thứ tự trang',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số lượng câu hỏi trên trang',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
