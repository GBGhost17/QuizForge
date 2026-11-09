import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ForgotPasswordSchema } from '@quizforge/validation';
import { sanitizeEnglishEmail } from '../../lib/input-sanitizers';
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationResult = ForgotPasswordSchema.safeParse({ email });
    if (!validationResult.success) {
      setErrorMessage(validationResult.error.errors[0]?.message || 'Email không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch {
      setErrorMessage('Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Quên mật khẩu?</CardTitle>
          <CardDescription>
            Nhập địa chỉ email của bạn để nhận hướng dẫn khôi phục mật khẩu
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Nếu địa chỉ email <span className="font-semibold text-slate-900">{email}</span> tồn
                tại trong hệ thống, chúng tôi đã tạo mã khôi phục cho bạn.
              </p>
              <Link to="/login" className="inline-block w-full mt-4">
                <Button variant="outline" size="md" className="w-full">
                  Quay lại đăng nhập
                </Button>
              </Link>
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
                  id="email"
                  type="email"
                  label="Địa chỉ Email đã đăng ký"
                  placeholder="ten@vidu.com"
                  value={email}
                  onChange={(e) => setEmail(sanitizeEnglishEmail(e.target.value))}
                  required
                  autoComplete="email"
                  autoFocus
                  lang="en"
                  autoCapitalize="none"
                  spellCheck={false}
                  helperText="Chỉ nhập ký tự tiếng Anh (không dấu)"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isLoading}
                >
                  Gửi yêu cầu khôi phục
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Quay lại trang Đăng nhập
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
