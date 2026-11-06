import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Auth Integration Tests (Stage S03)', () => {
  let prisma: PrismaService;
  let authService: AuthService;
  let moduleRef: TestingModule;

  const testEmail = 'integration.student@quizforge.local';
  const testPassword = 'StrongPassword123';
  let createdUserId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    authService = moduleRef.get<AuthService>(AuthService);

    // Clean up if previous run left test user
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    await prisma.$disconnect();
    await moduleRef.close();
  });

  it('registers a new user and issues access/refresh tokens', async () => {
    const response = await authService.register({
      email: testEmail,
      password: testPassword,
      name: 'Integration Test User',
    });

    expect(response.accessToken).toBeDefined();
    expect(response.refreshToken).toBeDefined();
    expect(response.user.email).toBe(testEmail);
    expect(response.user.role).toBe('USER');

    createdUserId = response.user.id;

    // Verify stored password is an Argon2id hash, not plain text
    const stored = await prisma.user.findUnique({ where: { id: createdUserId } });
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(stored?.passwordHash).not.toBe(testPassword);
  });

  it('authenticates the registered user via login', async () => {
    const loginRes = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    expect(loginRes.accessToken).toBeDefined();
    expect(loginRes.refreshToken).toBeDefined();
    expect(loginRes.user.id).toBe(createdUserId);
  });

  it('rotates refresh token and invalidates old one', async () => {
    const initialLogin = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    const oldRefreshToken = initialLogin.refreshToken;

    // Refresh token
    const refreshRes = await authService.refresh({ refreshToken: oldRefreshToken });
    expect(refreshRes.accessToken).toBeDefined();
    expect(refreshRes.refreshToken).toBeDefined();
    expect(refreshRes.refreshToken).not.toBe(oldRefreshToken);

    // Replay attack / reuse detection: using oldRefreshToken must now fail
    await expect(authService.refresh({ refreshToken: oldRefreshToken })).rejects.toThrow(
      'Refresh token đã bị thu hồi hoặc đã được sử dụng',
    );
  });

  it('revokes refresh tokens upon logout', async () => {
    const loginRes = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    await authService.logout(createdUserId, loginRes.refreshToken);

    // Using the logged out token must fail
    await expect(authService.refresh({ refreshToken: loginRes.refreshToken })).rejects.toThrow();
  });

  it('handles forgot-password and reset-password flow', async () => {
    const forgotRes = await authService.forgotPassword({ email: testEmail });
    expect(forgotRes.resetToken).toBeDefined();
    if (!forgotRes.resetToken) {
      throw new Error('Expected resetToken to be defined');
    }

    const newPassword = 'BrandNewPassword456';
    const resetRes = await authService.resetPassword({
      token: forgotRes.resetToken,
      newPassword,
    });
    expect(resetRes.message).toContain('thành công');

    // Login with old password must fail
    await expect(authService.login({ email: testEmail, password: testPassword })).rejects.toThrow();

    // Login with new password must succeed
    const newLogin = await authService.login({ email: testEmail, password: newPassword });
    expect(newLogin.accessToken).toBeDefined();
  });
});
