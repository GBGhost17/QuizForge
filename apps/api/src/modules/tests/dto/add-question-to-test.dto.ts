import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AddQuestionToTestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID của câu hỏi gốc trong ngân hàng câu hỏi',
  })
  @IsUUID('4', { message: 'ID câu hỏi phải là định dạng UUID' })
  @IsNotEmpty({ message: 'ID câu hỏi không được để trống' })
  questionId!: string;

  @ApiPropertyOptional({
    example: 1.0,
    default: 1.0,
    description: 'Điểm số của câu hỏi trong đề thi này',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm số phải là số' })
  @Min(0.1, { message: 'Điểm số tối thiểu là 0.1' })
  @Max(100, { message: 'Điểm số tối đa là 100' })
  points?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự xuất hiện của câu hỏi trong đề thi (bắt đầu từ 1)',
  })
  @IsOptional()
  @IsInt({ message: 'Thứ tự phải là số nguyên' })
  @Min(1, { message: 'Thứ tự tối thiểu là 1' })
  order?: number;
}
