import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2Vu',
    description: 'Refresh token nhận được từ lần đăng nhập trước',
  })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken!: string;
}
