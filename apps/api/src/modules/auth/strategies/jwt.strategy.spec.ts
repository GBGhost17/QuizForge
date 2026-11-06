import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'user@quizforge.local',
    name: 'Người Dùng Test',
    role: UserRole.USER,
    avatarUrl: null,
    isEmailVerified: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      mockConfigService as unknown as ConfigService,
      mockPrisma as unknown as PrismaService,
    );
  });

  it('validates and returns user profile if user exists in database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await strategy.validate({
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    });

    expect(result.id).toBe(mockUser.id);
    expect(result.email).toBe(mockUser.email);
    expect(result.role).toBe(mockUser.role);
  });

  it('throws UnauthorizedException if user does not exist in database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'non-existent-user',
        email: 'ghost@quizforge.local',
        role: UserRole.USER,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
