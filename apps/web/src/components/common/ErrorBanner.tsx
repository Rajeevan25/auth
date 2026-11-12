import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
  isShaking?: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  className = '',
  isShaking = false,
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-3 text-sm transition-all duration-200 ${
        isShaking ? 'animate-shake' : 'animate-fade-in'
      } ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error notification"
          className="p-1 -mr-1 -mt-1 text-red-500 hover:text-red-700 dark:hover:text-red-200 rounded focus-ring"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

