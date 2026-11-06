import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthResponse, UserProfile } from '@quizforge/shared-types';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUserProfile: UserProfile = {
    id: 'user-1',
    email: 'user@quizforge.local',
    name: 'Test User',
    role: UserRole.USER,
    avatarUrl: null,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    user: mockUserProfile,
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockAuthResponse),
    login: jest.fn().mockResolvedValue(mockAuthResponse),
    refresh: jest.fn().mockResolvedValue(mockAuthResponse),
    logout: jest.fn().mockResolvedValue(undefined),
    forgotPassword: jest.fn().mockResolvedValue({ message: 'Success' }),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Success' }),
    getMe: jest.fn().mockResolvedValue(mockUserProfile),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key, defaultVal) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates register to AuthService', async () => {
    const dto = {
      email: 'user@quizforge.local',
      password: 'ValidPassword123',
      name: 'Test User',
    };
    const result = await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockAuthResponse);
  });

  it('delegates login to AuthService', async () => {
    const dto = { email: 'user@quizforge.local', password: 'ValidPassword123' };
    const result = await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockAuthResponse);
  });

  it('delegates refresh to AuthService', async () => {
    const dto = { refreshToken: 'valid-token' };
    const result = await controller.refresh(dto);
    expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockAuthResponse);
  });

  it('delegates logout to AuthService', async () => {
    const result = await controller.logout('user-1', { refreshToken: 'rev-token' });
    expect(mockAuthService.logout).toHaveBeenCalledWith('user-1', 'rev-token');
    expect(result).toEqual({ message: 'Đăng xuất thành công' });
  });

  it('delegates forgotPassword to AuthService', async () => {
    const dto = { email: 'user@quizforge.local' };
    const result = await controller.forgotPassword(dto);
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'Success' });
  });

  it('delegates resetPassword to AuthService', async () => {
    const dto = { token: 'tok-1', newPassword: 'NewPassword123' };
    const result = await controller.resetPassword(dto);
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'Success' });
  });

  it('returns current user on getMe', async () => {
    const result = await controller.getMe(mockUserProfile);
    expect(result).toBe(mockUserProfile);
  });

  it('redirects to frontend callback with tokens on googleAuthCallback', async () => {
    const mockRes = {
      redirect: jest.fn(),
    } as unknown as Response;
    const mockReq = {
      user: mockAuthResponse,
    } as unknown as Request & { user?: AuthResponse };

    await controller.googleAuthCallback(mockReq, mockRes);

    expect(mockRes.redirect).toHaveBeenCalledWith(
      `http://localhost:5173/auth/callback?accessToken=${encodeURIComponent(
        mockAuthResponse.accessToken,
      )}&refreshToken=${encodeURIComponent(mockAuthResponse.refreshToken)}`,
    );
  });

  it('redirects to login error when google user is missing in callback', async () => {
    const mockRes = {
      redirect: jest.fn(),
    } as unknown as Response;
    const mockReq = {} as unknown as Request & { user?: AuthResponse };

    await controller.googleAuthCallback(mockReq, mockRes);

    expect(mockRes.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=oauth_failed');
  });
});
