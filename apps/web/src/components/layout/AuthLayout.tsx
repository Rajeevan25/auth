import React from 'react';
import { ShieldCheck, Lock, RefreshCw, KeyRound } from 'lucide-react';
import { DarkModeToggle } from '../common/DarkModeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
      {/* Left Column: Hero Branding Panel (Visible on lg screens, fixed to screen) */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex-col justify-between p-12 overflow-hidden select-none">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 -left-12 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-inner">
            <ShieldCheck className="w-7 h-7 text-brand-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SecureAuth</h1>
            <p className="text-xs text-brand-200">Production Full-Stack Authentication</p>
          </div>
        </div>

        {/* Middle Value Props */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OWASP & WCAG AA Compliant
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Zero-Trust Architecture for Modern Applications
            </h2>
            <p className="text-brand-100 text-sm leading-relaxed">
              Designed from first principles with dual-token rotation, anti-enumeration defenses,
              brute-force lockout, and full keyboard accessibility.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-brand-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Secure Cookie Storage</h3>
                <p className="text-xs text-brand-200 mt-0.5">
                  15-minute access tokens and 7-day rotating refresh tokens isolated in
                  HttpOnly/SameSite cookies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-brand-300">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Automatic Token Rotation</h3>
                <p className="text-xs text-brand-200 mt-0.5">
                  Single-use refresh tokens with instant revocation of all active sessions upon
                  replay detection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-brand-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Defensive Rate Limiting</h3>
                <p className="text-xs text-brand-200 mt-0.5">
                  Constant-time dummy bcrypt hashes and 15-minute lockouts after 5 failed attempts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Quote */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-brand-200 flex items-center justify-between">
          <span>Production-Ready TypeScript Monorepo</span>
          <span>Node.js • React 18 • Prisma • PostgreSQL</span>
        </div>
      </div>

      {/* Right Column: Authentication Card & Forms (Scrolls independently) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative">
        {/* Top Bar with Dark Mode Toggle */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">SecureAuth</span>
          </div>
          <div className="ml-auto">
            <DarkModeToggle />
          </div>
        </div>

        {/* Center Content Form Box */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
            {children}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
          &copy; {new Date().getFullYear()} SecureAuth Platform. Built for production scale.
        </div>
      </div>
    </div>
  );
};

