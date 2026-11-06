import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const { refetchUser, refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const accessToken = searchParams.get('accessToken');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError('Xác thực tài khoản Google không thành công. Vui lòng thử lại.');
      return;
    }

    const completeAuth = async () => {
      try {
        if (accessToken) {
          // Access token received via redirect, save strictly in memory
          setAccessToken(accessToken);
          await refetchUser();
          navigate('/', { replace: true });
        } else {
          // Fallback: Exchange HttpOnly cookie for session access token
          const result = await refreshSession();
          if (result) {
            navigate('/', { replace: true });
          } else {
            setError('Không thể hoàn tất phiên xác thực Google. Vui lòng đăng nhập lại.');
          }
        }
      } catch {
        setError('Xác thực tài khoản Google không thành công. Vui lòng thử lại.');
      }
    };

    void completeAuth();
  }, [searchParams, setAccessToken, refetchUser, refreshSession, navigate]);

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
