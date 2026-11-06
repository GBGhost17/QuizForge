import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { GoogleCallbackPage } from '../pages/auth/GoogleCallbackPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'auth/callback',
        element: <GoogleCallbackPage />,
      },
      // Protected Routes / Placeholders for Creator
      {
        path: 'question-banks',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Ngân hàng câu hỏi" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tests',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Quản lý đề thi & Xuất bản" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'submissions',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Bài nộp & Chấm thi" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'import',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Nhập đề thi từ Markdown" />
          </ProtectedRoute>
        ),
      },
      // Participant Routes
      {
        path: 'join',
        element: <PlaceholderPage title="Vào thi bằng mã phòng" />,
      },
      {
        path: 'attempts',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Lịch sử bài làm" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'practice',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Tự luyện tập" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <PlaceholderPage title="Cài đặt tài khoản" />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <PlaceholderPage
            title="Không tìm thấy trang (404)"
            description="Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển."
          />
        ),
      },
    ],
  },
]);
