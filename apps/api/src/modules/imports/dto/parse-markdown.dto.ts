import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseMarkdownDto {
  @ApiProperty({ description: 'Nội dung tệp Markdown cần phân tích cú pháp' })
  @IsString({ message: 'Nội dung Markdown phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung Markdown không được để trống' })
  @MaxLength(2 * 1024 * 1024, { message: 'Kích thước Markdown vượt quá giới hạn cho phép (2MB)' })
  content!: string;
}
