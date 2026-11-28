import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Plus,
  Edit2,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  CheckCircle,
} from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUserOrg,
  updateUserStatus,
  getDepartments,
  getDesignations,
  getAssignableRoles,
} from '../lib/hrm-api';
import type { User, UserRole } from '../types';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { Sidebar } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  ADMIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  HR_MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  HR_EXECUTIVE: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  RECRUITER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
  FINANCE_MANAGER: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300',
  FINANCE_EXECUTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  MANAGER: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
  TEAM_LEAD: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  EMPLOYEE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-slate-400';

// ─── Create User Schema ───────────────────────────────────────────────────────
const createUserSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid work email'),
  personalEmail: z.string().email('Invalid personal email').optional().or(z.literal('')),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 8 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val)),
      'Min 8 chars with uppercase, lowercase, and number',
    ),
  role: z.string().min(1, 'Role required') as z.ZodType<UserRole>,
  departmentId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  employeeCode: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

// ─── Edit Org Schema ──────────────────────────────────────────────────────────
const editOrgSchema = z.object({
  role: z.string().optional() as z.ZodType<UserRole | undefined>,
  departmentId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
});
type EditOrgForm = z.infer<typeof editOrgSchema>;

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [showPass, setShowPass] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    tempPassword: string;
    inviteSent: boolean;
    sentTo: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: depts } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => getDepartments({ isActive: true, limit: 100 }).then((r) => r.data.departments),
  });
  const { data: desigs } = useQuery({
    queryKey: ['designations-all'],
    queryFn: () => getDesignations({ isActive: true, limit: 100 }).then((r) => r.data.designations),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles-assignable'],
    queryFn: () => getAssignableRoles().then((r) => r.data.roles),
  });

  const { data: managers } = useQuery({
    queryKey: ['users-managers'],
    queryFn: () => getUsers({ isActive: true, limit: 100 }).then((r) => r.data.users ?? []),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });

  const mutation = useMutation({
    mutationFn: (data: CreateUserForm) => {
      const profile: Record<string, string> = {};
      if (data.employeeCode) profile.employeeCode = data.employeeCode;
      if (data.personalEmail) profile.personalEmail = data.personalEmail;

      return createUser({
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        role: data.role,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        managerId: data.managerId || null,
        profile: Object.keys(profile).length > 0 ? profile : undefined,
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreatedResult({
        tempPassword: res.data.tempPassword,
        inviteSent: res.data.inviteSent,
        sentTo: res.data.sentTo,
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdResult) {
    return (
      <Modal title="User Created Successfully" onClose={onClose}>
        <div className="space-y-4">
          {createdResult.inviteSent ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Invite email sent to {createdResult.sentTo}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    The employee received their username and temporary password, and will be forced
                    to change it on first login.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Email could not be sent — share this temporary password manually
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    They will be forced to change it on first login.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-sm">
            <span className="flex-1 break-all">{createdResult.tempPassword}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(createdResult.tempPassword)}
              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Create New Employee" onClose={onClose}>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {mutation.isError && (
          <div className="sm:col-span-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Failed to create user'}
          </div>
        )}

        <FormField label="Full Name *" error={errors.name?.message}>
          <input className={inputClass} {...register('name')} placeholder="John Doe" />
        </FormField>
        <FormField label="Work Email (Login) *" error={errors.email?.message}>
          <input className={inputClass} {...register('email')} placeholder="john@company.com" />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Personal Email (for Invite)" error={errors.personalEmail?.message}>
            <input
              className={inputClass}
              {...register('personalEmail')}
              placeholder="john.personal@gmail.com (falls back to Work Email if blank)"
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField label="Temporary Password (optional)" error={errors.password?.message}>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={`${inputClass} pr-10`}
                {...register('password')}
                placeholder="Leave blank to auto-generate a secure password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
        </div>

        <FormField label="Role *" error={errors.role?.message}>
          <select className={inputClass} {...register('role')}>
            <option value="">Select role</option>
            {roles?.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Employee Code">
          <input className={inputClass} {...register('employeeCode')} placeholder="EMP-014" />
        </FormField>

        <FormField label="Department">
          <select className={inputClass} {...register('departmentId')}>
            <option value="">— None —</option>
            {depts?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Designation">
          <select className={inputClass} {...register('designationId')}>
            <option value="">— None —</option>
            {desigs?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (L{d.level})
              </option>
            ))}
          </select>
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Manager">
            <select className={inputClass} {...register('managerId')}>
              <option value="">— None —</option>
              {managers?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="sm:col-span-2 flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {mutation.isPending ? 'Creating…' : 'Create Employee'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Edit Org Modal ───────────────────────────────────────────────────────────
function EditOrgModal({ user: target, onClose }: { user: User; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: depts } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => getDepartments({ isActive: true, limit: 100 }).then((r) => r.data.departments),
  });
  const { data: desigs } = useQuery({
    queryKey: ['designations-all'],
    queryFn: () => getDesignations({ isActive: true, limit: 100 }).then((r) => r.data.designations),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles-assignable'],
    queryFn: () => getAssignableRoles().then((r) => r.data.roles),
  });
  const { data: managers } = useQuery({
    queryKey: ['users-managers'],
    queryFn: () => getUsers({ isActive: true, limit: 100 }).then((r) => r.data.users ?? []),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditOrgForm>({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      role: target.role,
      departmentId: target.departmentId,
      designationId: target.designationId,
      managerId: target.managerId,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditOrgForm) => updateUserOrg(target.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <Modal title={`Edit Org Placement — ${target.name}`} onClose={onClose}>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {mutation.isError && (
          <div className="sm:col-span-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Failed to update'}
          </div>
        )}

        <div className="sm:col-span-2">
          <FormField label="Role" error={errors.role?.message}>
            <select className={inputClass} {...register('role')}>
              <option value="">Select role</option>
              {roles?.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Department">
          <select className={inputClass} {...register('departmentId')}>
            <option value="">— None —</option>
            {depts?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Designation">
          <select className={inputClass} {...register('designationId')}>
            <option value="">— None —</option>
            {desigs?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (L{d.level})
              </option>
            ))}
          </select>
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Manager">
            <select className={inputClass} {...register('managerId')}>
              <option value="">— None —</option>
              {managers?.filter((u) => u.id !== target.id).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="sm:col-span-2 flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterDept, setFilterDept] = useState('');
  const [filterDesig, setFilterDesig] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editOrgUser, setEditOrgUser] = useState<User | null>(null);

  const isAdmin = me ? ADMIN_ROLES.includes(me.role) : false;

  const { data: depts } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => getDepartments({ isActive: true, limit: 100 }).then((r) => r.data.departments),
  });
  const { data: desigs } = useQuery({
    queryKey: ['designations-all'],
    queryFn: () => getDesignations({ isActive: true, limit: 100 }).then((r) => r.data.designations),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, filterRole, filterDept, filterDesig, filterActive],
    queryFn: () =>
      getUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: filterRole || undefined,
        departmentId: filterDept || undefined,
        designationId: filterDesig || undefined,
        isActive: filterActive,
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { isActive?: boolean; unlockAccount?: boolean } }) =>
      updateUserStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const users = data?.users ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNavbar onToggleSidebar={() => setIsSidebarOpen((p) => !p)} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Employees</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {meta?.total ?? 0} total employees
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Search by name, email or code…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value as UserRole | ''); setPage(1); }}
            >
              <option value="">All Roles</option>
              {(['SUPER_ADMIN','ADMIN','HR_MANAGER','HR_EXECUTIVE','RECRUITER','FINANCE_MANAGER','FINANCE_EXECUTIVE','MANAGER','TEAM_LEAD','EMPLOYEE'] as UserRole[]).map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
            >
              <option value="">All Departments</option>
              {depts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={filterDesig}
              onChange={(e) => { setFilterDesig(e.target.value); setPage(1); }}
            >
              <option value="">All Designations</option>
              {desigs?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={filterActive === undefined ? '' : String(filterActive)}
              onChange={(e) => {
                const v = e.target.value;
                setFilterActive(v === '' ? undefined : v === 'true');
                setPage(1);
              }}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
              <option value="">All Status</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-sm text-slate-500">No employees found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="text-left px-5 py-3 font-semibold">Employee</th>
                      <th className="text-left px-5 py-3 font-semibold">Role</th>
                      <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Department</th>
                      <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Designation</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      {isAdmin && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
                              {u.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-xs">{u.name}</p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                              {u.profile?.employeeCode && (
                                <p className="text-[10px] text-slate-400 font-mono">{u.profile.employeeCode}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[u.role] ?? ''}`}>
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-700 dark:text-slate-300">
                          {u.department?.name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell text-xs text-slate-700 dark:text-slate-300">
                          {u.designation?.name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                u.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              }`}
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                              <span title="Account locked">
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditOrgUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition"
                                title="Edit org placement"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    statusMutation.mutate({ id: u.id, payload: { unlockAccount: true } })
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition"
                                  title="Unlock account"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {u.isActive ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    statusMutation.mutate({ id: u.id, payload: { isActive: false } })
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                                  title="Deactivate"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    statusMutation.mutate({ id: u.id, payload: { isActive: true } })
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                                  title="Activate"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {meta.page} of {meta.totalPages} · {meta.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editOrgUser && <EditOrgModal user={editOrgUser} onClose={() => setEditOrgUser(null)} />}
    </div>
  );
};
