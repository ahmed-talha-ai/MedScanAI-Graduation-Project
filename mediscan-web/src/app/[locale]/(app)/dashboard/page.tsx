'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import type { PatientProfileResponse, AppointmentResponse } from '@/types/api';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { Typewriter } from '@/components/ui/Typewriter';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  Pending:   { label: 'Pending',   classes: 'bg-secondary-container/30 text-secondary' },
  Confirmed: { label: 'Confirmed', classes: 'bg-primary/10 text-primary' },
  Completed: { label: 'Completed', classes: 'bg-surface-container-high text-on-surface-variant' },
  Cancelled: { label: 'Cancelled', classes: 'bg-error-container text-error' },
};

const QUICK_ACTIONS = [
  { icon: 'psychology',      labelKey: 'aiHub',        href: '/dashboard/ai-tools',       gradient: true },
  { icon: 'calendar_month',  labelKey: 'bookAppt',     href: '/dashboard/appointments',   gradient: false },
  { icon: 'smart_toy',       labelKey: 'chatbot',      href: '/dashboard/ai-tools/chatbot', gradient: false },
  { icon: 'clinical_notes',  labelKey: 'labOcr',       href: '/dashboard/ai-tools/lab-ocr', gradient: false },
];

export default function PatientDashboard() {
  const t = useTranslations('dashboard.patient');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'ar';
  const { user } = useAuthStore();

  const [profile, setProfile]     = useState<PatientProfileResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [profileLoading, setProfileLoading]     = useState(true);
  const [apptLoading, setApptLoading]           = useState(true);
  const [profileError, setProfileError]         = useState<string | null>(null);
  const [apptError, setApptError]               = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const fetchProfile = async () => {
    if (!user?.userId) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const result = await patientService.getProfile(user.userId);
      if (result.succeeded && result.data) setProfile(result.data);
      else setProfileError(result.message || 'Failed to load profile');
    } catch {
      setProfileError('Network error loading profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user?.userId) return;
    setApptLoading(true);
    setApptError(null);
    try {
      const result = await appointmentService.getPatientAppointments(user.userId);
      if (result.succeeded && result.data) setAppointments(result.data);
      else setApptError(result.message || 'Failed to load appointments');
    } catch {
      setApptError('Network error loading appointments');
    } finally {
      setApptLoading(false);
    }
  };

  useEffect(() => {
    const uid = user?.userId;
    if (!uid) return;
    void (async () => { await fetchProfile(); })();
    void (async () => { await fetchAppointments(); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const upcoming = appointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Confirmed'
  ).slice(0, 3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const displayName = profile?.fullName ?? user?.userId?.substring(0, 8) ?? 'Patient';

  return (
    <div className="space-y-10">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex justify-between items-end">
        <div>
          <Typewriter 
            as="h1" 
            text={`${greeting()}, ${displayName}.`} 
            speed={25} 
            className="text-3xl lg:text-4xl font-bold text-primary tracking-tight" 
          />
          <p className={`text-on-surface-variant mt-2 text-lg ${mounted ? 'anim-fade-up-in' : 'anim-fade-up'}`} style={{ transitionDelay: '300ms' }}>
            {t('subtitle')}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/appointments`}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-lowest ambient-shadow text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors ghost-border"
        >
          <span className="material-symbols-outlined text-primary text-xl">add</span>
          {t('bookAppointment')}
        </Link>
      </section>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div 
          className={`signature-gradient rounded-lg p-6 text-white relative overflow-hidden ambient-shadow transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
          style={{ transitionDelay: staggerDelay(0, 100) }}
        >
          <div className="absolute top-0 end-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-7xl">calendar_month</span>
          </div>
          <p className="font-medium text-primary-fixed-dim mb-1 text-sm">{t('upcomingAppointments')}</p>
          {apptLoading ? (
            <div className="h-12 w-16 bg-white/20 rounded animate-pulse" />
          ) : (
            <h3 className="text-5xl font-bold mb-2">
              <AnimatedNumber value={upcoming.length} duration={1000} />
            </h3>
          )}
          <p className="text-xs text-primary-fixed-dim">{t('scheduledVisits')}</p>
        </div>

        {/* Medications */}
        <div 
          className={`bg-surface-container-lowest dark:glass-panel rounded-lg p-6 ambient-shadow ghost-border dark:border-white/10 flex flex-col justify-between transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
          style={{ transitionDelay: staggerDelay(1, 100) }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-container/20 rounded-full text-secondary inline-flex">
              <span className="material-symbols-outlined">medication</span>
            </div>
          </div>
          <div>
            {profileLoading ? (
              <div className="h-10 w-16 bg-surface-container-high rounded animate-pulse mb-1" />
            ) : (
              <h3 className="text-4xl font-bold text-on-surface mb-1">
                <AnimatedNumber value={profile?.currentMedication?.length ?? 0} duration={1000} />
              </h3>
            )}
            <p className="font-medium text-on-surface-variant">{t('activeMedications')}</p>
          </div>
        </div>

        {/* Profile completion CTA */}
        <div 
          className={`bg-surface-container-lowest dark:glass-panel rounded-lg p-6 ambient-shadow ghost-border dark:border-white/10 border-dashed border-outline-variant flex flex-col items-center justify-center gap-3 hover:bg-surface-container-low dark:hover:bg-white/5 transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
          style={{ transitionDelay: staggerDelay(2, 100) }}
        >
          <span className="material-symbols-outlined text-primary text-2xl">person_check</span>
          <div className="text-center">
            <p className="font-bold text-primary text-sm">{t('profileComplete')}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('profileSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-on-surface mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ icon, labelKey, href, gradient }, idx) => (
            <Link
              key={href}
              href={`/${locale}${href}`}
              className={`rounded-lg p-5 flex flex-col items-center gap-3 transition-all duration-300 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale} hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] active:scale-95 ${
                gradient
                  ? 'signature-gradient text-white'
                  : 'bg-surface-container-lowest dark:glass-panel border border-transparent dark:border-white/10 hover:border-primary/20 text-on-surface hover:bg-surface-container-low'
              }`}
              style={{ transitionDelay: staggerDelay(idx, 120) }}
            >
              <span className={`material-symbols-outlined text-3xl ${gradient ? 'text-white' : 'text-primary'}`}>
                {icon}
              </span>
              <span className="text-sm font-semibold text-center">
                {t(labelKey as Parameters<typeof t>[0])}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Upcoming Appointments ──────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest dark:glass-panel rounded-lg p-6 ambient-shadow ghost-border dark:border-white/10">
        <div className="flex justify-between items-center mb-6 border-b border-surface-container-high pb-4">
          <h2 className="text-lg font-bold text-on-surface">{t('upcomingAppointments')}</h2>
          <Link
            href={`/${locale}/dashboard/appointments`}
            className="text-sm font-semibold text-primary hover:text-secondary transition-colors"
          >
            {t('viewAll')}
          </Link>
        </div>

        {apptLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : apptError ? (
          <ErrorState message={apptError} onRetry={fetchAppointments} />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon="calendar_month"
            title={t('noAppointments')}
            subtitle={t('noAppointmentsSubtitle')}
            action={{ label: t('bookAppointment'), onClick: () => router.push(`/${locale}/dashboard/appointments`) }}
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((appt, idx) => {
              const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.Pending;
              const apptDate = new Date(appt.date);
              return (
                <div
                  key={appt.appointmentId}
                  className={`flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-low transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}
                  style={{ transitionDelay: staggerDelay(idx, 80) }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-xl">calendar_today</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">{appt.reason}</h4>
                      <p className="text-xs text-on-surface-variant">
                        {apptDate.toLocaleDateString()} &bull; {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Profile Summary ────────────────────────────────────────────────── */}
      {!profileLoading && !profileError && profile && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'medical_information', label: t('chronicDiseases'), items: profile.chronicDiseases },
            { icon: 'warning',             label: t('allergies'),       items: profile.allergies },
            { icon: 'medication',          label: t('medications'),     items: profile.currentMedication },
          ].map(({ icon, label, items }, idx) => (
            <div 
              key={label} 
              className={`bg-surface-container-lowest dark:glass-panel rounded-lg p-5 ambient-shadow ghost-border dark:border-white/10 transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
              style={{ transitionDelay: staggerDelay(idx, 100) }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">{icon}</span>
                <h3 className="font-bold text-on-surface text-sm">{label}</h3>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-on-surface-variant">{t('noneRecorded')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="text-xs text-on-surface bg-surface-container-low rounded px-3 py-1.5">
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {profileError && <ErrorState message={profileError} onRetry={fetchProfile} />}
    </div>
  );
}
