import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class SaveAnswerItemDto {
  @ApiProperty({ description: 'ID snapshot của câu hỏi' })
  @IsUUID('4', { message: 'ID câu hỏi không hợp lệ' })
  snapshotId!: string;

  @ApiPropertyOptional({ description: 'Danh sách ID phương án đã chọn', type: [String] })
  @IsOptional()
  @IsArray({ message: 'Danh sách phương án phải là một mảng' })
  @IsString({ each: true, message: 'ID phương án phải là chuỗi ký tự' })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({ description: 'Câu trả lời tự luận hoặc điền ngắn' })
  @IsOptional()
  @IsString({ message: 'Câu trả lời phải là chuỗi ký tự' })
  @MaxLength(10000, { message: 'Câu trả lời không được vượt quá 10,000 ký tự' })
  textAnswer?: string;
}

export class SaveAnswersBatchDto {
  @ApiProperty({ description: 'Danh sách câu trả lời cần lưu', type: [SaveAnswerItemDto] })
  @IsArray({ message: 'Danh sách câu trả lời phải là một mảng' })
  @ArrayMinSize(1, { message: 'Cần ít nhất một câu trả lời để lưu' })
  @ValidateNested({ each: true })
  @Type(() => SaveAnswerItemDto)
  answers!: SaveAnswerItemDto[];
}
