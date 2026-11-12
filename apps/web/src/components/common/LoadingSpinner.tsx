import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div role="status" className="inline-flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-solid border-current border-t-transparent ${sizeClasses[size]} ${className}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

