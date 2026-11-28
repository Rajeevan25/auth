import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getDepartments, createDepartment, updateDepartment, deactivateDepartment, getUsers } from '../lib/hrm-api';
import type { Department } from '../types';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { Sidebar } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];

const deptSchema = z.object({
  name: z.string().min(2, 'Name required'),
  code: z.string().min(1, 'Code required').max(10, 'Max 10 chars').toUpperCase(),
  description: z.string().optional(),
  headId: z.string().optional().nullable(),
});
type DeptForm = z.infer<typeof deptSchema>;

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-slate-400';

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function DeptFormModal({
  dept,
  onClose,
}: {
  dept?: Department | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = Boolean(dept);

  const { data: activeUsers } = useQuery({
    queryKey: ['users-active'],
    queryFn: () => getUsers({ isActive: true, limit: 200 }).then((r) => r.data.users ?? []),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: {
      name: dept?.name ?? '',
      code: dept?.code ?? '',
      description: dept?.description ?? '',
      headId: dept?.headId ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: DeptForm) =>
      isEdit
        ? updateDepartment(dept!.id, { ...data, headId: data.headId || null })
        : createDepartment({ ...data, headId: data.headId || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      onClose();
    },
  });

  return (
    <Modal title={isEdit ? `Edit Department — ${dept?.name}` : 'Create Department'} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'}
          </div>
        )}
        <FormField label="Department Name *" error={errors.name?.message}>
          <input className={inputClass} {...register('name')} placeholder="e.g. Engineering" />
        </FormField>
        <FormField label="Code *" error={errors.code?.message}>
          <input className={inputClass} {...register('code')} placeholder="e.g. ENG" />
        </FormField>
        <FormField label="Description">
          <textarea rows={2} className={inputClass} {...register('description')} placeholder="Optional description" />
        </FormField>
        <FormField label="Department Head">
          <select className={inputClass} {...register('headId')}>
            <option value="">— None —</option>
            {activeUsers?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </FormField>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Department'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export const DepartmentsPage: React.FC = () => {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalDept, setModalDept] = useState<Department | null | undefined>(undefined); // undefined = closed
  const [deactivateTarget, setDeactivateTarget] = useState<Department | null>(null);

  const canManage = me ? MANAGE_ROLES.includes(me.role) : false;

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, search],
    queryFn: () =>
      getDepartments({ page, limit: 20, search: search || undefined }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      setDeactivateTarget(null);
    },
  });

  const depts = data?.departments ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNavbar onToggleSidebar={() => setIsSidebarOpen((p) => !p)} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Departments</h1>
              <p className="text-xs text-slate-500 mt-0.5">{meta?.total ?? 0} departments</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setModalDept(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Department
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search departments…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : depts.length === 0 ? (
              <div className="text-center py-20 text-sm text-slate-500">No departments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="text-left px-5 py-3 font-semibold">Name</th>
                      <th className="text-left px-5 py-3 font-semibold">Code</th>
                      <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Head</th>
                      <th className="text-left px-5 py-3 font-semibold">Members</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      {canManage && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {depts.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white text-xs">
                          {d.name}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {d.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-700 dark:text-slate-300">
                          {d.head?.name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {d._count?.users ?? 0}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            d.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setModalDept(d)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {d.isActive && (
                                <button
                                  type="button"
                                  onClick={() => setDeactivateTarget(d)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                                  title="Deactivate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              <span>Page {meta.page} of {meta.totalPages}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit modal: undefined = closed, null = create, Dept = edit */}
      {modalDept !== undefined && (
        <DeptFormModal dept={modalDept} onClose={() => setModalDept(undefined)} />
      )}

      {/* Deactivate confirmation */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeactivateTarget(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Deactivate Department?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to deactivate <strong>{deactivateTarget.name}</strong>? This will
              prevent new users from being assigned to it. Users already in the department are unaffected.
            </p>
            {deactivateMutation.isError && (
              <p className="text-xs text-red-500">
                {(deactivateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to deactivate'}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => deactivateMutation.mutate(deactivateTarget.id)}
                disabled={deactivateMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {deactivateMutation.isPending ? 'Deactivating…' : 'Yes, Deactivate'}
              </button>
              <button type="button" onClick={() => setDeactivateTarget(null)} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
