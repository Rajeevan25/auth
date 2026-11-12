import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { CapsLockWarning } from '../components/common/CapsLockWarning';
import { PasswordStrengthMeter } from '../components/common/PasswordStrengthMeter';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SocialLoginButtons } from '../components/common/SocialLoginButtons';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms of service' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: true,
    },
  });

  const passwordValue = watch('password');

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    setIsShaking(false);

    try {
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.data?.message) {
        setErrorMessage(axiosError.response.data.message);
      } else {
        setErrorMessage('Failed to create account. Please try again.');
      }
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join SecureAuth to start building protected applications"
    >
      <div className="space-y-6">
        <ErrorBanner
          message={errorMessage}
          isShaking={isShaking}
          onDismiss={() => setErrorMessage(null)}
        />

        <SocialLoginButtons />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">
            or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="register-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Full name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
                placeholder="John Doe"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                } disabled:opacity-50`}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p id="name-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Email address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <CapsLockWarning isActive={capsLockActive} />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
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

            {/* Password strength visualizer */}
            <PasswordStrengthMeter password={passwordValue} />

            {errors.password && (
              <p id="password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password"
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

          {/* Terms checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isSubmitting}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus-ring focus:ring-brand-500 transition cursor-pointer"
                {...register('terms')}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                I agree to the{' '}
                <a href="#terms" className="text-brand-600 dark:text-brand-400 underline hover:no-underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-brand-600 dark:text-brand-400 underline hover:no-underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.terms && (
              <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.terms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 focus-ring disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 dark:text-brand-400 hover:underline focus-ring rounded"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

