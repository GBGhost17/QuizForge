import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderQuestionItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID của snapshot câu hỏi trong đề thi',
  })
  @IsUUID('4', { message: 'ID snapshot phải là định dạng UUID' })
  @IsNotEmpty({ message: 'ID snapshot không được để trống' })
  snapshotId!: string;

  @ApiProperty({
    example: 1,
    description: 'Thứ tự mới của câu hỏi trong đề thi',
  })
  @IsInt({ message: 'Thứ tự phải là số nguyên' })
  @Min(1, { message: 'Thứ tự tối thiểu là 1' })
  order!: number;

  @ApiPropertyOptional({
    example: 2.0,
    description: 'Điểm số mới của câu hỏi nếu muốn cập nhật',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm số phải là số' })
  @Min(0.1, { message: 'Điểm số tối thiểu là 0.1' })
  @Max(100, { message: 'Điểm số tối đa là 100' })
  points?: number;
}

export class ReorderQuestionsDto {
  @ApiProperty({
    type: [ReorderQuestionItemDto],
    description: 'Danh sách vị trí thứ tự và điểm của các câu hỏi',
  })
  @IsArray({ message: 'Danh sách phải là một mảng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 câu hỏi để sắp xếp' })
  @ValidateNested({ each: true })
  @Type(() => ReorderQuestionItemDto)
  items!: ReorderQuestionItemDto[];
}
