'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { appointmentService } from '@/services/appointmentService';
import type { AppointmentResponse, DoctorForAppointment, BookAppointmentPayload } from '@/types/api';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { ErrorState } from '@/components/ui/ErrorState';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useTranslations, useLocale } from 'next-intl';

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { classes: string; icon: string }> = {
  Pending:   { classes: 'badge-base badge-pending',   icon: 'schedule' },
  Confirmed: { classes: 'badge-base badge-confirmed', icon: 'event_available' },
  Completed: { classes: 'badge-base badge-completed', icon: 'check_circle' },
  Cancelled: { classes: 'badge-base badge-cancelled', icon: 'cancel' },
};

type Tab = 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
const TABS: Tab[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

// ─── Booking modal ─────────────────────────────────────────────────────────
type BookingStep = 1 | 2 | 3 | 4;

function BookingModal({
  onClose,
  onBooked,
  patientId,
  patientName,
}: {
  onClose: () => void;
  onBooked: () => void;
  patientId: string;
  patientName: string;
}) {
  const t = useTranslations('appointments');
  const [step, setStep] = useState<BookingStep>(1);
  const [doctors, setDoctors] = useState<DoctorForAppointment[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorForAppointment | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Filter by specialization
  const [specFilter, setSpecFilter] = useState('All');
  const specs = ['All', ...Array.from(new Set(doctors.map((d) => d.specialization)))];
  const filteredDoctors = specFilter === 'All' ? doctors : doctors.filter((d) => d.specialization === specFilter);

  useEffect(() => {
    appointmentService.getDoctors()
      .then((res) => {
        if (res.succeeded && res.data) setDoctors(res.data);
        else setDoctorsError(res.message || t('failedDoctors'));
      })
      .catch(() => setDoctorsError(t('networkError')))
      .finally(() => setDoctorsLoading(false));
  }, [t]);

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    
    let formattedTime = selectedTime;
    const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const modifier = match[3]?.toUpperCase();
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
    const dateObj = new Date(`${selectedDate}T${formattedTime}`);
    if (isNaN(dateObj.getTime())) {
      setSubmitError(t('networkError'));
      setSubmitting(false);
      return;
    }
    const dateTime = dateObj.toISOString();

    const payload: BookAppointmentPayload = {
      patientId,
      patientName,
      doctorId: selectedDoctor.id,
      date: dateTime,
      reason,
      status: 'Confirmed',
    };
    try {
      const res = await appointmentService.bookAppointment(payload);
      if (res.succeeded) { setStep(4); }
      else setSubmitError(res.message || t('networkError'));
    } catch {
      setSubmitError(t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-in">
      <div className={`bg-surface-container-lowest rounded-xl w-full max-w-lg ambient-shadow max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 ${ANIM_CLASSES.scaleIn}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-on-surface">{t('bookTitle')}</h2>
            {step < 4 && <p className="text-xs text-on-surface-variant">{t('step', { step })}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Pick doctor */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-on-surface">{t('selectDoctor')}</p>
              {/* Spec filter */}
              <div className="flex flex-wrap gap-2">
                {specs.map((s) => (
                  <button key={s} onClick={() => setSpecFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${specFilter === s ? 'signature-gradient text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                    {s === 'All' ? t('tabs.all') : s}
                  </button>
                ))}
              </div>
              {doctorsLoading ? (
                <div className="space-y-3">{[0,1,2].map((i) => <SkeletonRow key={i} />)}</div>
              ) : doctorsError ? (
                <ErrorState message={doctorsError} />
              ) : filteredDoctors.length === 0 ? (
                <EmptyState icon="person_off" title={t('noDoctors')} />
              ) : (
                <div className="space-y-3">
                  {filteredDoctors.map((doc) => (
                    <button key={doc.id} onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                      className="w-full flex items-center gap-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-start transition-colors border border-transparent hover:border-primary/20">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface text-sm truncate">{doc.fullName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {doc.specialization} &bull; {doc.yearsOfExperience === 1 ? t('yrExp', { exp: doc.yearsOfExperience }) : t('yrsExp', { exp: doc.yearsOfExperience })}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pick date & time */}
          {step === 2 && selectedDoctor && (
            <div className="space-y-5">
              <button onClick={() => setStep(1)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">arrow_back</span> {t('changeDoctor')}
              </button>
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{selectedDoctor.fullName}</p>
                  <p className="text-xs text-on-surface-variant">{selectedDoctor.specialization}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">{t('selectDate')}</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              {selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">{t('availableTimes')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDoctor.availableStartTimes.map((tVal) => (
                      <button key={tVal} onClick={() => setSelectedTime(tVal)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${selectedTime === tVal ? 'signature-gradient text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}>
                        {tVal}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}
                className="w-full py-3 rounded-full signature-gradient text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                {t('continue')}
              </button>
            </div>
          )}

          {/* Step 3: Reason */}
          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">arrow_back</span> {t('changeDateTime')}
              </button>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">{t('reason')}</label>
                <textarea
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder={t('reasonPlaceholder')}
                  rows={4}
                  className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              {submitError && <p className="text-sm text-error">{submitError}</p>}
              <button disabled={!reason.trim() || submitting} onClick={handleBook}
                className="w-full py-3 rounded-full signature-gradient text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2">
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('booking')}</>
                ) : t('confirmBooking')}
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">{t('booked')}</h3>
              <p className="text-sm text-on-surface-variant max-w-xs">
                {t('bookedSuccess', { doctor: selectedDoctor?.fullName ?? '', date: selectedDate, time: selectedTime })}
              </p>
              <button onClick={() => { onBooked(); onClose(); }}
                className="px-8 py-3 rounded-full signature-gradient text-white font-bold text-sm">
                {t('viewMyAppts')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const t = useTranslations('appointments');
  const tStatus = useTranslations('status');
  const locale = useLocale();

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [tab, setTab]                   = useState<Tab>('All');
  const [showModal, setShowModal]       = useState(false);
  const [cancelling, setCancelling]     = useState<number | null>(null);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => { const tVal = setTimeout(() => setMounted(true), 10); return () => clearTimeout(tVal); }, []);

  const fetchAppointments = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getPatientAppointments(user.userId);
      if (res.succeeded && res.data) setAppointments(res.data);
      else setError(res.message || t('networkError'));
    } catch {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => { void (async () => { await fetchAppointments(); })(); }, [fetchAppointments]);

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      const res = await appointmentService.cancelAppointment(id);
      if (res.succeeded) {
        setAppointments((prev) => prev.map((a) => a.appointmentId === id ? { ...a, status: 'Cancelled' } : a));
      }
    } finally {
      setCancelling(null);
    }
  };

  const filtered = tab === 'All' ? appointments : appointments.filter((a) => a.status === tab);

  const profile = { fullName: 'Patient', id: user?.userId ?? '' };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <DashboardHero
        icon="calendar_month"
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary font-bold hover:bg-surface-container-lowest transition-colors shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            {t('bookNew')}
          </button>
        }
      />

      {/* Tabs */}
      <div className="overflow-x-auto w-fit max-w-full">
        <div className="flex bg-surface-container-high p-1 rounded-full gap-0.5">
          {TABS.map((tVal) => (
            <button
              key={tVal}
              onClick={() => setTab(tVal)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                tab === tVal
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {t(tVal === 'All' ? 'tabs.all' : `tabs.${tVal.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-surface-container-lowest rounded-lg ambient-shadow ghost-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="p-6"><ErrorState message={error} onRetry={fetchAppointments} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="calendar_month"
              title={tab === 'All' ? t('noAppts') : t('noApptsTab', { tab: tStatus(tab.toLowerCase()) })}
              subtitle={t('noAptsSub')}
              action={{ label: t('bookNew'), onClick: () => setShowModal(true) }}
            />
          </div>
        ) : (
          <ul className="divide-y divide-surface-container-high">
            {filtered.map((appt, idx) => {
              const cfg = STATUS_CFG[appt.status] ?? STATUS_CFG.Pending;
              const d = new Date(appt.date);
              const canCancel = appt.status === 'Pending' || appt.status === 'Confirmed';
              const isCancelling = cancelling === appt.appointmentId;
              return (
                <li 
                  key={appt.appointmentId} 
                  className={`grid transition-all duration-400 ease-out ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left} ${isCancelling ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
                  style={{ transitionDelay: staggerDelay(idx, 80) }}
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors">
                      {/* Date badge */}
                      <div className="text-center min-w-[52px]">
                        <p className="text-xs font-bold text-on-surface-variant uppercase">{d.toLocaleDateString(locale, { month: 'short' })}</p>
                        <p className="text-2xl font-extrabold text-primary leading-none">{d.getDate()}</p>
                      </div>
                      {/* Divider */}
                      <div className="w-px h-10 bg-surface-container-high" />
                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-on-surface text-sm truncate">{appt.reason}</h3>
                        <p className="text-xs text-on-surface-variant">
                          {d.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          &nbsp;&bull;&nbsp;
                          {d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                          <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                          {tStatus(appt.status.toLowerCase())}
                        </span>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(appt.appointmentId)}
                            disabled={cancelling === appt.appointmentId}
                            className="px-3 py-1 rounded-full text-xs font-semibold text-error border border-error/30 hover:bg-error-container transition-colors disabled:opacity-50"
                          >
                            {cancelling === appt.appointmentId ? t('cancelling') : t('cancel')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showModal && (
        <BookingModal
          patientId={user?.userId ?? ''}
          patientName={profile.fullName}
          onClose={() => setShowModal(false)}
          onBooked={fetchAppointments}
        />
      )}
    </div>
  );
}
