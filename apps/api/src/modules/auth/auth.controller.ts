import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
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
import { GoogleAuthGuard, JwtAuthGuard } from './guards';
import type { AuthResponse, UserProfile } from '@quizforge/shared-types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Khởi tạo luồng xác thực Google OAuth 2.0' })
  async googleAuth(): Promise<void> {
    // Được xử lý tự động bởi GoogleAuthGuard
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Callback xử lý kết quả xác thực từ Google OAuth 2.0' })
  async googleAuthCallback(
    @Req() req: Request & { user?: AuthResponse },
    @Res() res: Response,
  ): Promise<void> {
    const authResponse = req.user;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    if (!authResponse) {
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      return;
    }

    // Set HttpOnly cookie - token không bao giờ lộ trên URL hay JavaScript client
    this.setRefreshTokenCookie(res, authResponse.refreshToken);

    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${encodeURIComponent(
      authResponse.accessToken,
    )}`;

    res.redirect(redirectUrl);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng mới' })
  @ApiCreatedResponse({ description: 'Đăng ký thành công, trả về Access Token và Refresh Token' })
  @ApiConflictResponse({ description: 'Email đã tồn tại trong hệ thống' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống bằng Email và Mật khẩu' })
  @ApiOkResponse({ description: 'Đăng nhập thành công, trả về Access Token và Refresh Token' })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không chính xác' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới Access Token thông qua Refresh Token (Token Rotation)' })
  @ApiOkResponse({ description: 'Làm mới token thành công' })
  @ApiUnauthorizedResponse({ description: 'Refresh token không hợp lệ hoặc đã bị thu hồi' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ): Promise<AuthResponse> {
    const token =
      (req.cookies as Record<string, string> | undefined)?.refreshToken || dto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy Refresh token hợp lệ');
    }
    const result = await this.authService.refresh({ refreshToken: token });
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và thu hồi Refresh Token' })
  @ApiOkResponse({ description: 'Đăng xuất thành công' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: Partial<RefreshTokenDto>,
  ): Promise<{ message: string }> {
    const token =
      (req.cookies as Record<string, string> | undefined)?.refreshToken || dto?.refreshToken;
    await this.authService.logout(userId, token);
    this.clearRefreshTokenCookie(res);
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
