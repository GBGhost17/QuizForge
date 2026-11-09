import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { ParsedQuestion } from '@quizforge/shared-types';

export class CommitMarkdownDto {
  @ApiProperty({ description: 'Mã định danh ngân hàng câu hỏi đích' })
  @IsString({ message: 'Mã ngân hàng câu hỏi phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã ngân hàng câu hỏi không được để trống' })
  bankId!: string;

  @ApiProperty({ description: 'Danh sách các câu hỏi đã được kiểm tra và chuẩn hóa' })
  @IsArray({ message: 'Danh sách câu hỏi phải là một mảng' })
  @IsNotEmpty({ message: 'Danh sách câu hỏi không được để trống' })
  questions!: ParsedQuestion[];
}
