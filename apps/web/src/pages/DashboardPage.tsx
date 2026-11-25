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
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">Unassigned</dd>
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
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">15 Days Remaining</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Work Location</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">Headquarters / Remote</dd>
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
                HRM Modules & Quick Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Core human resource workflows available in your workspace
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-500" />
                1. Employee Directory
              </div>
              <p>
                Maintain centralized employee profiles, job titles, reporting managers, and department assignments in one searchable directory.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-500" />
                2. Attendance & Time Tracking
              </div>
              <p>
                Track daily clock-in and clock-out logs, shift schedules, and attendance summaries across teams.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-500" />
                3. Leave & Time-Off Management
              </div>
              <p>
                Submit leave requests, monitor remaining annual and sick leave balances, and streamline manager approvals.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                4. Role-Based Access Control
              </div>
              <p>
                Protect sensitive HR and payroll data with role-based permissions for Admins, HR Managers, Team Leads, and Employees.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

