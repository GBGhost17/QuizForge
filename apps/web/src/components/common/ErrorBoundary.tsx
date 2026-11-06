import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, log to telemetry service without logging secrets
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught error:', error.message, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[350px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Đã xảy ra sự cố không mong muốn</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Giao diện gặp lỗi trong quá trình xử lý. Bạn có thể tải lại trang hoặc thử lại sau.
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            size="md"
            className="mt-6 inline-flex items-center"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
