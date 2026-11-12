import React, { useState } from 'react';
import { ShieldCheck, User, Calendar, Key, CheckCircle, RefreshCw, Server, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  const handleTestApi = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await apiClient.get('/auth/me');
      setTestResult(`Success 200 OK: ${JSON.stringify(response.data, null, 2)}`);
    } catch (err) {
      setTestResult(`Error: ${(err as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-xl shadow-brand-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Active Session Verified
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Explorer'}!
            </h1>
            <p className="text-brand-100 text-sm max-w-xl">
              You are signed into the protected area. Your session is safeguarded with short-lived JWT access tokens and rotating httpOnly refresh cookies.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestApi}
            disabled={isTesting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-900 text-xs font-bold hover:bg-brand-50 shadow-sm transition-all focus-ring shrink-0"
          >
            {isTesting ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5 text-brand-700" />}
            <span>Test /api/auth/me Interceptor</span>
          </button>
        </div>

        {/* Test Result Output Box */}
        {testResult && (
          <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-md">
            <div className="text-slate-400 font-sans mb-1 text-[11px] font-semibold">
              Live Interceptor API Response:
            </div>
            <pre>{testResult}</pre>
          </div>
        )}

        {/* Profile & Security Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: User Identity */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                User Profile
              </h2>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Full Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Email Address</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">User ID (UUID)</dt>
                <dd className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{user?.id}</dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Security & Tokens */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Security Posture
              </h2>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Access Token Lifetime</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">15 Minutes (In-Memory / Cookie)</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Refresh Token Policy</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">Rotating SHA-256 (HttpOnly Cookie)</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Account Standing</dt>
                <dd className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Normal (0 Lockouts)
                </dd>
              </div>
            </dl>
          </div>

          {/* Card 3: Account Metadata */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Account Metadata
              </h2>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Registration Date</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{formattedDate}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Database Engine</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">PostgreSQL + Prisma ORM</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Environment</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">Monorepo Production Scaffold</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Architectural Overview Card for Developers */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                How This Full-Stack Auth Pipeline Works
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clean layered structure ready for your application features
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-500" />
                1. Dual Token Lifecycle
              </div>
              <p>
                When you log in, the API issues a 15-minute JWT access token and a 7-day cryptographically random refresh token. Both are set in <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code> cookies to eliminate XSS token theft.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-500" />
                2. Axios Silent Refresh Interceptor
              </div>
              <p>
                If an authenticated API call returns 401, Axios intercepts the error, calls <code>/api/auth/refresh</code> in the background, swaps the expired token, and replays the original request seamlessly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-500" />
                3. Rotation & Reuse Defense
              </div>
              <p>
                Every refresh operation revokes the previous refresh token and generates a new one. If an already revoked token is used, the system detects a token-theft replay and immediately revokes all sessions for that user.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                4. Brute-Force & Enumeration Protection
              </div>
              <p>
                5 consecutive failed password attempts trigger an automatic 15-minute security lockout. Login and forgot-password flows use dummy bcrypt hashing and uniform responses to prevent user enumeration.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

