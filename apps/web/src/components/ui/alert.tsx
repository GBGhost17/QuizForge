import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'default' | 'error' | 'success' | 'warning';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  hideIcon?: boolean;
}

const alertVariants: Record<AlertVariant, { container: string; icon: typeof Info }> = {
  default: {
    container: 'bg-slate-50 text-slate-800 border-slate-200',
    icon: Info,
  },
  error: {
    container: 'bg-red-50 text-red-900 border-red-200 [&>svg]:text-red-600',
    icon: AlertCircle,
  },
  success: {
    container: 'bg-emerald-50 text-emerald-900 border-emerald-200 [&>svg]:text-emerald-600',
    icon: CheckCircle2,
  },
  warning: {
    container: 'bg-amber-50 text-amber-900 border-amber-200 [&>svg]:text-amber-600',
    icon: AlertTriangle,
  },
};

export function Alert({
  className,
  variant = 'default',
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const { container, icon: IconComponent } = alertVariants[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-5 [&>svg]:w-5',
        container,
        className,
      )}
      {...props}
    >
      {!hideIcon && <IconComponent className="h-5 w-5 shrink-0" aria-hidden="true" />}
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed text-slate-700', className)} {...props} />
  );
}
