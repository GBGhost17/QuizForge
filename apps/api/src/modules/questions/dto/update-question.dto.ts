import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';
import { CreateQuestionOptionDto } from './create-question.dto';
import type { QuestionRubric } from '@quizforge/shared-types';

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    example: 'Thủ đô của Việt Nam là gì (cập nhật)?',
    description: 'Nội dung câu hỏi cập nhật',
  })
  @IsOptional()
  @IsString({ message: 'Nội dung câu hỏi phải là chuỗi ký tự' })
  prompt?: string;

  @ApiPropertyOptional({
    enum: QuestionType,
    example: QuestionType.SINGLE_CHOICE,
    description: 'Loại câu hỏi',
  })
  @IsOptional()
  @IsEnum(QuestionType, { message: 'Loại câu hỏi không hợp lệ' })
  type?: QuestionType;

  @ApiPropertyOptional({
    enum: Difficulty,
    example: Difficulty.HARD,
    description: 'Mức độ khó',
  })
  @IsOptional()
  @IsEnum(Difficulty, { message: 'Độ khó không hợp lệ' })
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    example: 2.0,
    description: 'Điểm mặc định cho câu hỏi',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm câu hỏi phải là số' })
  @Min(0.1, { message: 'Điểm tối thiểu là 0.1' })
  defaultPoints?: number;

  @ApiPropertyOptional({
    example: 'Địa lý Việt Nam',
    description: 'Chủ đề',
  })
  @IsOptional()
  @IsString({ message: 'Chủ đề phải là chuỗi ký tự' })
  topic?: string;

  @ApiPropertyOptional({
    example: ['dia-ly', 'cap-nhat'],
    description: 'Danh sách thẻ phân loại',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'Giải thích chi tiết cập nhật',
    description: 'Giải thích đáp án',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Rubric chấm điểm cập nhật',
  })
  @IsOptional()
  rubric?: QuestionRubric;

  @ApiPropertyOptional({
    example: false,
    description: 'Trạng thái lưu trữ (archive)',
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({
    type: [CreateQuestionOptionDto],
    description: 'Danh sách lựa chọn đáp án cập nhật',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}
