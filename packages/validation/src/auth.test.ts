import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  passwordSchema,
} from './auth';

describe('Password validation schema', () => {
  it('accepts password meeting all requirements', () => {
    expect(() => passwordSchema.parse('ValidPass123')).not.toThrow();
  });

  it('rejects password shorter than 8 characters', () => {
    expect(() => passwordSchema.parse('Short1A')).toThrow('ít nhất 8 ký tự');
  });

  it('rejects password without uppercase letter', () => {
    expect(() => passwordSchema.parse('lowercase123')).toThrow('chữ cái in hoa');
  });

  it('rejects password without number', () => {
    expect(() => passwordSchema.parse('NoNumberPass')).toThrow('chữ số');
  });
});

describe('RegisterSchema', () => {
  it('accepts valid registration input and normalizes email', () => {
    const input = {
      email: '  User@Example.COM  ',
      password: 'StrongPassword1',
      name: 'Nguyen Van A',
    };
    const parsed = RegisterSchema.parse(input);
    expect(parsed.email).toBe('user@example.com');
    expect(parsed.name).toBe('Nguyen Van A');
  });

  it('rejects invalid email', () => {
    const input = {
      email: 'not-an-email',
      password: 'StrongPassword1',
      name: 'Nguyen Van A',
    };
    expect(() => RegisterSchema.parse(input)).toThrow('Email không đúng định dạng');
  });

  it('rejects short name', () => {
    const input = {
      email: 'user@example.com',
      password: 'StrongPassword1',
      name: 'A',
    };
    expect(() => RegisterSchema.parse(input)).toThrow('Họ và tên phải có ít nhất 2 ký tự');
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const input = {
      email: 'User@Example.COM',
      password: 'AnyPassword123',
    };
    const parsed = LoginSchema.parse(input);
    expect(parsed.email).toBe('user@example.com');
  });

  it('rejects empty password', () => {
    expect(() => LoginSchema.parse({ email: 'user@example.com', password: '' })).toThrow(
      'Mật khẩu không được để trống',
    );
  });
});

describe('RefreshTokenSchema', () => {
  it('validates refresh token input', () => {
    expect(() => RefreshTokenSchema.parse({ refreshToken: 'valid-token' })).not.toThrow();
    expect(() => RefreshTokenSchema.parse({ refreshToken: '' })).toThrow();
  });
});

describe('ForgotPasswordSchema & ResetPasswordSchema', () => {
  it('validates forgot password email', () => {
    expect(() => ForgotPasswordSchema.parse({ email: 'valid@example.com' })).not.toThrow();
    expect(() => ForgotPasswordSchema.parse({ email: 'bad' })).toThrow();
  });

  it('validates reset password token and new password', () => {
    expect(() =>
      ResetPasswordSchema.parse({ token: 'tok-123', newPassword: 'NewPassword99' }),
    ).not.toThrow();
    expect(() => ResetPasswordSchema.parse({ token: 'tok-123', newPassword: 'weak' })).toThrow();
  });
});
