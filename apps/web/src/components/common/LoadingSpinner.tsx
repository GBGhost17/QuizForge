import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({
  className,
  size = 'md',
  label = 'Đang tải dữ liệu...',
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center space-y-2 text-slate-500',
        className,
      )}
    >
      <Loader2
        className={cn('animate-spin text-indigo-600', sizeClasses[size])}
        aria-hidden="true"
      />
      {label && <span className="text-xs font-medium">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}
