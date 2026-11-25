
import React from 'react';
import {
  Users,
  CalendarDays,
  Wallet,
  Building2,
  BriefcaseBusiness,
  ShieldCheck,
  ChartNoAxesCombined,
} from 'lucide-react';

import { DarkModeToggle } from '../common/DarkModeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden">

      {/* LEFT: HRM BRANDING PANEL */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white flex-col justify-between p-10 xl:p-14 overflow-hidden select-none">

        {/* Background Decorations */}
        <div className="absolute top-0 -left-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute top-1/2 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER: LOGO */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-inner">
            <Building2 className="w-7 h-7 text-blue-300" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              PeopleHub HRM
            </h1>

            <p className="text-xs text-blue-200">
              Complete Workforce Management Platform
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-8">

          {/* HEADING */}
          <div className="text-center space-y-5 mb-8">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Empowering Modern Workplaces
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Everything Your Workforce Needs, In One Platform.
            </h2>

            <p className="text-sm text-blue-200 leading-relaxed max-w-lg mx-auto">
              Simplify employee management, streamline HR operations,
              automate everyday processes, and make smarter workforce
              decisions with one centralized HR management platform.
            </p>

          </div>

          {/* HRM FEATURES: TWO COLUMN GRID */}
          <div className="grid grid-cols-2 gap-3 xl:gap-4">

            {/* EMPLOYEE MANAGEMENT */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-blue-300">
                <Users className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Employee Management
                </h3>

                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Employee profiles, departments, designations and organization structures.
                </p>
              </div>
            </div>

            {/* ATTENDANCE & LEAVE */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-blue-300">
                <CalendarDays className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Attendance & Leave
                </h3>

                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Working hours, shifts, attendance and leave approvals.
                </p>
              </div>
            </div>

            {/* PAYROLL */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-blue-300">
                <Wallet className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Payroll Management
                </h3>

                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Salary structures, allowances, deductions and payslips.
                </p>
              </div>
            </div>

            {/* PERFORMANCE */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-blue-300">
                <ChartNoAxesCombined className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Performance Analytics
                </h3>

                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Employee performance, productivity and workforce insights.
                </p>
              </div>
            </div>

            {/* RECRUITMENT */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-blue-300">
                <BriefcaseBusiness className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Recruitment & Onboarding
                </h3>

                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Hiring workflows, candidate management and onboarding.
                </p>
              </div>
            </div>

            {/* SECURITY */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-white/10 border border-white/10 shrink-0 text-blue-300">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Secure HR Operations
                </h3>

                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Role-based access, permissions and protected employee data.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-blue-200">
          <span>One Platform. Every Employee.</span>
          <span>People • Process • Performance</span>
        </div>

      </div>

      {/* RIGHT: AUTHENTICATION PANEL */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative">

        {/* TOP BAR */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">

          {/* MOBILE LOGO */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>

            <span className="font-bold text-slate-900 dark:text-white text-base">
              PeopleHub HRM
            </span>
          </div>

          {/* DARK MODE */}
          <div className="ml-auto">
            <DarkModeToggle />
          </div>

        </div>

        {/* AUTHENTICATION FORM */}
        <div className="w-full max-w-md mx-auto my-auto py-8">

          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {title}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {/* FORM CARD */}
          <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
            {children}
          </div>

          {/* SECURITY INFORMATION */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />

            Secure Employee & Organization Management
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
          © {new Date().getFullYear()} PeopleHub HRM. All rights reserved.
        </div>

      </div>

    </div>
  );
};
