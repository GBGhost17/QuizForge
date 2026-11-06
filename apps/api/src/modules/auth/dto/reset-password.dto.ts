import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Mã xác thực token đặt lại mật khẩu nhận được qua email',
  })
  @IsString({ message: 'Token phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Token không được để trống' })
  token!: string;

  @ApiProperty({
    example: 'NewSecurePass99',
    description: 'Mật khẩu mới (tối thiểu 8 ký tự, chứa ít nhất 1 chữ in hoa và 1 chữ số)',
  })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu mới phải chứa ít nhất một chữ cái in hoa' })
  @Matches(/[0-9]/, { message: 'Mật khẩu mới phải chứa ít nhất một chữ số' })
  newPassword!: string;
}
