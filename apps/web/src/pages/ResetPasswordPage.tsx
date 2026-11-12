import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { apiClient } from '../lib/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { CapsLockWarning } from '../components/common/CapsLockWarning';
import { PasswordStrengthMeter } from '../components/common/PasswordStrengthMeter';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setErrorMessage('Reset token is missing from the URL. Please request a new link.');
      return;
    }

    setErrorMessage(null);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setErrorMessage(
        axiosError.response?.data?.message ||
          'Failed to reset password. The link may have expired or already been used.',
      );
    }
  };

  // If no token in URL
  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This password recovery link is missing its security verification token"
      >
        <div className="space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The link you clicked did not include a valid token parameter. Please request a new recovery link.
          </p>
          <Link
            to="/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 focus-ring"
          >
            <span>Request new reset link</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Choose a strong, unique password to secure your account"
    >
      <div className="space-y-6">
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        {isSuccess ? (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Password updated successfully
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                All previous sessions have been invalidated. You can now sign in with your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 focus-ring"
            >
              <span>Sign in now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="reset-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  New password <span className="text-red-500">*</span>
                </label>
                <CapsLockWarning isActive={capsLockActive} />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  placeholder="At least 8 characters"
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring transition-colors ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                  } disabled:opacity-50`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring rounded-r-lg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <PasswordStrengthMeter password={passwordValue} />

              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Confirm new password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  placeholder="Re-enter your password"
                  className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                  } disabled:opacity-50`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring rounded-r-lg"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 focus-ring disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                  <span>Resetting password...</span>
                </>
              ) : (
                <span>Update password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

