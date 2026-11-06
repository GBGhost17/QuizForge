import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { RegisterSchema } from '@quizforge/validation';
import { useAuth } from '../../hooks/useAuth';
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

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { register, isRegistering, registerError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp');
      return;
    }

    const validationResult = RegisterSchema.safeParse({ name, email, password });
    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      await register(validationResult.data);
      navigate('/', { replace: true });
    } catch {
      // registerError managed by mutation
    }
  };

  const errorMessage =
    validationError ||
    (registerError &&
      ((registerError as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Đăng ký thất bại. Vui lòng thử lại.'));

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Tạo tài khoản QuizForge
          </CardTitle>
          <CardDescription>Đăng ký để bắt đầu tạo hoặc làm bài kiểm tra trực tuyến</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <Alert variant="error" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />

            <Input
              id="email"
              type="email"
              label="Địa chỉ Email"
              placeholder="ten@vidu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              type="password"
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự, có chữ hoa và số"
              helperText="Yêu cầu: Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa và 1 chữ số"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isRegistering}
            >
              Đăng ký tài khoản
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
