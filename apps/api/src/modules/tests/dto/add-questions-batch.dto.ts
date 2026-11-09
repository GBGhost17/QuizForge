import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AddQuestionsBatchDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    description: 'Danh sách ID các câu hỏi cần thêm vào đề thi',
  })
  @IsArray({ message: 'Danh sách ID câu hỏi phải là mảng' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 câu hỏi' })
  @ArrayMaxSize(200, { message: 'Không thể thêm quá 200 câu hỏi mỗi lần' })
  @IsUUID('4', { each: true, message: 'Mỗi ID câu hỏi phải là định dạng UUID' })
  questionIds!: string[];

  @ApiPropertyOptional({
    example: 1.0,
    default: 1.0,
    description: 'Điểm số mặc định áp dụng cho tất cả các câu hỏi được thêm',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm số phải là số' })
  @Min(0.1, { message: 'Điểm số tối thiểu là 0.1' })
  @Max(100, { message: 'Điểm số tối đa là 100' })
  defaultPoints?: number;
}
