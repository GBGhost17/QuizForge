import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { QuestionType } from '@quizforge/shared-types';

export class DuplicateCheckItemOptionDto {
  @ApiProperty({ description: 'Nội dung lựa chọn' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({ description: 'Lựa chọn có phải là đáp án đúng' })
  @IsOptional()
  isCorrect?: boolean;
}

export class DuplicateCheckItemDto {
  @ApiProperty({ description: 'Nội dung câu hỏi cần kiểm tra' })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  prompt!: string;

  @ApiPropertyOptional({
    description: 'Loại câu hỏi',
    enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'],
  })
  @IsOptional()
  @IsEnum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'])
  type?: QuestionType;

  @ApiPropertyOptional({
    description: 'Danh sách lựa chọn',
    type: [DuplicateCheckItemOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DuplicateCheckItemOptionDto)
  options?: DuplicateCheckItemOptionDto[];
}

export class CheckDuplicatesDto {
  @ApiProperty({
    description: 'Danh sách câu hỏi cần kiểm tra độ trùng lặp',
    type: [DuplicateCheckItemDto],
  })
  @IsArray({ message: 'Danh sách câu hỏi cần là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => DuplicateCheckItemDto)
  questions!: DuplicateCheckItemDto[];

  @ApiPropertyOptional({
    description: 'Ngưỡng tương đồng tối thiểu (0.1 đến 1.0, mặc định 0.8 tức 80%)',
    default: 0.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  threshold?: number;
}
