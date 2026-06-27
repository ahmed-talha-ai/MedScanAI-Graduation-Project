'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { doctorService } from '@/services/doctorService';
import { ReportDrawer } from '@/components/doctor/ReportDrawer';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { DoctorPatientEntry } from '@/types/api';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { DashboardHero } from '@/components/ui/DashboardHero';

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

type FilterTab = 'all' | 'today' | 'completed';

// ─── Appointment card ─────────────────────────────────────────────────────────
function AppointmentCard({
  entry,
  index,
  completing,
  completedIds,
  onComplete,
  onViewReport,
  mounted,
}: {
  entry: DoctorPatientEntry;
  index: number;
  completing: number | null;
  completedIds: Set<number>;
  onComplete: (id: number) => void;
  onViewReport: (patientId: string, name: string) => void;
  mounted?: boolean;
}) {
  const t = useTranslations('doctorDash');
  const locale = useLocale();
  const colorCls = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const isCompleted = completedIds.has(entry.appointmentId);
  const isCompleting = completing === entry.appointmentId;

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-5 ambient-shadow ghost-border transition-all duration-500 ${
        isCompleted ? 'opacity-60' : ''
      } ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
      style={{ transitionDelay: staggerDelay(index, 60, 400) }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorCls}`}>
          {getInitials(entry.patientName)}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
            <div>
              <Link href={`/${locale}/doctor/patients/${entry.patientId}`} className="font-bold text-on-surface hover:text-primary hover:underline transition-colors">{entry.patientName}</Link>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                {formatDate(entry.appointmentDate)}
                {isToday(entry.appointmentDate) && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold ms-1">{t('today')}</span>
                )}
              </p>
            </div>

            {isCompleted && (
              <span className="badge-base badge-completed flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {t('completed')}
              </span>
            )}
          </div>

          {/* Reason */}
          {entry.reason && (
            <p className="text-sm text-on-surface-variant mb-3 flex items-start gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary flex-shrink-0 mt-0.5">info</span>
              {entry.reason}
            </p>
          )}

          {/* Medical tags */}
          {(entry.chronicDiseases.length > 0 || entry.allergies.length > 0 || entry.currentMedicine.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {entry.chronicDiseases.slice(0, 2).map(d => (
                <span key={d} className="bg-secondary/10 text-secondary text-xs px-2.5 py-1 rounded-full font-medium">{d}</span>
              ))}
              {entry.allergies.slice(0, 2).map(a => (
                <span key={a} className="bg-error-container text-error text-xs px-2.5 py-1 rounded-full font-medium">{a}</span>
              ))}
              {entry.currentMedicine.slice(0, 2).map(m => (
                <span key={m} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">{m}</span>
              ))}
              {(entry.chronicDiseases.length + entry.allergies.length + entry.currentMedicine.length) > 6 && (
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                  {t('more', { count: (entry.chronicDiseases.length + entry.allergies.length + entry.currentMedicine.length) - 6 })}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* View Report */}
            <button
              onClick={() => onViewReport(entry.patientId, entry.patientName)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">description</span>
              {t('viewReport')}
            </button>

            {/* Run Examination */}
            <Link
              href={`/${locale}/doctor/examination?patientId=${entry.patientId}&patientName=${encodeURIComponent(entry.patientName)}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-tertiary/10 text-tertiary text-sm font-semibold hover:bg-tertiary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">medical_information</span>
              {t('runExamination')}
            </Link>

            {/* Mark Complete — only if not already completed */}
            {!isCompleted && (
              <button
                onClick={() => onComplete(entry.appointmentId)}
                disabled={isCompleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-primary/10 hover:text-primary hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100"
              >
                {isCompleting
                  ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-sm">check_circle</span>
                }
                {isCompleting ? t('completing') : t('markComplete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DoctorAppointmentsPage() {
  const { user } = useAuthStore();
  const t = useTranslations('doctorDash');
  const tApp = useTranslations('appointments');

  const [patients, setPatients]   = useState<DoctorPatientEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<FilterTab>('all');
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [completing, setCompleting]     = useState<number | null>(null);
  const [toast, setToast]               = useState<string | null>(null);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  // Drawer state
  const [drawerPatientId, setDrawerPatientId]     = useState<string | null>(null);
  const [drawerPatientName, setDrawerPatientName] = useState<string | undefined>(undefined);

  const openDrawer = useCallback((patientId: string, name: string) => {
    setDrawerPatientId(patientId);
    setDrawerPatientName(name);
  }, []);

  const closeDrawer = useCallback(() => setDrawerPatientId(null), []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await doctorService.getDashboard(user.userId);
      if (res.succeeded && res.data) setPatients(res.data.patients);
      else setError(res.message || t('failedLoadAppts'));
    } catch {
      setError(tApp('networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => { await load(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleComplete = async (appointmentId: number) => {
    setCompleting(appointmentId);
    try {
      const res = await doctorService.completeAppointment({ appointmentId });
      if (res.succeeded) {
        setCompletedIds(prev => new Set([...prev, appointmentId]));
        showToast(t('apptMarkedComplete'));
      } else {
        showToast(res.message || tApp('networkError'));
      }
    } catch {
      showToast(tApp('networkError'));
    } finally {
      setCompleting(null);
    }
  };

  // Filter logic
  const filtered = patients.filter(p => {
    if (filter === 'today') return isToday(p.appointmentDate);
    if (filter === 'completed') return completedIds.has(p.appointmentId);
    return true;
  });

  const countToday = patients.filter(p => isToday(p.appointmentDate)).length;
  const countCompleted = completedIds.size;

  return (
    <>
      <div className="space-y-6 animate-fade-in-up relative">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 end-6 z-50 bg-primary text-white px-5 py-3 rounded-full text-sm font-semibold ambient-shadow animate-fade-in-up">
            {toast}
          </div>
        )}

        {/* Header */}
        <DashboardHero 
          title={t('appointmentsTitle')} 
          subtitle={t('appointmentsSubtitle')} 
          icon="event" 
        />

        {/* Filter tabs */}
        <div className="flex gap-1 bg-surface-container-high p-1 rounded-full w-fit overflow-x-auto">
          {([
            { key: 'all',       label: `${tApp('tabs.all')} (${patients.length})` },
            { key: 'today',     label: `${t('today')} (${countToday})` },
            { key: 'completed', label: `${t('completed')} (${countCompleted})` },
          ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-surface-container-lowest text-primary ambient-shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-error-container text-error rounded-xl p-6 flex items-center gap-3">
            <span className="material-symbols-outlined">error_outline</span>
            <div>
              <p className="font-bold text-sm">{t('failedLoadAppts')}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => void (async () => { await load(); })()} className="ms-auto text-sm font-semibold underline">{tApp('retry')}</button>
          </div>
        )}

        {/* Appointment cards */}
        {!loading && !error && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-12 text-center ambient-shadow ghost-border">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">event_busy</span>
                <p className="font-bold text-on-surface text-lg mb-1">{t('noAppointments')}</p>
                <p className="text-sm text-on-surface-variant">
                  {filter === 'today' ? t('noApptToday') :
                   filter === 'completed' ? t('noApptCompleted') :
                   t('noApptFound')}
                </p>
              </div>
            ) : (
              filtered.map((entry, i) => (
                <AppointmentCard
                  key={entry.appointmentId}
                  entry={entry}
                  index={i}
                  completing={completing}
                  completedIds={completedIds}
                  onComplete={(id) => void (async () => { await handleComplete(id); })()}
                  onViewReport={openDrawer}
                  mounted={mounted}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Report drawer */}
      <ReportDrawer
        patientId={drawerPatientId}
        patientName={drawerPatientName}
        onClose={closeDrawer}
      />
    </>
  );
}
