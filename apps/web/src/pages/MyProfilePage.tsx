import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  MapPin,
  PhoneCall,
  Briefcase,
  Edit2,
  Save,
  X,
  Camera,
} from 'lucide-react';
import { getMyProfile, updateMyProfile } from '../lib/hrm-api';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { Sidebar } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// ─── Schemas ─────────────────────────────────────────────────────────────────
const personalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional().nullable(),
  personalEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  avatarUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
});

const addressSchema = z.object({
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
});

const emergencySchema = z.object({
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

type PersonalForm = z.infer<typeof personalSchema>;
type AddressForm = z.infer<typeof addressSchema>;
type EmergencyForm = z.infer<typeof emergencySchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
        {value || <span className="text-slate-400 font-normal">—</span>}
      </dd>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-slate-400';

// ─── Main Page ────────────────────────────────────────────────────────────────
export const MyProfilePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editSection, setEditSection] = useState<'personal' | 'address' | 'emergency' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile().then((r) => r.data.user),
  });

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setEditSection(null);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const personalForm = useForm<PersonalForm>({ resolver: zodResolver(personalSchema) });
  const addressForm = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });
  const emergencyForm = useForm<EmergencyForm>({ resolver: zodResolver(emergencySchema) });

  const startEdit = (section: typeof editSection) => {
    if (!data) return;
    const p = data.profile;
    if (section === 'personal') {
      personalForm.reset({
        name: data.name,
        phone: p?.phone,
        personalEmail: p?.personalEmail,
        avatarUrl: p?.avatarUrl,
        dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        gender: p?.gender,
        maritalStatus: p?.maritalStatus,
      });
    } else if (section === 'address') {
      addressForm.reset({
        address: p?.address,
        city: p?.city,
        state: p?.state,
        country: p?.country,
        postalCode: p?.postalCode,
      });
    } else {
      emergencyForm.reset({
        emergencyContactName: p?.emergencyContactName,
        emergencyContactPhone: p?.emergencyContactPhone,
        emergencyContactRelation: p?.emergencyContactRelation,
      });
    }
    setEditSection(section);
  };

  const cancelEdit = () => setEditSection(null);

  const submitPersonal = personalForm.handleSubmit((values) =>
    mutation.mutate(values as Parameters<typeof updateMyProfile>[0]),
  );
  const submitAddress = addressForm.handleSubmit((values) =>
    mutation.mutate(values as Parameters<typeof updateMyProfile>[0]),
  );
  const submitEmergency = emergencyForm.handleSubmit((values) =>
    mutation.mutate(values as Parameters<typeof updateMyProfile>[0]),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-red-500">Failed to load profile.</p>
      </div>
    );
  }

  const p = data.profile;

  const EditBtn = ({ section }: { section: typeof editSection }) => (
    <button
      type="button"
      onClick={() => startEdit(section)}
      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition"
    >
      <Edit2 className="w-3.5 h-3.5" />
      Edit
    </button>
  );

  const SaveCancelBtns = ({
    onSave,
    isLoading: saving,
  }: {
    onSave: () => void;
    isLoading?: boolean;
  }) => (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition disabled:opacity-60"
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      <button
        type="button"
        onClick={cancelEdit}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <X className="w-3.5 h-3.5" />
        Cancel
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNavbar onToggleSidebar={() => setIsSidebarOpen((p) => !p)} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6">
          {/* Page header + avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {p?.avatarUrl ? (
                <img
                  src={p.avatarUrl}
                  alt={data.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-200 dark:border-brand-800 shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold shadow">
                  {data.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{data.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {p?.employeeCode || data.email} ·{' '}
                <span className="text-brand-600 dark:text-brand-400 font-semibold">{data.role}</span>
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              {successMsg}
            </div>
          )}

          {mutation.isError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Failed to save. Please try again.'}
            </div>
          )}

          {/* ── Personal Info ───────────────────────────────────────────── */}
          <SectionCard title="Personal Information" icon={User}>
            <div className="flex items-center">
              <span className="text-xs text-slate-500">Your personal details</span>
              {editSection !== 'personal' && <EditBtn section="personal" />}
            </div>

            {editSection === 'personal' ? (
              <form onSubmit={submitPersonal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" error={personalForm.formState.errors.name?.message}>
                  <input className={inputClass} {...personalForm.register('name')} placeholder="Full name" />
                </FormField>
                <FormField label="Phone" error={personalForm.formState.errors.phone?.message}>
                  <input className={inputClass} {...personalForm.register('phone')} placeholder="+91 9876543210" />
                </FormField>
                <FormField label="Personal Email" error={personalForm.formState.errors.personalEmail?.message}>
                  <input className={inputClass} {...personalForm.register('personalEmail')} placeholder="personal@email.com" />
                </FormField>
                <FormField label="Date of Birth">
                  <input type="date" className={inputClass} {...personalForm.register('dateOfBirth')} />
                </FormField>
                <FormField label="Gender">
                  <select className={inputClass} {...personalForm.register('gender')}>
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </FormField>
                <FormField label="Marital Status">
                  <select className={inputClass} {...personalForm.register('maritalStatus')}>
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Avatar URL" error={personalForm.formState.errors.avatarUrl?.message}>
                    <input className={inputClass} {...personalForm.register('avatarUrl')} placeholder="https://..." />
                  </FormField>
                </div>
                <div className="sm:col-span-2">
                  <SaveCancelBtns onSave={submitPersonal} isLoading={mutation.isPending} />
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <ReadOnlyField label="Full Name" value={data.name} />
                <ReadOnlyField label="Phone" value={p?.phone} />
                <ReadOnlyField label="Personal Email" value={p?.personalEmail} />
                <ReadOnlyField label="Date of Birth" value={p?.dateOfBirth?.slice(0, 10)} />
                <ReadOnlyField label="Gender" value={p?.gender} />
                <ReadOnlyField label="Marital Status" value={p?.maritalStatus} />
              </dl>
            )}
          </SectionCard>

          {/* ── Address ─────────────────────────────────────────────────── */}
          <SectionCard title="Address" icon={MapPin}>
            <div className="flex items-center">
              <span className="text-xs text-slate-500">Your residential address</span>
              {editSection !== 'address' && <EditBtn section="address" />}
            </div>

            {editSection === 'address' ? (
              <form onSubmit={submitAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormField label="Street Address">
                    <input className={inputClass} {...addressForm.register('address')} placeholder="123 Main St" />
                  </FormField>
                </div>
                <FormField label="City">
                  <input className={inputClass} {...addressForm.register('city')} placeholder="City" />
                </FormField>
                <FormField label="State / Province">
                  <input className={inputClass} {...addressForm.register('state')} placeholder="State" />
                </FormField>
                <FormField label="Country">
                  <input className={inputClass} {...addressForm.register('country')} placeholder="Country" />
                </FormField>
                <FormField label="Postal Code">
                  <input className={inputClass} {...addressForm.register('postalCode')} placeholder="PIN / ZIP" />
                </FormField>
                <div className="sm:col-span-2">
                  <SaveCancelBtns onSave={submitAddress} isLoading={mutation.isPending} />
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <ReadOnlyField label="Street" value={p?.address} />
                <ReadOnlyField label="City" value={p?.city} />
                <ReadOnlyField label="State" value={p?.state} />
                <ReadOnlyField label="Country" value={p?.country} />
                <ReadOnlyField label="Postal Code" value={p?.postalCode} />
              </dl>
            )}
          </SectionCard>

          {/* ── Emergency Contact ────────────────────────────────────────── */}
          <SectionCard title="Emergency Contact" icon={PhoneCall}>
            <div className="flex items-center">
              <span className="text-xs text-slate-500">Who to contact in an emergency</span>
              {editSection !== 'emergency' && <EditBtn section="emergency" />}
            </div>

            {editSection === 'emergency' ? (
              <form onSubmit={submitEmergency} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Contact Name">
                  <input className={inputClass} {...emergencyForm.register('emergencyContactName')} placeholder="Contact name" />
                </FormField>
                <FormField label="Contact Phone">
                  <input className={inputClass} {...emergencyForm.register('emergencyContactPhone')} placeholder="+91 9876543210" />
                </FormField>
                <FormField label="Relationship">
                  <input className={inputClass} {...emergencyForm.register('emergencyContactRelation')} placeholder="e.g. Spouse, Parent" />
                </FormField>
                <div className="sm:col-span-2">
                  <SaveCancelBtns onSave={submitEmergency} isLoading={mutation.isPending} />
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <ReadOnlyField label="Name" value={p?.emergencyContactName} />
                <ReadOnlyField label="Phone" value={p?.emergencyContactPhone} />
                <ReadOnlyField label="Relationship" value={p?.emergencyContactRelation} />
              </dl>
            )}
          </SectionCard>

          {/* ── Work Info (Read-only) ────────────────────────────────────── */}
          <SectionCard title="Work Information" icon={Briefcase}>
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              These fields are managed by HR. Contact your HR team to update org details.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <ReadOnlyField label="Employee Code" value={p?.employeeCode} />
              <ReadOnlyField label="Employment Type" value={p?.employmentType} />
              <ReadOnlyField label="Joining Date" value={p?.joiningDate?.slice(0, 10)} />
              <ReadOnlyField label="Work Location" value={p?.workLocation} />
              <ReadOnlyField label="Department" value={data.department?.name} />
              <ReadOnlyField label="Designation" value={data.designation?.name} />
              <ReadOnlyField
                label="Manager"
                value={data.manager ? `${data.manager.name} (${data.manager.email})` : undefined}
              />
            </dl>
          </SectionCard>
        </main>
      </div>
    </div>
  );
};
