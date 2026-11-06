import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { ResetPasswordSchema } from '@quizforge/validation';
import { apiClient } from '../../lib/api-client';
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

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    const validationResult = ResetPasswordSchema.safeParse({ token, newPassword });
    if (!validationResult.success) {
      setErrorMessage(validationResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/reset-password', validationResult.data);
      setIsSuccess(true);
    } catch (err) {
      const serverMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể cập nhật mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ.';
      setErrorMessage(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Đặt lại mật khẩu mới</CardTitle>
          <CardDescription>Nhập token xác thực và mật khẩu mới để bảo vệ tài khoản</CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Mật khẩu của bạn đã được cập nhật thành công!
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </Button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <Alert variant="error" className="mb-4">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                  id="token"
                  label="Mã xác thực Token"
                  placeholder="Nhập mã token nhận được"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />

                <Input
                  id="newPassword"
                  type="password"
                  label="Mật khẩu mới"
                  placeholder="Tối thiểu 8 ký tự, có chữ hoa và số"
                  helperText="Yêu cầu: Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa và 1 chữ số"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <Input
                  id="confirmPassword"
                  type="password"
                  label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
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
                  isLoading={isLoading}
                >
                  Xác nhận cập nhật mật khẩu
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Hủy và quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
