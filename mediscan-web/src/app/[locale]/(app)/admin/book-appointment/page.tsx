'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import type { DoctorForAppointment } from '@/types/api';
import { useTranslations } from 'next-intl';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { DashboardHero } from '@/components/ui/DashboardHero';

const inputCls = 'w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all border border-transparent focus:border-primary/30';

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

interface FormData {
  patientName: string;
  doctorId: string;
  date: string;
  reason: string;
}

type Errors = Partial<Record<keyof FormData | 'form', string>>;

function validate(form: FormData): Errors {
  const e: Errors = {};
  if (!form.patientName.trim()) e.patientName = 'Patient name is required';
  if (!form.doctorId)           e.doctorId = 'Please select a doctor';
  if (!form.date)               e.date = 'Date and time are required';
  if (!form.reason.trim())      e.reason = 'Reason for visit is required';
  // Date must not be in the past
  if (form.date && new Date(form.date) < new Date()) e.date = 'Appointment must be in the future';
  return e;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('adminBook');

  const [doctors, setDoctors]   = useState<DoctorForAppointment[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState(false);

  const [form, setForm]         = useState<FormData>({ patientName: '', doctorId: '', date: '', reason: '' });
  const [errors, setErrors]     = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  // Load doctors for dropdown on mount
  useEffect(() => {
    const run = async () => {
      try {
        const res = await adminService.getDoctorsForAppointment();
        if (res.succeeded && res.data) setDoctors(res.data);
        else setDoctorError(true);
      } catch { setDoctorError(true); }
      finally { setLoadingDoctors(false); }
    };
    void run();
  }, []);

  const set = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const selectedDoctor = doctors.find(d => d.id === form.doctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await adminService.bookAppointmentByAdmin({
        patientId: null,                       // no patient lookup endpoint
        patientName: form.patientName.trim(),
        doctorId: form.doctorId,
        date: new Date(form.date).toISOString(),
        reason: form.reason.trim(),
        status: 'Confirmed',
      });
      if (res.succeeded) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/admin`), 2000);
      } else {
        setErrors({ form: res.message || 'Booking failed. Please try again.' });
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
        <p className="text-on-surface-variant">{t('successDesc')}</p>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-6 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/${locale}/admin`)}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm mb-4"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('backToDashboard')}
        </button>
        <DashboardHero 
          title={t('title')} 
          subtitle={t('subtitle')} 
          icon="calendar_add_on" 
        />
      </div>

      {/* Info note */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm">
        <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">info</span>
        <span className="text-on-surface-variant">
          {t('infoNote')} <strong className="text-primary">Confirmed</strong>.{' '}
          {t('infoNoteDetail')}
        </span>
      </div>

      {errors.form && (
        <div className="bg-error-container text-error rounded-xl p-4 text-sm font-medium">{errors.form}</div>
      )}

      <form
        onSubmit={(e) => void (async () => { await handleSubmit(e); })()}
        className={`bg-surface-container-lowest rounded-xl p-8 ambient-shadow ghost-border space-y-5 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
      >
        {/* Patient name */}
        <Field label={t('patientName')} error={errors.patientName} delayIndex={0}>
          <input
            type="text"
            value={form.patientName}
            onChange={e => set('patientName', e.target.value)}
            placeholder={t('patientNamePlaceholder')}
            className={inputCls}
          />
        </Field>

        {/* Doctor select */}
        <Field label={t('doctor')} error={errors.doctorId} delayIndex={1}>
          {loadingDoctors ? (
            <div className={`${inputCls} animate-pulse text-on-surface-variant`}>{t('loadingDoctors')}</div>
          ) : doctorError ? (
            <div className="text-sm text-error bg-error-container rounded-xl px-4 py-3">
              {t('failedLoadDoctors')} <button type="button" onClick={() => window.location.reload()} className="underline font-semibold">{t('retryLoad')}</button>
            </div>
          ) : (
            <select value={form.doctorId} onChange={e => set('doctorId', e.target.value)} className={inputCls}>
              <option value="">{t('selectDoctor')}</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.fullName} — {d.specialization} ({d.yearsOfExperience} yrs)
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Selected doctor info */}
        {selectedDoctor && (
          <div className={`bg-primary/5 rounded-xl p-4 flex items-center gap-3 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(2, 60) }}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm">Dr. {selectedDoctor.fullName}</p>
              <p className="text-xs text-on-surface-variant">{selectedDoctor.specialization} · {selectedDoctor.yearsOfExperience} {t('yearsExperience')}</p>
              {selectedDoctor.availableStartTimes?.length > 0 && (
                <p className="text-xs text-primary mt-0.5">
                  {t('availableSlots', { slots: selectedDoctor.availableStartTimes.join(', ') })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Date and time */}
        <Field label={t('dateTime')} error={errors.date} delayIndex={3}>
          <input
            type="datetime-local"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className={inputCls}
          />
        </Field>

        {/* Reason */}
        <Field label={t('reasonForVisit')} error={errors.reason} delayIndex={4}>
          <textarea
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            placeholder={t('reasonPlaceholder')}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>

        {/* Status note */}
        <div className={`flex items-center gap-2 text-sm text-on-surface-variant transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(5, 60) }}>
          <span className="material-symbols-outlined text-base">check_circle</span>
          {t('statusNote')} <span className="text-primary font-semibold ms-1">Confirmed</span>
        </div>

        <button
          type="submit"
          disabled={submitting || loadingDoctors}
          className={`w-full py-4 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}
          style={{ transitionDelay: staggerDelay(6, 60) }}
        >
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('booking')}</>
            : <><span className="material-symbols-outlined">calendar_add_on</span> {t('bookBtn')}</>
          }
        </button>
      </form>
    </div>
  );
}
