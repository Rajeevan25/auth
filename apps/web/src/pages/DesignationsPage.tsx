import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDesignations, createDesignation, updateDesignation, deactivateDesignation } from '../lib/hrm-api';
import type { Designation } from '../types';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { Sidebar } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];

const desigSchema = z.object({
  name: z.string().min(2, 'Name required'),
  code: z.string().min(1, 'Code required').max(20, 'Max 20 chars').toUpperCase(),
  level: z.coerce.number().int().min(1).max(20),
  leaveQuota: z.coerce.number().int().min(0).max(365),
  description: z.string().optional(),
});
type DesigForm = z.infer<typeof desigSchema>;

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

function DesigFormModal({ desig, onClose }: { desig?: Designation | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = Boolean(desig);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DesigForm>({
    resolver: zodResolver(desigSchema),
    defaultValues: {
      name: desig?.name ?? '',
      code: desig?.code ?? '',
      level: desig?.level ?? 1,
      leaveQuota: desig?.leaveQuota ?? 18,
      description: desig?.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: DesigForm) =>
      isEdit ? updateDesignation(desig!.id, data) : createDesignation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            {isEdit ? `Edit Designation — ${desig?.name}` : 'Create Designation'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          {mutation.isError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'}
            </div>
          )}
          <FormField label="Designation Name *" error={errors.name?.message}>
            <input className={inputClass} {...register('name')} placeholder="e.g. Senior Engineer" />
          </FormField>
          <FormField label="Code *" error={errors.code?.message}>
            <input className={inputClass} {...register('code')} placeholder="e.g. SEN_ENG" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Level (1–20) *" error={errors.level?.message}>
              <input type="number" min={1} max={20} className={inputClass} {...register('level')} />
            </FormField>
            <FormField label="Leave Quota (days) *" error={errors.leaveQuota?.message}>
              <input type="number" min={0} max={365} className={inputClass} {...register('leaveQuota')} />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea rows={2} className={inputClass} {...register('description')} placeholder="Optional" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Designation'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const DesignationsPage: React.FC = () => {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalDesig, setModalDesig] = useState<Designation | null | undefined>(undefined);
  const [deactivateTarget, setDeactivateTarget] = useState<Designation | null>(null);

  const canManage = me ? MANAGE_ROLES.includes(me.role) : false;

  const { data, isLoading } = useQuery({
    queryKey: ['designations', page, search],
    queryFn: () => getDesignations({ page, limit: 20, search: search || undefined }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateDesignation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      setDeactivateTarget(null);
    },
  });

  const desigs = data?.designations ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNavbar onToggleSidebar={() => setIsSidebarOpen((p) => !p)} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Designations</h1>
              <p className="text-xs text-slate-500 mt-0.5">{meta?.total ?? 0} designations</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setModalDesig(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Designation
              </button>
            )}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search designations…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : desigs.length === 0 ? (
              <div className="text-center py-20 text-sm text-slate-500">No designations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="text-left px-5 py-3 font-semibold">Name</th>
                      <th className="text-left px-5 py-3 font-semibold">Code</th>
                      <th className="text-left px-5 py-3 font-semibold">Level</th>
                      <th className="text-left px-5 py-3 font-semibold">Leave Quota</th>
                      <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Members</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      {canManage && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {desigs.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white text-xs">{d.name}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {d.code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            {d.level}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-700 dark:text-slate-300">
                          {d.leaveQuota} days
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-700 dark:text-slate-300">
                          {d._count?.users ?? 0}
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
                                onClick={() => setModalDesig(d)}
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

      {modalDesig !== undefined && (
        <DesigFormModal desig={modalDesig} onClose={() => setModalDesig(undefined)} />
      )}

      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeactivateTarget(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Deactivate Designation?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to deactivate <strong>{deactivateTarget.name}</strong>?
            </p>
            {deactivateMutation.isError && (
              <p className="text-xs text-red-500">
                {(deactivateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'}
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
