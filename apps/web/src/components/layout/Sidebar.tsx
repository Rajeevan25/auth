import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Calendar,
  Clock,
  FileText,
  CheckSquare,
  Users,
  Briefcase,
  UserPlus,
  DollarSign,
  Receipt,
  TrendingUp,
  Shield,
  Settings,
  Building2,
  Award,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface SidebarSection {
  title: string;
  roles?: string[];
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'My Space',
    items: [
      { label: 'My Dashboard', to: '/employee/dashboard', icon: LayoutDashboard },
      { label: 'My Profile', to: '/profile', icon: User },
      { label: 'My Leave', to: '/employee/leave', icon: Calendar },
      { label: 'Timesheet', to: '/employee/timesheet', icon: Clock },
      { label: 'Payslips', to: '/employee/payslip', icon: FileText },
    ],
  },
  {
    title: 'Organization',
    items: [
      {
        label: 'Employees',
        to: '/users',
        icon: Users,
        roles: [
          'SUPER_ADMIN',
          'ADMIN',
          'HR_MANAGER',
          'HR_EXECUTIVE',
          'RECRUITER',
          'MANAGER',
          'TEAM_LEAD',
        ],
      },
      { label: 'Departments', to: '/departments', icon: Building2 },
      { label: 'Designations', to: '/designations', icon: Award },
    ],
  },
  {
    title: 'Team Lead',
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEAD'],
    items: [
      { label: 'Task Board', to: '/team-lead/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Manager',
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    items: [
      { label: 'My Team', to: '/manager/team', icon: Users },
      { label: 'Leave Approvals', to: '/manager/leave-approvals', icon: Calendar },
      { label: 'Team KPIs', to: '/manager/kpi', icon: TrendingUp },
    ],
  },
  {
    title: 'HR Management',
    roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'RECRUITER'],
    items: [
      {
        label: 'HR Overview',
        to: '/hr/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'],
      },
      {
        label: 'Employees',
        to: '/hr/employees',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'],
      },
      {
        label: 'Attendance',
        to: '/hr/attendance',
        icon: Clock,
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'],
      },
      {
        label: 'Leave Requests',
        to: '/hr/leave',
        icon: Calendar,
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'],
      },
      {
        label: 'Recruitment',
        to: '/hr/recruitment',
        icon: Briefcase,
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'RECRUITER'],
      },
      {
        label: 'Candidates',
        to: '/hr/candidates',
        icon: UserPlus,
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'RECRUITER'],
      },
    ],
  },
  {
    title: 'Finance',
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'FINANCE_EXECUTIVE'],
    items: [
      { label: 'Finance Overview', to: '/finance/dashboard', icon: DollarSign },
      { label: 'Payroll Run', to: '/finance/payroll', icon: FileText },
      { label: 'Expenses', to: '/finance/expenses', icon: Receipt },
    ],
  },
  {
    title: 'Administration',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Admin Console',
        to: '/admin/dashboard',
        icon: Shield,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Platform Settings',
        to: '/super-admin/dashboard',
        icon: Settings,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const userRole = user?.role ?? 'EMPLOYEE';

  const visibleSections = SIDEBAR_SECTIONS.filter(
    (section) => !section.roles || section.roles.includes(userRole),
  )
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(userRole),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const navContent = (
    <nav aria-label="Sidebar Navigation" className="p-4 space-y-6">
      {visibleSections.map((section) => (
        <div key={section.title}>
          <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-y-auto shadow-xl z-10">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Navigation
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation sidebar"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
