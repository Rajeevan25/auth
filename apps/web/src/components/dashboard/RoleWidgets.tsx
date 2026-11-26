import React from 'react';
import {
  Activity,
  Briefcase,
  CalendarCheck,
  CheckSquare,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

interface WidgetItem {
  title: string;
  metric: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

const ROLE_WIDGETS: Record<string, WidgetItem[]> = {
  SUPER_ADMIN: [
    {
      title: 'System Health & Sessions',
      metric: '99.98% Uptime',
      subtitle: 'API & Auth Services Online',
      description: 'Monitor platform availability, active refresh tokens, and database latency across tenants.',
      icon: Activity,
      accentClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Organization Overview',
      metric: '13 Active Accounts',
      subtitle: '10 Roles • 4 Designations',
      description: 'View total headcount, active departments, and system-wide role distribution.',
      icon: Layers,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'User & Role Governance',
      metric: 'RBAC Enforced',
      subtitle: 'JWT + Guard Protected',
      description: 'Assign or update employee roles, designations, and department mappings.',
      icon: Users,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Security & Audit Logs',
      metric: '0 Locked Accounts',
      subtitle: '5-attempt lockout policy',
      description: 'Track failed login attempts, password resets, and token revocation events.',
      icon: ShieldAlert,
      accentClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    },
  ],
  ADMIN: [
    {
      title: 'Company Headcount',
      metric: '6 Departments',
      subtitle: 'Engineering, HR, Finance & Ops',
      description: 'Monitor workforce growth, active status, and department capacity.',
      icon: Users,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Role Distribution',
      metric: '10 Active Roles',
      subtitle: 'Managers, Leads & Staff',
      description: 'Review permissions across HR, Finance, and Department Managers.',
      icon: Layers,
      accentClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Pending Escalations',
      metric: '2 Items',
      subtitle: 'Cross-department approvals',
      description: 'Resolve overdue leave or policy escalations flagged by department heads.',
      icon: ShieldAlert,
      accentClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
  ],
  HR_MANAGER: [
    {
      title: 'Workforce Summary',
      metric: 'Active & Probation',
      subtitle: 'Full-time + Trainees',
      description: 'Track active headcount, employees on leave today, and trainee probation milestones.',
      icon: Users,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Pending HR Approvals',
      metric: '4 Requests',
      subtitle: 'Leave & Onboarding',
      description: 'Sign off on escalated leave requests and new-hire onboarding packets.',
      icon: ClipboardCheck,
      accentClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Payroll Readiness',
      metric: 'Attendance Sync',
      subtitle: 'Monthly Cut-off Check',
      description: 'Verify attendance and leave logs before handing off payroll to Finance.',
      icon: CalendarCheck,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Hiring Pipeline',
      metric: '3 Open Roles',
      subtitle: 'Recruitment Overview',
      description: 'Monitor active requisitions, interview stages, and pending offer approvals.',
      icon: Briefcase,
      accentClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400',
    },
  ],
  HR_EXECUTIVE: [
    {
      title: "Today's Attendance",
      metric: '94% Checked In',
      subtitle: 'On-site & Remote',
      description: 'Review daily clock-ins, late arrivals, and remote work check-ins.',
      icon: Clock,
      accentClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Leave Requests Queue',
      metric: '5 Pending',
      subtitle: 'Annual & Sick Leave',
      description: 'Process incoming employee leave applications and update balances.',
      icon: CalendarCheck,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Onboarding Checklist',
      metric: '2 New Joiners',
      subtitle: 'Document Verification',
      description: 'Track ID verification, contract signing, and orientation tasks for trainees/associates.',
      icon: UserCheck,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
  ],
  RECRUITER: [
    {
      title: 'Open Job Postings',
      metric: '4 Active Roles',
      subtitle: 'Engineering & Product',
      description: 'Manage live job descriptions and track inbound applicant volume.',
      icon: Briefcase,
      accentClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400',
    },
    {
      title: "Today's Interviews",
      metric: '3 Scheduled',
      subtitle: 'Technical & HR Rounds',
      description: 'Coordinate interviewer panels and collect post-interview scorecards.',
      icon: CalendarCheck,
      accentClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Candidate Pipeline',
      metric: '18 In Review',
      subtitle: 'Screening → Offer',
      description: 'Move candidates across stages from initial screening to final offer.',
      icon: UserPlus,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
  ],
  FINANCE_MANAGER: [
    {
      title: 'Monthly Payroll Summary',
      metric: 'Ready for Review',
      subtitle: 'Current Pay Cycle',
      description: 'Approve monthly salary disbursements, bonuses, and statutory deductions.',
      icon: DollarSign,
      accentClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Expense Claims Pending',
      metric: '6 Claims',
      subtitle: 'Travel & Equipment',
      description: 'Review and approve team reimbursement requests above standard limits.',
      icon: FileSpreadsheet,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Department Budget vs. Actual',
      metric: 'On Target',
      subtitle: 'Q4 Compensation',
      description: 'Compare department payroll spend against approved quarterly budgets.',
      icon: TrendingUp,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
  ],
  FINANCE_EXECUTIVE: [
    {
      title: 'Payroll Processing Queue',
      metric: 'Payslip Batch',
      subtitle: 'Monthly Generation',
      description: 'Generate and verify employee payslips, tax withholdings, and overtime.',
      icon: FileText,
      accentClass: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Expense Entries',
      metric: '12 Logged',
      subtitle: 'Reimbursement Queue',
      description: 'Validate submitted receipts and schedule approved payouts.',
      icon: FileSpreadsheet,
      accentClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
  ],
  MANAGER: [
    {
      title: 'My Team Overview',
      metric: 'Direct Reports',
      subtitle: 'Leads & Engineers',
      description: 'Check team availability, current sprint workload, and active assignments.',
      icon: Users,
      accentClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Team Leave Approvals',
      metric: '2 Pending',
      subtitle: 'Requires Manager Action',
      description: 'Approve or decline leave and WFH requests submitted by your direct reports.',
      icon: CalendarCheck,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Team KPIs & Performance',
      metric: 'Q4 Review Cycle',
      subtitle: 'Goal Tracking',
      description: 'Track quarterly objectives, 1:1 notes, and appraisal readiness.',
      icon: TrendingUp,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
  ],
  TEAM_LEAD: [
    {
      title: 'Team Task Board',
      metric: '8 Active Tasks',
      subtitle: 'Sprint Progress',
      description: 'Assign tasks across Senior, Junior, Associate, and Trainee team members.',
      icon: CheckSquare,
      accentClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    },
    {
      title: 'Daily Team Attendance',
      metric: 'All Checked In',
      subtitle: 'Shift: 9:00 AM – 5:00 PM',
      description: 'See who is working on-site, remote, or on scheduled leave today.',
      icon: Clock,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Escalations to Manager',
      metric: '0 Open',
      subtitle: 'Upward Requests',
      description: 'Raise resource, leave, or timeline requests directly to your Manager.',
      icon: TrendingUp,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
  ],
};

function getEmployeeWidgets(designation?: string | null): WidgetItem[] {
  const base: WidgetItem[] = [
    {
      title: 'Attendance & Clock-In',
      metric: 'Checked In',
      subtitle: 'Shift: 9:00 AM – 5:00 PM',
      description: 'Log daily work hours, breaks, and submit weekly timesheets.',
      icon: Clock,
      accentClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'My Payslips',
      metric: designation === 'TRAINEE' ? 'View-Only' : 'Latest Ready',
      subtitle: designation === 'TRAINEE' ? 'Stipend Statement' : 'Monthly Salary Slip',
      description:
        designation === 'TRAINEE'
          ? 'View your monthly trainee stipend statements and tax summary.'
          : 'Download monthly payslips and review tax deductions.',
      icon: FileText,
      accentClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
  ];

  const designationWidgetMap: Record<string, WidgetItem> = {
    SENIOR: {
      title: 'Mentorship & Reviews',
      metric: '24 Days Quota',
      subtitle: 'Senior IC • WFH Enabled',
      description: 'Mentor junior/trainee teammates, review timesheets, and manage flexible WFH days.',
      icon: GraduationCap,
      accentClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
    JUNIOR: {
      title: 'My Tasks & Goals',
      metric: '18 Days Quota',
      subtitle: 'Junior • WFH Enabled',
      description: 'Track assigned sprint tasks, skill milestones, and annual leave requests.',
      icon: CheckSquare,
      accentClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    ASSOCIATE: {
      title: 'Onboarding & Skill Path',
      metric: '15 Days Quota',
      subtitle: 'Associate • Limited WFH',
      description: 'Complete foundational team checklists and track first-year growth goals.',
      icon: ClipboardCheck,
      accentClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
    },
    TRAINEE: {
      title: 'Probation & Training Tracker',
      metric: '6 Days Quota',
      subtitle: 'Trainee • On-Site Required',
      description: 'Track probation milestones, assigned mentor check-ins, and training modules.',
      icon: GraduationCap,
      accentClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
  };

  const specific = designationWidgetMap[designation ?? 'JUNIOR'] ?? designationWidgetMap.JUNIOR;
  return [specific, ...base];
}

export function getLeaveQuota(role?: string, designation?: string | null): string {
  if (role === 'EMPLOYEE') {
    const quotaByDesignation: Record<string, number> = {
      SENIOR: 24,
      JUNIOR: 18,
      ASSOCIATE: 15,
      TRAINEE: 6,
    };
    const days = quotaByDesignation[designation ?? 'JUNIOR'] ?? 18;
    return `${days} Days / Year`;
  }
  return '24 Days / Year';
}

interface RoleWidgetsProps {
  role?: string;
  designation?: string | null;
}

export const RoleWidgets: React.FC<RoleWidgetsProps> = ({ role, designation }) => {
  const effectiveRole = role ?? 'EMPLOYEE';
  const widgets =
    effectiveRole === 'EMPLOYEE'
      ? getEmployeeWidgets(designation)
      : ROLE_WIDGETS[effectiveRole] ?? getEmployeeWidgets(designation);

  const formattedRole = effectiveRole
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            {formattedRole} Workspace Widgets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tailored tools and metrics for your{' '}
            {designation ? `${designation.toLowerCase()} ` : ''}
            {formattedRole.toLowerCase()} role
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <div
              key={widget.title}
              className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${widget.accentClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {widget.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {widget.subtitle}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shrink-0">
                  {widget.metric}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {widget.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
