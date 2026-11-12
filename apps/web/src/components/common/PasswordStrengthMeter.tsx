import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password?: string;
  showDetails?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  showDetails = true,
}) => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number or special symbol', met: /[\d\W_]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const strengthConfig = [
    { label: 'Too Weak', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-slate-500' },
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const current = strengthConfig[score];

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2 animate-fade-in" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
        <span className={`font-semibold ${current.text}`}>{current.label}</span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-colors duration-300 ${
              score >= step ? current.color : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      {showDetails && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
          {criteria.map((c, i) => (
            <li
              key={i}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                c.met
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {c.met ? (
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 opacity-60" />
              )}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

