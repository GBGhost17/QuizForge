import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_JWT_ACCESS_EXPIRES_IN,
  DEFAULT_JWT_REFRESH_EXPIRES_IN,
  DEFAULT_JWT_SECRET,
  PASSWORD_RESET_TOKEN_EXPIRES_HOURS,
} from './auth.constants';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto } from './dto';
import type { AuthPayload, AuthResponse, UserProfile } from '@quizforge/shared-types';

@Injectable()
export class AuthService {
  private readonly refreshExpiresInMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const rawRefreshExpires = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      DEFAULT_JWT_REFRESH_EXPIRES_IN,
    );
    this.refreshExpiresInMs = this.parseDurationToMs(rawRefreshExpires);
  }

  // -------------------------------------------------------------
  // CRYPTOGRAPHIC UTILITIES
  // -------------------------------------------------------------

  /**
   * Hashes a password using Argon2id with robust security defaults.
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Verifies a plain text password against an Argon2id hash.
   */
  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  /**
   * Deterministically hashes a token string with SHA-256 for secure storage.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically secure random token string.
   */
  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // -------------------------------------------------------------
  // CORE AUTHENTICATION FLOWS
  // -------------------------------------------------------------

  /**
   * Registers a new user account.
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        role: UserRole.USER,
      },
    });

    return this.generateAuthResponse(user);
  }

  /**
   * Authenticates user with email and password.
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await this.verifyPassword(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Refreshes access token with rotation and reuse detection.
   */
  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc không tồn tại');
    }

    // Token reuse detection: if a revoked token is used, reject immediately
    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi hoặc đã được sử dụng');
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    // Atomic token rotation: revoke current token and issue new one
    const rawNewRefreshToken = this.generateRandomToken();
    const newRefreshTokenHash = this.hashToken(rawNewRefreshToken);
    const newExpiresAt = new Date(Date.now() + this.refreshExpiresInMs);

    await this.prisma.$transaction(async (tx) => {
      // 1. Revoke the old token
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });

      // 2. Insert new token
      await tx.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          tokenHash: newRefreshTokenHash,
          expiresAt: newExpiresAt,
        },
      });
    });

    const accessToken = await this.generateAccessToken(tokenRecord.user);

    return {
      accessToken,
      refreshToken: rawNewRefreshToken,
      user: this.mapToUserProfile(tokenRecord.user),
    };
  }

  /**
   * Revokes refresh token(s) upon logout.
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all active refresh tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  /**
   * Requests a password reset token.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const genericMessage =
      'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến bạn.';

    if (!user) {
      return { message: genericMessage };
    }

    const rawToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';

    return {
      message: genericMessage,
      ...(isDevelopment ? { resetToken: rawToken } : {}),
    };
  }

  /**
   * Resets password using valid token and revokes all active sessions.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token);

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Mã khôi phục mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const newPasswordHash = await this.hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      // 1. Update user password
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      });

      // 2. Mark reset token as used
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // 3. Invalidate all active sessions across devices
      await tx.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.' };
  }

  /**
   * Retrieves profile of current user.
   */
  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.mapToUserProfile(user);
  }

  // -------------------------------------------------------------
  // HELPER METHODS
  // -------------------------------------------------------------

  private async generateAccessToken(user: {
    id: string;
    email: string;
    role: UserRole;
  }): Promise<string> {
    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = this.configService.get<string>('JWT_SECRET', DEFAULT_JWT_SECRET);
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      DEFAULT_JWT_ACCESS_EXPIRES_IN,
    ) as `${number}s` | `${number}m` | `${number}h` | `${number}d`;

    return this.jwtService.signAsync(payload, { secret, expiresIn });
  }

  private async generateAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
    isEmailVerified: boolean;
    createdAt: Date;
  }): Promise<AuthResponse> {
    const accessToken = await this.generateAccessToken(user);

    const rawRefreshToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshExpiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.mapToUserProfile(user),
    };
  }

  private mapToUserProfile(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
    isEmailVerified: boolean;
    createdAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const val = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return val * 1000;
      case 'm':
        return val * 60 * 1000;
      case 'h':
        return val * 60 * 60 * 1000;
      case 'd':
        return val * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
