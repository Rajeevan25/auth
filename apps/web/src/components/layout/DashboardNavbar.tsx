import React, { useState } from 'react';
import { ShieldCheck, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DarkModeToggle } from '../common/DarkModeToggle';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const DashboardNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-600 text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">
              SecureAuth
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Authenticated
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <DarkModeToggle />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* User badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Log out of account"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 focus-ring transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? <LoadingSpinner size="sm" /> : <LogOut className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

