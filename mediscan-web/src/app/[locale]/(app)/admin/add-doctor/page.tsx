'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardHero } from '@/components/ui/DashboardHero';

// ─── Constants ────────────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  { id: 1, label: 'Dermatology — الأمراض الجلدية' },
  { id: 2, label: 'Neurology — طب الأعصاب' },
  { id: 3, label: 'Pulmonology — أمراض الصدر' },
];

const WORK_DAYS = [
  { value: 'saturday',  label: 'Saturday' },
  { value: 'sunday',    label: 'Sunday' },
  { value: 'monday',    label: 'Monday' },
  { value: 'tuesday',   label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday',  label: 'Thursday' },
  { value: 'friday',    label: 'Friday' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Convert "HH:mm" (from input type="time") to "HH:mm:ss" (TimeSpan) */
function toTimeSpan(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, error, delayIndex = 0 }: { label: string; children: React.ReactNode; error?: string; delayIndex?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);
  return (
    <div 
      className={`space-y-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}
      style={{ transitionDelay: staggerDelay(delayIndex, 60) }}
    >
      <label className="block text-sm font-semibold text-on-surface">{label}</label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all border border-transparent focus:border-primary/30';

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  yearsOfExperience: string;
  specializationId: string;
  workDays: string[];
  startTime: string;
  endTime: string;
}

const INITIAL: FormData = {
  fullName: '', email: '', password: '', phoneNumber: '',
  yearsOfExperience: '', specializationId: '', workDays: [],
  startTime: '', endTime: '',
};

type Errors = Partial<Record<keyof FormData | 'form', string>>;

function validate(form: FormData): Errors {
  const e: Errors = {};
  if (!form.fullName.trim() || form.fullName.trim().length < 3) e.fullName = 'Full name must be at least 3 characters';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
  if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
  if (!/[^a-zA-Z0-9]/.test(form.password)) e.password = 'Password must contain at least 1 symbol';
  if (!/[0-9]/.test(form.password)) e.password = 'Password must contain at least 1 number';
  if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required';
  const years = parseInt(form.yearsOfExperience, 10);
  if (isNaN(years) || years < 0) e.yearsOfExperience = 'Years of experience must be 0 or more';
  if (!form.specializationId) e.specializationId = 'Please select a specialization';
  if (form.workDays.length === 0) e.workDays = 'Select at least one working day';
  if (!form.startTime) e.startTime = 'Start time is required';
  if (!form.endTime) e.endTime = 'End time is required';
  if (form.startTime && form.endTime && form.startTime >= form.endTime) e.endTime = 'End time must be after start time';
  return e;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AddDoctorPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('addDoctor');

  const SPECIALIZATIONS = [
    { id: 1, label: t('specDermatology') },
    { id: 2, label: t('specNeurology') },
    { id: 3, label: t('specPulmonology') },
  ];

  const WORK_DAYS = [
    { value: 'saturday',  label: t('daySaturday') },
    { value: 'sunday',    label: t('daySunday') },
    { value: 'monday',    label: t('dayMonday') },
    { value: 'tuesday',   label: t('dayTuesday') },
    { value: 'wednesday', label: t('dayWednesday') },
    { value: 'thursday',  label: t('dayThursday') },
    { value: 'friday',    label: t('dayFriday') },
  ];

  const [form, setForm]       = useState<FormData>(INITIAL);
  const [errors, setErrors]   = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const set = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleDay = (day: string) =>
    setForm(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await adminService.registerDoctor({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        yearsOfExperience: parseInt(form.yearsOfExperience, 10),
        specializationId: parseInt(form.specializationId, 10),
        workDays: form.workDays,
        startTime: toTimeSpan(form.startTime),
        endTime: toTimeSpan(form.endTime),
      });
      if (res.succeeded) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/admin/doctors`), 1800);
      } else {
        setErrors({ form: res.message || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full signature-gradient flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface">{t('successTitle')}</h2>
        <p className="text-on-surface-variant">{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto space-y-6 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/${locale}/admin/doctors`)}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm mb-4"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('backToDoctors')}
        </button>
        <DashboardHero 
          title={t('title')} 
          subtitle={t('subtitle')} 
          icon="person_add" 
        />
      </div>

      {/* Form error */}
      {errors.form && (
        <div className="bg-error-container text-error rounded-xl p-4 text-sm font-medium">{errors.form}</div>
      )}

      <form onSubmit={(e) => void (async () => { await handleSubmit(e); })()} className="space-y-5">
        {/* Personal info */}
        <div 
          className={`bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-5 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
        >
          <h2 className="font-bold text-on-surface">{t('personalInfo')}</h2>

          <Field label={t('fullName')} error={errors.fullName} delayIndex={0}>
            <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)}
              placeholder="Dr. John Smith" className={inputCls} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('email')} error={errors.email} delayIndex={1}>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="doctor@hospital.com" className={inputCls} />
            </Field>
            <Field label={t('phone')} error={errors.phoneNumber} delayIndex={2}>
              <input type="tel" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
                placeholder="+201xxxxxxxxx" className={inputCls} />
            </Field>
          </div>

          <Field label={t('password')} error={errors.password} delayIndex={3}>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Min 8 chars, 1 number, 1 symbol" className={inputCls} />
          </Field>
        </div>

        {/* Professional info */}
        <div 
          className={`bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-5 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
        >
          <h2 className="font-bold text-on-surface">{t('professionalDetails')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('specialization')} error={errors.specializationId} delayIndex={4}>
              <select value={form.specializationId} onChange={e => set('specializationId', e.target.value)} className={inputCls}>
                <option value="">{t('selectSpec')}</option>
                {SPECIALIZATIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label={t('yearsExp')} error={errors.yearsOfExperience} delayIndex={5}>
              <input type="number" min={0} value={form.yearsOfExperience}
                onChange={e => set('yearsOfExperience', e.target.value)}
                placeholder="0" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Schedule */}
        <div 
          className={`bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-5 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
        >
          <h2 className="font-bold text-on-surface">{t('workSchedule')}</h2>

          {/* Work days */}
          <Field label={t('workingDays')} error={errors.workDays} delayIndex={6}>
            <div className="flex flex-wrap gap-2 mt-1">
              {WORK_DAYS.map(({ value, label }) => {
                const selected = form.workDays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      selected
                        ? 'signature-gradient text-white border-transparent'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-low'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('startTime')} error={errors.startTime} delayIndex={7}>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
            </Field>
            <Field label={t('endTime')} error={errors.endTime} delayIndex={8}>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}
          style={{ transitionDelay: staggerDelay(3, 60) }}
        >
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('registering')}</>
            : <><span className="material-symbols-outlined">person_add</span> {t('registerBtn')}</>
          }
        </button>
      </form>
    </div>
  );
}
