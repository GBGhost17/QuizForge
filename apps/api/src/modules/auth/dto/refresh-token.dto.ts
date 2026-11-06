import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    example: 'dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2Vu',
    description: 'Refresh token (tùy chọn nếu đã đính kèm qua HttpOnly Cookie)',
  })
  @IsOptional()
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  refreshToken?: string;
}
