import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { LoginSchema } from '@quizforge/validation';
import { useAuth } from '../../hooks/useAuth';
import { sanitizeEnglishEmail, sanitizeEnglishPassword } from '../../lib/input-sanitizers';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate with Zod schema
    const validationResult = LoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0]?.message || 'Thông tin không hợp lệ');
      return;
    }

    try {
      await login(validationResult.data);
      navigate(from, { replace: true });
    } catch {
      // loginError is managed by TanStack Query mutation
    }
  };

  const oauthError =
    searchParams.get('error') === 'oauth_failed'
      ? 'Đăng nhập bằng tài khoản Google không thành công. Vui lòng thử lại.'
      : null;

  const errorMessage =
    oauthError ||
    validationError ||
    (loginError &&
      ((loginError as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Email hoặc mật khẩu không chính xác'));

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Đăng nhập QuizForge</CardTitle>
          <CardDescription>Nhập email và mật khẩu của bạn để truy cập hệ thống</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <Alert variant="error" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="email"
              type="email"
              label="Địa chỉ Email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(sanitizeEnglishEmail(e.target.value))}
              required
              autoComplete="email"
              autoFocus
              lang="en"
              autoCapitalize="none"
              spellCheck={false}
            />

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(sanitizeEnglishPassword(e.target.value))}
                required
                autoComplete="current-password"
                lang="en"
                autoCapitalize="none"
                spellCheck={false}
              />
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoggingIn}
            >
              Đăng nhập
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">Hoặc</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-50 text-slate-700"
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Đăng nhập với Google</span>
          </Button>

          <div className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
