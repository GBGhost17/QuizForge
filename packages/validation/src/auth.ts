import { z } from 'zod';

/**
 * Reusable password validation:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one digit
 */
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái in hoa')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số');

export const RegisterSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng').toLowerCase(),
  password: passwordSchema,
  name: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng').toLowerCase(),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng').toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Mã xác thực token không được để trống'),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
