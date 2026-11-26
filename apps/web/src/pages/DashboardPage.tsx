import React, { useState } from 'react';
import { ShieldCheck, User, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { Sidebar } from '../components/layout/Sidebar';
import { RoleWidgets, getLeaveQuota } from '../components/dashboard/RoleWidgets';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <DashboardNavbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-xl shadow-brand-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              HR Workspace Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Team Member'}!
            </h1>
            <p className="text-brand-100 text-sm max-w-xl">
              Manage your team, track attendance, and handle leave requests from your central HR workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestApi}
            disabled={isTesting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-900 text-xs font-bold hover:bg-brand-50 shadow-sm transition-all focus-ring shrink-0"
          >
            {isTesting ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5 text-brand-700" />}
            <span>Refresh Employee Profile</span>
          </button>
        </div>

        {/* Test Result Output Box */}
        {testResult && (
          <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-md">
            <div className="text-slate-400 font-sans mb-1 text-[11px] font-semibold">
              Employee Profile API Response:
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
                Employee Profile
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
                <dt className="text-slate-500 dark:text-slate-400">Employee ID</dt>
                <dd className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{user?.id}</dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Workforce Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Workforce Status
              </h2>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Shift Schedule</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">9:00 AM – 5:00 PM</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Department</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {user?.department || 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Role / Level</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {user?.role || 'EMPLOYEE'}
                  {user?.designation ? ` (${user.designation})` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Employment Status</dt>
                <dd className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </dd>
              </div>
            </dl>
          </div>

          {/* Card 3: Employment Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Employment Details
              </h2>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Joined Date</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{formattedDate}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Leave Balance</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {getLeaveQuota(user?.role, user?.designation)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Work Location</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">Headquarters / Remote</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Role-Specific Workspace Widgets */}
        <RoleWidgets role={user?.role} designation={user?.designation} />
      </main>
      </div>
    </div>
  );
};

