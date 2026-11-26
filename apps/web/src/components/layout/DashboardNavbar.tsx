import React, { useState } from 'react';
import { ShieldCheck, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DarkModeToggle } from '../common/DarkModeToggle';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface DashboardNavbarProps {
  onToggleSidebar?: () => void;
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  ADMIN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  HR_MANAGER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  HR_EXECUTIVE: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  RECRUITER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  FINANCE_MANAGER: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  FINANCE_EXECUTIVE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  TEAM_LEAD: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  EMPLOYEE: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

function formatLabel(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onToggleSidebar }) => {
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

  const roleLabel = formatLabel(user?.role) || 'Member';
  const designationLabel = formatLabel(user?.designation);
  const roleBadgeClass =
    (user?.role && ROLE_BADGE_STYLES[user.role]) ||
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation sidebar"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 rounded-xl bg-brand-600 text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">
              PeopleHub HRM
            </span>
            <span className={`hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleBadgeClass}`}>
              {roleLabel}
            </span>
            {designationLabel && (
              <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
                {designationLabel}
              </span>
            )}
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

