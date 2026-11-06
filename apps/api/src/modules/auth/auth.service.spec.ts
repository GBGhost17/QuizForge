import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@quizforge.local',
    name: 'Người Dùng Test',
    passwordHash: '$argon2id$placeholder',
    role: UserRole.USER,
    avatarUrl: null,
    isEmailVerified: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let mockPrismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let mockJwtService: {
    signAsync: jest.Mock;
  };

  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockPrismaService)),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-access-token'),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Password Hashing & Verification (Argon2id)', () => {
    it('hashes plain text password using argon2id format', async () => {
      const hash = await service.hashPassword('SuperSecret123');
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('successfully verifies a valid password', async () => {
      const password = 'SuperSecret123';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const hash = await service.hashPassword('SuperSecret123');
      const isValid = await service.verifyPassword(hash, 'WrongPassword99');
      expect(isValid).toBe(false);
    });
  });

  describe('Token Hashing (SHA-256)', () => {
    it('deterministically hashes tokens with SHA-256', () => {
      const token = 'sample-random-token';
      const hash1 = service.hashToken(token);
      const hash2 = service.hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('register', () => {
    it('creates a new user and returns AuthResponse with tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.register({
        email: 'test@quizforge.local',
        password: 'Password123',
        name: 'Người Dùng Test',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@quizforge.local' },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-jwt-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@quizforge.local');
    });

    it('throws ConflictException if email is already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@quizforge.local',
          password: 'Password123',
          name: 'Người Dùng Test',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('authenticates user and returns AuthResponse', async () => {
      const password = 'Password123';
      const validHash = await service.hashPassword(password);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: validHash,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.login({
        email: 'test@quizforge.local',
        password,
      });

      expect(result.accessToken).toBe('signed-jwt-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });

    it('throws UnauthorizedException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@quizforge.local',
          password: 'Password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password does not match', async () => {
      const validHash = await service.hashPassword('RealPassword1');
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: validHash,
      });

      await expect(
        service.login({
          email: 'test@quizforge.local',
          password: 'WrongPassword2',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh (Token Rotation & Revocation)', () => {
    it('rotates refresh token and returns new tokens', async () => {
      const rawToken = 'valid-refresh-token';
      const tokenHash = service.hashToken(rawToken);

      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id-1',
        userId: mockUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: mockUser,
      });

      const result = await service.refresh({ refreshToken: rawToken });

      expect(result.accessToken).toBe('signed-jwt-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(rawToken);
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-id-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });

    it('throws UnauthorizedException if refresh token does not exist', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'nonexistent-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('detects token reuse and throws UnauthorizedException if token was revoked', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(),
        user: mockUser,
      });

      await expect(service.refresh({ refreshToken: 'already-revoked-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if refresh token is expired', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 10000),
        revokedAt: null,
        user: mockUser,
      });

      await expect(service.refresh({ refreshToken: 'expired-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revokes specific refresh token if provided', async () => {
      await service.logout('user-1', 'token-to-revoke');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          tokenHash: service.hashToken('token-to-revoke'),
          revokedAt: null,
        },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
    });

    it('revokes all active sessions for user if token is omitted', async () => {
      await service.logout('user-1');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
        },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('creates reset token for existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.passwordResetToken.create.mockResolvedValue({ id: 'prt-1' });

      const result = await service.forgotPassword({ email: mockUser.email });
      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalled();
      expect(result.message).toContain('đặt lại mật khẩu');
    });

    it('returns generic message even if email does not exist (prevents enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'unknown@example.com' });
      expect(mockPrismaService.passwordResetToken.create).not.toHaveBeenCalled();
      expect(result.message).toContain('đặt lại mật khẩu');
    });

    it('resets password, marks token as used, and invalidates all sessions', async () => {
      const rawToken = 'valid-reset-token';
      const tokenHash = service.hashToken(rawToken);

      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: mockUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
        user: mockUser,
      });

      const result = await service.resetPassword({
        token: rawToken,
        newPassword: 'NewValidPassword123',
      });

      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockPrismaService.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prt-1' },
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }),
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, revokedAt: null },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      expect(result.message).toContain('thành công');
    });

    it('rejects reset if token is already used', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 100000),
        usedAt: new Date(),
        user: mockUser,
      });

      await expect(
        service.resetPassword({
          token: 'already-used',
          newPassword: 'NewValidPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMe', () => {
    it('returns UserProfile for valid userId', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const profile = await service.getMe(mockUser.id);
      expect(profile.id).toBe(mockUser.id);
      expect(profile.email).toBe(mockUser.email);
      expect(profile.name).toBe(mockUser.name);
    });

    it('throws UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('non-existent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateOrCreateGoogleUser', () => {
    it('returns tokens for existing user with matching googleId', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        googleId: 'google-id-123',
      });

      const result = await service.validateOrCreateGoogleUser({
        googleId: 'google-id-123',
        email: mockUser.email,
        name: mockUser.name,
      });

      expect(result.accessToken).toBe('signed-jwt-access-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('links googleId to existing user with matching email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUser,
        googleId: 'google-id-456',
      });

      const result = await service.validateOrCreateGoogleUser({
        googleId: 'google-id-456',
        email: mockUser.email,
        name: mockUser.name,
      });

      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-jwt-access-token');
    });

    it('creates a new user when neither googleId nor email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      const newUser = {
        id: 'new-google-user-id',
        email: 'googleuser@gmail.com',
        name: 'Google User',
        googleId: 'google-id-789',
        role: UserRole.USER,
        avatarUrl: 'https://avatar.url',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValueOnce(newUser);

      const result = await service.validateOrCreateGoogleUser({
        googleId: 'google-id-789',
        email: 'googleuser@gmail.com',
        name: 'Google User',
        avatarUrl: 'https://avatar.url',
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'googleuser@gmail.com',
          name: 'Google User',
          googleId: 'google-id-789',
          avatarUrl: 'https://avatar.url',
          isEmailVerified: true,
          role: UserRole.USER,
        },
      });
      expect(result.user.id).toBe(newUser.id);
    });
  });
});
