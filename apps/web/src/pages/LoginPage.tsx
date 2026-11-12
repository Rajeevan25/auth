import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { CapsLockWarning } from '../components/common/CapsLockWarning';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SocialLoginButtons } from '../components/common/SocialLoginButtons';

// Schema with real-time validation rules
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Track Caps Lock state
  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsShaking(false);

    try {
      await login(data);
      // Redirect to return path if navigated from protected route
      const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const axiosError = err as AxiosError<{
        message?: string;
        lockoutRemainingSeconds?: number;
      }>;

      if (axiosError.response?.status === 429) {
        const remaining = axiosError.response.data?.lockoutRemainingSeconds || 900;
        setLockoutSeconds(remaining);
        setErrorMessage(
          axiosError.response.data?.message ||
            'Too many failed attempts. Account is temporarily locked.',
        );
      } else if (axiosError.response?.data?.message) {
        setErrorMessage(axiosError.response.data.message);
      } else {
        setErrorMessage('Unable to connect to the authentication service. Please try again.');
      }
    }
  };

  const isFormLocked = lockoutSeconds !== null && lockoutSeconds > 0;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your account dashboard"
    >
      <div className="space-y-6">
        {/* Error Banner with shake animation */}
        <ErrorBanner
          message={errorMessage}
          isShaking={isShaking}
          onDismiss={() => setErrorMessage(null)}
        />

        {/* Lockout countdown notice */}
        {isFormLocked && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3.5 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/60 dark:border-red-800 text-red-900 dark:text-red-200 text-sm flex items-center justify-between animate-fade-in"
          >
            <div>
              <p className="font-semibold">Security Lockout Active</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Maximum failed attempts exceeded. Unlocks in:
              </p>
            </div>
            <CountdownTimer
              initialSeconds={lockoutSeconds}
              onComplete={() => {
                setLockoutSeconds(null);
                setErrorMessage(null);
              }}
            />
          </div>
        )}

        {/* Social Login Buttons */}
        <SocialLoginButtons />

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">
            or continue with email
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Email address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting || isFormLocked}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="name@example.com"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring transition-colors ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                } disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium focus-ring rounded"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isSubmitting || isFormLocked}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                placeholder="••••••••"
                onKeyDown={handleKeyEvent}
                onKeyUp={handleKeyEvent}
                className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring transition-colors ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                } disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900`}
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

            {/* Caps Lock notification */}
            <div className="mt-1 flex items-center justify-between">
              {errors.password ? (
                <p id="password-error" role="alert" className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {errors.password.message}
                </p>
              ) : <div />}
              <CapsLockWarning isActive={capsLockActive} />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isSubmitting || isFormLocked}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus-ring focus:ring-brand-500 transition cursor-pointer"
                {...register('rememberMe')}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Remember me (30-day session)
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isFormLocked}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 focus-ring disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        {/* <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Default Demo Credentials:</p>
          <p className="font-mono mt-0.5">Email: demo@example.com</p>
          <p className="font-mono">Password: Password123</p>
        </div> */}

        {/* Sign up link */}
        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 dark:text-brand-400 hover:underline focus-ring rounded"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

