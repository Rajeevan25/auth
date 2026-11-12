import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Terminal } from 'lucide-react';
import { AxiosError } from 'axios';
import { apiClient } from '../lib/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setErrorMessage(null);

    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setIsSubmitted(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setErrorMessage(
        axiosError.response?.data?.message || 'Failed to submit request. Please try again.',
      );
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will send you instructions to safely reset your account password"
    >
      <div className="space-y-6">
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        {isSubmitted ? (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Check your inbox
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                If an account exists for <span className="font-semibold">{getValues('email')}</span>,
                we have dispatched a time-limited password reset link.
              </p>
            </div>

            {/* Development Mode Helper Callout */}
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                <Terminal className="w-4 h-4 shrink-0" />
                <span>Development Environment Notice</span>
              </div>
              <p className="leading-relaxed">
                In this development setup, email dispatch is simulated. Check your <strong>API terminal console logs</strong> to view the generated link directly.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 focus-ring"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to login</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Registered email address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="name@example.com"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                  } disabled:opacity-50`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.email.message}
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
                  <span>Sending reset link...</span>
                </>
              ) : (
                <span>Send password reset link</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium focus-ring rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

