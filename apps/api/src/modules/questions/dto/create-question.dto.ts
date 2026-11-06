import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Difficulty, QuestionType } from '@prisma/client';
import type { QuestionRubric } from '@quizforge/shared-types';

export class CreateQuestionOptionDto {
  @ApiPropertyOptional({ example: 'opt-1', description: 'ID tùy chọn của đáp án' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Hà Nội', description: 'Nội dung lựa chọn' })
  @IsString({ message: 'Nội dung lựa chọn phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung lựa chọn không được để trống' })
  text!: string;

  @ApiProperty({ example: true, description: 'Đánh dấu đáp án đúng hay sai' })
  @IsBoolean({ message: 'isCorrect phải là giá trị boolean' })
  isCorrect!: boolean;

  @ApiPropertyOptional({
    example: 'Giải thích chi tiết cho đáp án',
    description: 'Giải thích đáp án',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 0, description: 'Thứ tự hiển thị' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateQuestionDto {
  @ApiProperty({
    example: 'Thủ đô của Việt Nam là gì?',
    description: 'Nội dung câu hỏi (hỗ trợ định dạng Markdown an toàn)',
  })
  @IsString({ message: 'Nội dung câu hỏi phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  prompt!: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.SINGLE_CHOICE,
    description: 'Loại câu hỏi: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY',
  })
  @IsEnum(QuestionType, { message: 'Loại câu hỏi không hợp lệ' })
  type!: QuestionType;

  @ApiPropertyOptional({
    enum: Difficulty,
    example: Difficulty.MEDIUM,
    description: 'Mức độ khó: EASY, MEDIUM, HARD',
    default: Difficulty.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Difficulty, { message: 'Độ khó không hợp lệ' })
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    example: 1.0,
    description: 'Điểm mặc định cho câu hỏi',
    default: 1.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm câu hỏi phải là số' })
  @Min(0.1, { message: 'Điểm tối thiểu là 0.1' })
  defaultPoints?: number;

  @ApiPropertyOptional({
    example: 'Địa lý',
    description: 'Chủ đề của câu hỏi',
  })
  @IsOptional()
  @IsString({ message: 'Chủ đề phải là chuỗi ký tự' })
  topic?: string;

  @ApiPropertyOptional({
    example: ['dia-ly', 'viet-nam'],
    description: 'Danh sách thẻ phân loại',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'Hà Nội là thủ đô của Việt Nam từ năm 1976.',
    description: 'Giải thích đáp án chi tiết',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Rubric chấm điểm hoặc đáp án chấp nhận (dành cho ESSAY hoặc SHORT_ANSWER)',
  })
  @IsOptional()
  rubric?: QuestionRubric;

  @ApiPropertyOptional({
    type: [CreateQuestionOptionDto],
    description: 'Danh sách các lựa chọn đáp án',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}
