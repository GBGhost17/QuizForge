import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AuthService } from '../auth.service';
import { GoogleStrategy } from './google.strategy';
import type { Profile } from 'passport-google-oauth20';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, defaultVal) => defaultVal),
  };

  const mockAuthService = {
    validateOrCreateGoogleUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new GoogleStrategy(
      mockConfigService as unknown as ConfigService,
      mockAuthService as unknown as AuthService,
    );
  });

  it('validates google profile and calls validateOrCreateGoogleUser', async () => {
    const mockProfile: Partial<Profile> = {
      id: 'google-sub-123',
      displayName: 'Google Test User',
      emails: [{ value: 'google@test.local', verified: true }],
      photos: [{ value: 'https://avatar.url/photo.jpg' }],
    };

    const mockAuthResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'u-1',
        email: 'google@test.local',
        name: 'Google Test User',
        role: UserRole.USER,
        avatarUrl: 'https://avatar.url/photo.jpg',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      },
    };

    mockAuthService.validateOrCreateGoogleUser.mockResolvedValueOnce(mockAuthResponse);

    const done = jest.fn();

    await strategy.validate(
      'mock-access-token',
      'mock-refresh-token',
      mockProfile as Profile,
      done,
    );

    expect(mockAuthService.validateOrCreateGoogleUser).toHaveBeenCalledWith({
      googleId: 'google-sub-123',
      email: 'google@test.local',
      name: 'Google Test User',
      avatarUrl: 'https://avatar.url/photo.jpg',
    });
    expect(done).toHaveBeenCalledWith(null, mockAuthResponse);
  });

  it('calls done with error if email is missing from profile', async () => {
    const mockProfile: Partial<Profile> = {
      id: 'google-sub-no-email',
      displayName: 'No Email User',
      emails: [],
    };

    const done = jest.fn();

    await strategy.validate(
      'mock-access-token',
      'mock-refresh-token',
      mockProfile as Profile,
      done,
    );

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/email/i) }),
      false,
    );
  });
});
