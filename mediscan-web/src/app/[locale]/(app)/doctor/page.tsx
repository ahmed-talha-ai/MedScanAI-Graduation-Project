'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { doctorService } from '@/services/doctorService';
import { ReportDrawer } from '@/components/doctor/ReportDrawer';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { DoctorDashboardResponse, DoctorPatientEntry } from '@/types/api';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Typewriter } from '@/components/ui/Typewriter';
import { useTranslations } from 'next-intl';

// ─── helpers ──────────────────────────────────────────────────────────────────
function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-secondary/10 text-secondary',
  'bg-tertiary/10 text-tertiary',
  'bg-secondary-container text-on-secondary-container',
];

// ─── Patient row (dashboard summary) ─────────────────────────────────────────
function PatientRow({
  entry,
  index,
  onViewReport,
  mounted,
}: {
  entry: DoctorPatientEntry;
  index: number;
  onViewReport: (patientId: string, name: string) => void;
  mounted?: boolean;
}) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('doctorDash');
  const colorCls = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 border-b border-surface-container-high last:border-0 group transition-all duration-500 ${mounted ? ANIM_CLASSES.rightIn : ANIM_CLASSES.right}`}
      style={{ transitionDelay: staggerDelay(index, 80, 500) }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorCls}`}>
          {getInitials(entry.patientName)}
        </div>
        <div className="min-w-0">
          <Link href={`/${locale}/doctor/patients/${entry.patientId}`} className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors truncate hover:underline">
            {entry.patientName}
          </Link>
          <p className="text-xs text-on-surface-variant truncate">{entry.reason || t('noReason')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-on-surface-variant hidden sm:block">{formatDate(entry.appointmentDate)}</span>
        <button
          onClick={() => onViewReport(entry.patientId, entry.patientName)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">description</span>
          {t('report')}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const { user } = useAuthStore();
  const t = useTranslations('doctorDash');

  const [data, setData]     = useState<DoctorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  // Drawer state — only one open at a time
  const [drawerPatientId, setDrawerPatientId]   = useState<string | null>(null);
  const [drawerPatientName, setDrawerPatientName] = useState<string | undefined>(undefined);

  const openDrawer = (patientId: string, name: string) => {
    setDrawerPatientId(patientId);
    setDrawerPatientName(name);
  };
  const closeDrawer = () => setDrawerPatientId(null);

  const load = async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await doctorService.getDashboard(user.userId);
      if (res.succeeded && res.data) setData(res.data);
      else setError(res.message || 'Failed to load dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => { await load(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Derived stats
  const todayEntries: DoctorPatientEntry[] = data?.patients.filter(p => isToday(p.appointmentDate)) ?? [];
  const totalPatients = data?.patients.length ?? 0;
  const doctorName = data?.doctorName || (user?.userId ? `#${user.userId.substring(0, 8)}` : 'Doctor');

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <DashboardHero 
          title={`${t('goodMorning')}, ${doctorName}`} 
          subtitle={new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} 
          icon="stethoscope" 
        />

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-error-container text-error rounded-xl p-6 flex items-center gap-3">
            <span className="material-symbols-outlined">error_outline</span>
            <div>
              <p className="font-bold text-sm">{t('failedLoad')}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => void (async () => { await load(); })()} className="ms-auto text-sm font-semibold underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's load — gradient */}
              <div 
                className={`signature-gradient rounded-xl p-6 text-white relative overflow-hidden ambient-shadow transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
                style={{ transitionDelay: staggerDelay(1, 100) }}
              >
                <div className="absolute top-0 end-0 p-4 opacity-15 pointer-events-none">
                  <span className="material-symbols-outlined text-7xl">vital_signs</span>
                </div>
                <p className="text-sm font-medium text-primary-fixed-dim mb-1">{t('todaysLoad')}</p>
                <AnimatedNumber value={todayEntries.length} className="text-5xl font-bold mb-4 block" duration={1200} />
                <p className="text-sm font-medium opacity-80">
                  {todayEntries.length === 0 ? t('noApptsToday') : t('appointmentsCount', { count: todayEntries.length })}
                </p>
              </div>

              {/* Total patients */}
              <div 
                className={`bg-surface-container-lowest dark:bg-[#0d1526] dark:border-[rgba(107,216,203,0.06)] rounded-xl p-6 ambient-shadow border border-surface-container-high flex flex-col justify-between transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
                style={{ transitionDelay: staggerDelay(2, 100) }}
              >
                <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <div>
                  <AnimatedNumber value={totalPatients} className="text-4xl font-bold text-on-surface mb-1 block" duration={1200} />
                  <p className="text-sm text-on-surface-variant font-medium">{t('totalPatients')}</p>
                </div>
              </div>

              {/* Quick action — Neurological Exam */}
              <Link
                href={`/${locale}/doctor/examination`}
                className={`bg-surface-container-lowest dark:bg-[#0d1526] dark:border-[rgba(107,216,203,0.06)] rounded-xl p-6 ambient-shadow border border-surface-container-high border-dashed border-outline-variant flex items-center justify-center gap-3 hover:bg-surface-container-low dark:hover:bg-[#111d33] transition-all duration-700 group ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
                style={{ transitionDelay: staggerDelay(3, 100) }}
              >
                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">medical_information</span>
                <span className="font-bold text-primary">{t('runExam')}</span>
              </Link>

              {/* Quick action — AI Tools */}
              <Link
                href={`/${locale}/dashboard/ai-tools`}
                className={`bg-surface-container-lowest dark:bg-[#0d1526] dark:border-[rgba(107,216,203,0.06)] rounded-xl p-6 ambient-shadow border border-surface-container-high border-dashed border-outline-variant flex items-center justify-center gap-3 hover:bg-surface-container-low dark:hover:bg-[#111d33] transition-all duration-700 group ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
                style={{ transitionDelay: staggerDelay(4, 100) }}
              >
                <span className="material-symbols-outlined text-tertiary text-2xl group-hover:scale-110 transition-transform">psychology</span>
                <span className="font-bold text-tertiary">{t('aiTools')}</span>
              </Link>
            </div>

            {/* Today's schedule + Patient registry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Today's schedule */}
              <section className="lg:col-span-4 bg-surface-container-lowest dark:bg-[#0d1526] dark:border dark:border-[rgba(107,216,203,0.06)] rounded-xl p-6 ambient-shadow border border-surface-container-high">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-on-surface">{t('todaysSchedule')}</h2>
                  <Link
                    href={`/${locale}/doctor/appointments`}
                    className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    {t('viewAll')}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>

                {todayEntries.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">event_busy</span>
                    <p className="text-sm text-on-surface-variant">{t('noApptsToday')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayEntries.slice(0, 4).map((entry, i) => (
                      <div
                        key={entry.appointmentId}
                        className={`bg-surface-container-lowest rounded-lg p-4 relative overflow-hidden ambient-shadow transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}
                        style={{ transitionDelay: staggerDelay(i, 80) }}
                      >
                        <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary rounded-s-lg" />
                        <div className="ps-2">
                          <p className="font-bold text-on-surface text-sm">{entry.patientName}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {formatDate(entry.appointmentDate)}
                          </p>
                          <p className="text-xs text-primary mt-1 font-medium">{entry.reason || '—'}</p>
                        </div>
                        <div className="absolute top-3 end-3">
                          <span className={`text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]} px-2 py-0.5 rounded-full`}>
                            #{i + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                    {todayEntries.length > 4 && (
                      <Link href={`/${locale}/doctor/appointments`} className="block text-center text-xs text-primary font-semibold hover:underline pt-1">
                        {t('more', { count: todayEntries.length - 4 })}
                      </Link>
                    )}
                  </div>
                )}
              </section>

              {/* Patient registry */}
              <section className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#0d1526] dark:border dark:border-[rgba(107,216,203,0.06)] rounded-xl p-6 ambient-shadow border border-surface-container-high flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-on-surface">{t('patientRegistry')}</h2>
                  <Link
                    href={`/${locale}/doctor/appointments`}
                    className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    {t('manage')}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>

                {totalPatients === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">groups</span>
                    <p className="text-sm text-on-surface-variant">{t('noPatients')}</p>
                  </div>
                ) : (
                  <div>
                    {(data?.patients ?? []).slice(0, 6).map((entry, i) => (
                      <PatientRow
                        key={entry.appointmentId}
                        entry={entry}
                        index={i}
                        onViewReport={openDrawer}
                        mounted={mounted}
                      />
                    ))}
                    {totalPatients > 6 && (
                      <Link href={`/${locale}/doctor/appointments`} className="block text-center text-xs text-primary font-semibold hover:underline pt-3">
                        {t('viewAllPatients', { count: totalPatients })}
                      </Link>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* Report drawer — rendered outside main flow, one at a time */}
      <ReportDrawer
        patientId={drawerPatientId}
        patientName={drawerPatientName}
        onClose={closeDrawer}
      />
    </>
  );
}
