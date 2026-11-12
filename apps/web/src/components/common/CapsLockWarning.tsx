import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CapsLockWarningProps {
  isActive: boolean;
  className?: string;
}

export const CapsLockWarning: React.FC<CapsLockWarningProps> = ({ isActive, className = '' }) => {
  if (!isActive) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 animate-fade-in ${className}`}
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      <span>Caps Lock is ON</span>
    </div>
  );
};

