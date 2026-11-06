import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, setStoredRefreshToken } from '../../stores/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const { refetchUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const oauthError = searchParams.get('error');

    if (oauthError || !accessToken || !refreshToken) {
      setError('Xác thực tài khoản Google không thành công. Vui lòng thử lại.');
      return;
    }

    // Save tokens securely
    setAccessToken(accessToken);
    setStoredRefreshToken(refreshToken);

    // Refetch user profile and navigate home
    void refetchUser().then(() => {
      navigate('/', { replace: true });
    });
  }, [searchParams, setAccessToken, refetchUser, navigate]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Quay lại trang Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return <LoadingSpinner fullPage label="Đang hoàn tất đăng nhập bằng Google..." />;
}
