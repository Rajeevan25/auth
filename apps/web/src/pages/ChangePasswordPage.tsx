import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { changePassword } from '../lib/hrm-api';
import { useAuth } from '../hooks/useAuth';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must have an uppercase letter')
      .regex(/[a-z]/, 'Must have a lowercase letter')
      .regex(/[0-9]/, 'Must have a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must differ from current',
    path: ['newPassword'],
  });

type FormData = z.infer<typeof schema>;

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string }
>(({ label, id, error, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={show ? 'text' : 'password'}
          className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-brand-500 ${
            error
              ? 'border-red-400 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-700'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await changePassword(data);
      setSuccess(true);
      await checkAuth(); // re-fetch user so mustChangePassword is now false
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Set Your Password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Your account was created with a temporary password. Please set a new secure password
            before continuing.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Password changed successfully!
              </p>
              <p className="text-xs text-slate-500">Redirecting to dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                  {serverError}
                </div>
              )}

              <PasswordInput
                id="currentPassword"
                label="Current (Temporary) Password"
                placeholder="Enter your current password"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
              <PasswordInput
                id="newPassword"
                label="New Password"
                placeholder="Min 8 chars, upper + lower + number"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 mt-2"
              >
                <Lock className="w-4 h-4" />
                {isSubmitting ? 'Changing…' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
