import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from './guards';
import type { AuthResponse, UserProfile } from '@quizforge/shared-types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng mới' })
  @ApiCreatedResponse({ description: 'Đăng ký thành công, trả về Access Token và Refresh Token' })
  @ApiConflictResponse({ description: 'Email đã tồn tại trong hệ thống' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống bằng Email và Mật khẩu' })
  @ApiOkResponse({ description: 'Đăng nhập thành công, trả về Access Token và Refresh Token' })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không chính xác' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới Access Token thông qua Refresh Token (Token Rotation)' })
  @ApiOkResponse({ description: 'Làm mới token thành công' })
  @ApiUnauthorizedResponse({ description: 'Refresh token không hợp lệ hoặc đã bị thu hồi' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và thu hồi Refresh Token' })
  @ApiOkResponse({ description: 'Đăng xuất thành công' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto?: Partial<RefreshTokenDto>,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, dto?.refreshToken);
    return { message: 'Đăng xuất thành công' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu mã đặt lại mật khẩu' })
  @ApiOkResponse({ description: 'Gửi yêu cầu đặt lại mật khẩu thành công' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới thông qua Token xác thực' })
  @ApiOkResponse({ description: 'Mật khẩu đã được cập nhật thành công' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin tài khoản người dùng đang đăng nhập' })
  @ApiOkResponse({ description: 'Thông tin tài khoản hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực hoặc token không hợp lệ' })
  async getMe(@CurrentUser() user: UserProfile): Promise<UserProfile> {
    return user;
  }
}
