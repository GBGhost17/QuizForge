import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TestMode, TestStatus } from '@prisma/client';

export class TestQueryDto {
  @ApiPropertyOptional({
    example: 'Toán 12',
    description: 'Từ khóa tìm kiếm theo tiêu đề hoặc mô tả',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  q?: string;

  @ApiPropertyOptional({
    enum: TestStatus,
    description: 'Lọc theo trạng thái đề thi',
  })
  @IsOptional()
  @IsEnum(TestStatus, { message: 'Trạng thái đề thi không hợp lệ' })
  status?: TestStatus;

  @ApiPropertyOptional({
    enum: TestMode,
    description: 'Lọc theo chế độ thi',
  })
  @IsOptional()
  @IsEnum(TestMode, { message: 'Chế độ thi không hợp lệ' })
  mode?: TestMode;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1))
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page tối thiểu là 1' })
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng bản ghi trên mỗi trang (tối đa 100)',
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 10))
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit: number = 10;
}
