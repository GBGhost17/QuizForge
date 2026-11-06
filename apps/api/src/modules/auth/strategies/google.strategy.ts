import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', 'placeholder_google_client_id'),
      clientSecret: configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
        'placeholder_google_client_secret',
      ),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/api/v1/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Email không tồn tại trong tài khoản Google'), false);
      }

      const avatarUrl = profile.photos?.[0]?.value ?? null;
      const name = profile.displayName || email.split('@')[0] || 'Google User';

      const authResponse = await this.authService.validateOrCreateGoogleUser({
        googleId: profile.id,
        email,
        name,
        avatarUrl,
      });

      done(null, authResponse);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
