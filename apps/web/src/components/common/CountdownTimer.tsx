import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  onComplete,
  className = '',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, onComplete]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 font-mono font-semibold text-red-600 dark:text-red-400 ${className}`}
    >
      <Clock className="w-4 h-4 animate-pulse" />
      <span>{formatted}</span>
    </div>
  );
};

