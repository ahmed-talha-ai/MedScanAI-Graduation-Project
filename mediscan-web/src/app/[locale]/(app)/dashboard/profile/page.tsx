'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { patientService } from '@/services/patientService';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type {
  PatientProfileResponse,
  PatientHistoryItem,
  UpdatePatientProfilePayload,
  AddMedicalHistoryPayload,
  DeleteMedicalHistoryPayload,
} from '@/types/api';
import { staggerDelay } from '@/lib/animations';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { useTranslations } from 'next-intl';

// ─── Pill tag component ────────────────────────────────────────────────────────
function PillTag({
  item,
  colorClass,
  onDelete,
  deleting,
  index,
}: {
  item: PatientHistoryItem;
  colorClass: string;
  onDelete: (id: number) => void;
  deleting: boolean;
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${colorClass} transition-all duration-300 ease-out ${mounted ? 'anim-scale-in opacity-100' : 'anim-scale opacity-0'} ${deleting ? '!opacity-0 !scale-50' : ''}`}
      style={{ transitionDelay: staggerDelay(index, 40) }}
    >
      {item.name}
      <button
        onClick={() => onDelete(item.id)}
        disabled={deleting}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors disabled:opacity-50 flex-shrink-0"
        aria-label={`Remove ${item.name}`}
      >
        {deleting ? (
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-xs leading-none" style={{ fontSize: '14px' }}>close</span>
        )}
      </button>
    </span>
  );
}

// ─── Add pill inline input ─────────────────────────────────────────────────────
function AddPillInput({
  placeholder,
  onAdd,
  adding,
}: {
  placeholder: string;
  onAdd: (name: string) => void;
  adding: boolean;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="inline-flex items-center gap-2 mt-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={adding}
        className="bg-surface-container-high border-none rounded-full px-4 py-1.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all w-48 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={adding || !value.trim()}
        className="w-7 h-7 rounded-full signature-gradient text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0"
      >
        {adding ? (
          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
        )}
      </button>
    </form>
  );
}

// ─── History section ───────────────────────────────────────────────────────────
function HistorySection({
  title,
  icon,
  items,
  colorClass,
  emptyText,
  addPlaceholder,
  onAdd,
  onDelete,
  addingItem,
  deletingId,
}: {
  title: string;
  icon: string;
  items: PatientHistoryItem[];
  colorClass: string;
  emptyText: string;
  addPlaceholder: string;
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  addingItem: boolean;
  deletingId: number | null;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h3 className="font-bold text-on-surface">{title}</h3>
        <span className="ms-auto text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {items.length === 0 && (
          <span className="text-sm text-on-surface-variant italic">{emptyText}</span>
        )}
        {items.map((item, idx) => (
          <PillTag
            key={item.id}
            item={item}
            colorClass={colorClass}
            onDelete={onDelete}
            deleting={deletingId === item.id}
            index={idx}
          />
        ))}
      </div>

      <AddPillInput
        placeholder={addPlaceholder}
        onAdd={onAdd}
        adding={addingItem}
      />
    </div>
  );
}

// ─── Edit profile form ─────────────────────────────────────────────────────────
function EditProfileForm({
  profile,
  onSave,
  onCancel,
  saving,
}: {
  profile: PatientProfileResponse;
  onSave: (payload: UpdatePatientProfilePayload) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const t = useTranslations('profile');
  const [form, setForm] = useState({
    fullName: profile.fullName ?? '',
    email: profile.email ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    gender: profile.gender ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    bloodType: profile.bloodType ?? '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: profile.id, ...form });
  };

  const inputCls = 'w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all';
  const labelCls = 'block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: t('fullName'), field: 'fullName', type: 'text', placeholder: t('fullName') },
          { label: t('email'), field: 'email', type: 'email', placeholder: t('email') },
          { label: t('phoneNumber'), field: 'phoneNumber', type: 'text', placeholder: t('phone') },
        ].map((f, i) => (
          <div key={f.field} className={`transition-all duration-500 ease-out anim-left-in`} style={{ transitionDelay: staggerDelay(i, 60) }}>
            <label className={labelCls}>{f.label}</label>
            <input type={f.type} value={form[f.field as keyof typeof form]} onChange={set(f.field)} className={inputCls} placeholder={f.placeholder} />
          </div>
        ))}
        <div className={`transition-all duration-500 ease-out anim-left-in`} style={{ transitionDelay: staggerDelay(3, 60) }}>
          <label className={labelCls}>{t('gender')}</label>
          <select value={form.gender} onChange={set('gender')} className={inputCls}>
            <option value="">{t('selectGender')}</option>
            <option value="Male">{t('male')}</option>
            <option value="Female">{t('female')}</option>
          </select>
        </div>
        <div className={`transition-all duration-500 ease-out anim-left-in`} style={{ transitionDelay: staggerDelay(4, 60) }}>
          <label className={labelCls}>{t('dateOfBirth')}</label>
          <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} />
        </div>
        <div className={`transition-all duration-500 ease-out anim-left-in`} style={{ transitionDelay: staggerDelay(5, 60) }}>
          <label className={labelCls}>{t('bloodType', { fallback: 'Blood Type' })}</label>
          <select value={form.bloodType} onChange={set('bloodType')} className={inputCls}>
            <option value="">{t('bloodTypePlaceholder', { fallback: 'Select blood type' })}</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {t('saveChanges')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2.5 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-all disabled:opacity-50"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuthStore();
  const t = useTranslations('profile');
  const tApp = useTranslations('app');

  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  // Per-section adding/deleting state
  const [addingAllergy, setAddingAllergy]     = useState(false);
  const [addingDisease, setAddingDisease]     = useState(false);
  const [addingMed, setAddingMed]             = useState(false);
  const [addingFamily, setAddingFamily]       = useState(false);
  const [deletingId, setDeletingId]           = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfile = async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await patientService.getProfile(user.userId);
      if (res.succeeded && res.data) setProfile(res.data);
      else setError(res.message || tApp('failedLoad'));
    } catch {
      setError(tApp('networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => { await loadProfile(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveProfile = async (payload: UpdatePatientProfilePayload) => {
    setSaving(true);
    try {
      const res = await patientService.updateProfile(payload);
      if (res.succeeded) {
        await loadProfile();
        setEditing(false);
        showToast(t('profileUpdated'));
      } else {
        showToast(res.message || tApp('failedAction'));
      }
    } catch {
      showToast(tApp('networkError'));
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (
    type: 'allergy' | 'disease' | 'medication' | 'family',
    name: string,
    setAdding: (v: boolean) => void
  ) => {
    if (!user?.userId || !profile) return;
    setAdding(true);
    const payload: AddMedicalHistoryPayload = { patientId: user.userId, name };
    try {
      const res = type === 'allergy'
        ? await patientService.addAllergy(payload)
        : type === 'disease'
        ? await patientService.addChronicDisease(payload)
        : type === 'medication'
        ? await patientService.addMedication(payload)
        : await patientService.addFamilyHistory(payload);
      if (res.succeeded) { await loadProfile(); showToast(t('addedSuccessfully')); }
      else showToast(res.message || tApp('failedAction'));
    } catch {
      showToast(tApp('networkError'));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (
    type: 'allergy' | 'disease' | 'medication' | 'family',
    id: number
  ) => {
    setDeletingId(id);
    const payload: DeleteMedicalHistoryPayload = { id };
    try {
      const res = type === 'allergy'
        ? await patientService.deleteAllergy(payload)
        : type === 'disease'
        ? await patientService.deleteChronicDisease(payload)
        : type === 'medication'
        ? await patientService.deleteMedication(payload)
        : await patientService.deleteFamilyHistory(payload);
      if (res.succeeded) { await loadProfile(); }
      else showToast(res.message || tApp('failedAction'));
    } catch {
      showToast(tApp('networkError'));
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in-up relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 end-6 z-50 bg-primary text-white px-5 py-3 rounded-full text-sm font-semibold ambient-shadow animate-fade-in-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
        <p className="text-on-surface-variant mt-1">{t('subtitle')}</p>
      </section>

      {/* Loading / error */}
      {loading && (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => void (async () => { await loadProfile(); })()}  />
      )}

      {/* Profile card */}
      {!loading && !error && profile && (
        <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border relative overflow-hidden">
          <div className="absolute top-0 start-0 end-0 h-1 signature-gradient" />

          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full signature-gradient flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-3xl">person</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">{profile.fullName}</h2>
                <p className="text-sm text-on-surface-variant">{profile.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t('patient')}
                </span>
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-all"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                {t('editProfile')}
              </button>
            )}
          </div>

          {/* Info grid */}
          {!editing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('phone'), value: profile.phoneNumber || '—', icon: 'phone' },
                { label: t('gender'), value: profile.gender === 'Male' ? t('male') : (profile.gender === 'Female' ? t('female') : '—'), icon: 'person' },
                { label: t('dateOfBirth'), value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB') : '—', icon: 'cake' },
                { label: t('bloodType', { fallback: 'Blood Type' }), value: profile.bloodType || '—', icon: 'bloodtype' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-surface-container-low rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                    <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="font-semibold text-on-surface text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <EditProfileForm
              profile={profile}
              onSave={(p) => void (async () => { await handleSaveProfile(p); })()}
              onCancel={() => setEditing(false)}
              saving={saving}
            />
          )}
        </div>
      )}

      {/* Medical History */}
      {!loading && !error && profile && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">medical_information</span>
            {t('medicalHistory')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealOnScroll direction="left" delay={0}>
              <HistorySection
                title={t('chronicDiseases')}
                icon="health_and_safety"
                items={profile.chronicDiseases || []}
                colorClass="bg-secondary/10 text-secondary"
                emptyText={t('noChronicDiseases')}
                addPlaceholder={t('addDiseasePlaceholder')}
                onAdd={(name) => void (async () => { await handleAdd('disease', name, setAddingDisease); })()}
                onDelete={(id) => void (async () => { await handleDelete('disease', id); })()}
                addingItem={addingDisease}
                deletingId={deletingId}
              />
            </RevealOnScroll>

            <RevealOnScroll direction="up" delay={0}>
              <HistorySection
                title={t('familyHistory', { fallback: 'Family History' })}
                icon="family_history"
                items={profile.familyHistory || []}
                colorClass="bg-tertiary/10 text-tertiary"
                emptyText={t('noChronicDiseases', { fallback: 'No family history added' })}
                addPlaceholder={t('addDiseasePlaceholder')}
                onAdd={(name) => void (async () => { await handleAdd('family', name, setAddingFamily); })()}
                onDelete={(id) => void (async () => { await handleDelete('family', id); })()}
                addingItem={addingFamily}
                deletingId={deletingId}
              />
            </RevealOnScroll>

            <RevealOnScroll direction="up" delay={0}>
              <HistorySection
                title={t('allergies')}
                icon="warning"
                items={profile.allergies || []}
                colorClass="bg-error-container text-error"
                emptyText={t('noAllergies')}
                addPlaceholder={t('addAllergyPlaceholder')}
                onAdd={(name) => void (async () => { await handleAdd('allergy', name, setAddingAllergy); })()}
                onDelete={(id) => void (async () => { await handleDelete('allergy', id); })()}
                addingItem={addingAllergy}
                deletingId={deletingId}
              />
            </RevealOnScroll>

            <RevealOnScroll direction="right" delay={0}>
              <HistorySection
                title={t('medications')}
                icon="medication"
                items={profile.currentMedication || []}
                colorClass="bg-primary/10 text-primary"
                emptyText={t('noMedications')}
                addPlaceholder={t('addMedicationPlaceholder')}
                onAdd={(name) => void (async () => { await handleAdd('medication', name, setAddingMed); })()}
                onDelete={(id) => void (async () => { await handleDelete('medication', id); })()}
                addingItem={addingMed}
                deletingId={deletingId}
              />
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* Quick Stats */}
      {!loading && !error && profile && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('chronicDiseases'), count: (profile.chronicDiseases || []).length, icon: 'health_and_safety', color: 'text-secondary' },
            { label: t('allergies'), count: (profile.allergies || []).length, icon: 'warning', color: 'text-error' },
            { label: t('medications'), count: (profile.currentMedication || []).length, icon: 'medication', color: 'text-primary' },
            { label: t('familyHistory', { fallback: 'Family History' }), count: (profile.familyHistory || []).length, icon: 'family_history', color: 'text-tertiary' },
          ].map(({ label, count, icon, color }) => (
            <div key={label} className="bg-surface-container-lowest rounded-lg p-5 ambient-shadow ghost-border text-center">
              <span className={`material-symbols-outlined text-3xl ${color} mb-2`}>{icon}</span>
              <p className="text-3xl font-extrabold text-on-surface">{count}</p>
              <p className="text-xs text-on-surface-variant mt-1 font-medium">{label}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
