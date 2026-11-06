import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQuestionBankDto {
  @ApiPropertyOptional({
    example: 'Toán học 12 Nâng cao',
    description: 'Tiêu đề ngân hàng câu hỏi mới',
  })
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Mô tả cập nhật',
    description: 'Mô tả ngân hàng câu hỏi mới',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Mô tả không được vượt quá 2000 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Trạng thái lưu trữ (archive)',
  })
  @IsOptional()
  @IsBoolean({ message: 'isArchived phải là giá trị boolean' })
  isArchived?: boolean;
}
