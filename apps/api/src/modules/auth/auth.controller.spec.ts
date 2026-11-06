import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthResponse, UserProfile } from '@quizforge/shared-types';

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
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates register to AuthService', async () => {
    const dto = {
      email: 'user@quizforge.local',
      password: 'ValidPassword123',
      name: 'Test User',
    };
    const res = await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockAuthResponse);
  });

  it('delegates login to AuthService', async () => {
    const dto = { email: 'user@quizforge.local', password: 'ValidPassword123' };
    const res = await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockAuthResponse);
  });

  it('delegates refresh to AuthService', async () => {
    const dto = { refreshToken: 'valid-refresh-token' };
    const res = await controller.refresh(dto);
    expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockAuthResponse);
  });

  it('delegates logout to AuthService with user id', async () => {
    const res = await controller.logout('user-1', { refreshToken: 'sample-token' });
    expect(mockAuthService.logout).toHaveBeenCalledWith('user-1', 'sample-token');
    expect(res).toEqual({ message: 'Đăng xuất thành công' });
  });

  it('delegates forgotPassword to AuthService', async () => {
    const dto = { email: 'user@quizforge.local' };
    const res = await controller.forgotPassword(dto);
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    expect(res.message).toBe('Success');
  });

  it('delegates resetPassword to AuthService', async () => {
    const dto = { token: 'reset-tok', newPassword: 'NewValidPassword123' };
    const res = await controller.resetPassword(dto);
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
    expect(res.message).toBe('Success');
  });

  it('returns current user profile directly from decorator', async () => {
    const res = await controller.getMe(mockUserProfile);
    expect(res).toEqual(mockUserProfile);
  });
});
