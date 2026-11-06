import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQuestionBankDto {
  @ApiProperty({
    example: 'Toán học 12',
    description: 'Tiêu đề ngân hàng câu hỏi',
  })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề ngân hàng câu hỏi không được để trống' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Tổng hợp câu hỏi ôn thi THPT Quốc gia môn Toán',
    description: 'Mô tả chi tiết về ngân hàng câu hỏi',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Mô tả không được vượt quá 2000 ký tự' })
  description?: string;
}
