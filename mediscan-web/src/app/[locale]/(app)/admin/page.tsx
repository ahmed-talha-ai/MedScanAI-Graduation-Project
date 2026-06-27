'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { adminService } from '@/services/adminService';
import apiClient from '@/lib/axios';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import type { TodayAppointmentEntry } from '@/types/api';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { DashboardHero } from '@/components/ui/DashboardHero';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
  const cls =
    status === 'Pending'   ? 'bg-secondary/10 text-secondary' :
    status === 'Confirmed' ? 'bg-primary/10 text-primary' :
    status === 'Completed' ? 'bg-surface-container text-on-surface-variant' :
    status === 'Cancelled' ? 'bg-error-container text-error' :
    'bg-surface-container text-on-surface-variant';

  const label =
    status === 'Pending'   ? t('pending') :
    status === 'Confirmed' ? t('confirmed') :
    status === 'Completed' ? t('completed') :
    status === 'Cancelled' ? t('cancelled') :
    status;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color, loading, delayIndex, format = 'number', decimals = 0
}: {
  icon: string; label: string; value: number; color: string; loading: boolean; delayIndex?: number; format?: 'number' | 'percent'; decimals?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);
  return (
    <div 
      className={`bg-surface-container-lowest dark:bg-[#0d1526] dark:border-[rgba(107,216,203,0.06)] rounded-xl p-6 ambient-shadow border border-surface-container-high transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
      style={{ transitionDelay: staggerDelay(delayIndex || 0, 100) }}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
        color === 'primary' ? 'bg-primary/10' :
        color === 'secondary' ? 'bg-secondary/10' :
        'bg-tertiary/10'
      }`}>
        <span className={`material-symbols-outlined text-xl ${
          color === 'primary' ? 'text-primary' :
          color === 'secondary' ? 'text-secondary' :
          'text-tertiary'
        }`}>{icon}</span>
      </div>
      {loading ? (
        <div className="h-9 w-20 bg-surface-container-high rounded-full animate-pulse mb-1" />
      ) : (
        <p className={`text-4xl font-bold mb-1 ${
          color === 'primary' ? 'text-primary' :
          color === 'secondary' ? 'text-secondary' :
          'text-tertiary'
        }`}>
          <AnimatedNumber value={value} format={format} decimals={decimals} />
        </p>
      )}
      <p className="text-xs text-on-surface-variant uppercase tracking-wide font-medium">{label}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const displayLocale = useLocale();
  const t = useTranslations('dashboard.admin');

  const [patientCount, setPatientCount] = useState<number>(0);
  const [doctorCount, setDoctorCount]   = useState<number>(0);
  const [appts, setAppts]               = useState<TodayAppointmentEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [statsError, setStatsError]     = useState<string | null>(null);
  const [toast, setToast]               = useState<string | null>(null);
  const [actioning, setActioning]       = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [doctorFilter, setDoctorFilter] = useState<string>('');

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [pRes, dRes] = await Promise.allSettled([
        adminService.getPatientsCount(),
        adminService.getDoctorsCount(),
      ]);
      if (pRes.status === 'fulfilled' && pRes.value.succeeded && pRes.value.data) {
        setPatientCount(pRes.value.data.count);
      }
      if (dRes.status === 'fulfilled' && dRes.value.succeeded && typeof dRes.value.data === 'number') {
        setDoctorCount(dRes.value.data);
      }
    } catch {
      setStatsError(t('networkError'));
    } finally {
      setLoadingStats(false);
    }
  }, [t]);

  const loadAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      const res = await adminService.getTodayAppointments();
      if (res.succeeded && res.data) setAppts(res.data);
    } catch { /* silent — show empty table */ }
    finally { setLoadingAppts(false); }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.allSettled([loadStats(), loadAppointments()]);
    })();
  }, [loadStats, loadAppointments]);

  const handleConfirm = async (id: number) => {
    setActioning(id);
    try {
      const res = await adminService.confirmAppointment({ appointmentId: id });
      if (res.succeeded) {
        showToast(t('appointmentConfirmed'));
        setAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'Confirmed' } : a));
      } else {
        showToast(res.message || t('failedConfirm'));
      }
    } catch { showToast(t('networkError')); }
    finally { setActioning(null); }
  };

  const handleCancel = async (id: number) => {
    setActioning(id);
    try {
      const res = await adminService.cancelAppointment({ appointmentId: id });
      if (res.succeeded) {
        showToast(t('appointmentCancelled'));
        setAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
      } else {
        showToast(res.message || t('failedCancel'));
      }
    } catch { showToast(t('networkError')); }
    finally { setActioning(null); }
  };

  const QUICK_ACTIONS = [
    { icon: 'person_add',       label: t('addDoctor'),         desc: t('addDoctorDesc'),         href: `/${locale}/admin/add-doctor` },
    { icon: 'manage_accounts',  label: t('addAdmin'),          desc: t('addAdminDesc'),          href: `/${locale}/admin/add-admin` },
    { icon: 'calendar_add_on',  label: t('walkInBooking'),     desc: t('walkInBookingDesc'),     href: `/${locale}/admin/book-appointment` },
    { icon: 'medical_services', label: t('doctorManagement'),  desc: t('doctorManagementDesc'),  href: `/${locale}/admin/doctors` },
  ];

  // Unique doctor names for filter dropdown
  const doctorNames = useMemo(() => {
    const names = new Set(appts.map(a => a.doctorName).filter(Boolean));
    return Array.from(names).sort();
  }, [appts]);

  // Filtered appointments
  const filteredAppts = useMemo(() => {
    if (!doctorFilter) return appts;
    return appts.filter(a => a.doctorName === doctorFilter);
  }, [appts, doctorFilter]);

  // Locale-aware date
  const todayLabel = new Date().toLocaleDateString(
    displayLocale === 'ar' ? 'ar-EG' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 end-6 z-50 bg-primary text-white px-5 py-3 rounded-full text-sm font-semibold ambient-shadow animate-fade-in-up">
          {toast}
        </div>
      )}

      <div className="space-y-8">
        {/* Header */}
        <DashboardHero 
          title={t('welcomeMessage')} 
          subtitle={todayLabel}
          icon="admin_panel_settings" 
        />

        {/* Stats row */}
        {statsError && (
          <div className="bg-error-container text-error rounded-xl p-4 text-sm font-medium">{statsError}</div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="medical_services" label={t('totalDoctors')}   value={doctorCount}  color="primary"   loading={loadingStats} delayIndex={0} />
          <StatCard icon="groups"           label={t('totalPatients')}  value={patientCount} color="secondary" loading={loadingStats} delayIndex={1} />
          <StatCard icon="calendar_month"   label={t('todaysAppts')}    value={appts.length} color="tertiary"  loading={loadingAppts} delayIndex={2} />
          <StatCard icon="trending_up"      label={t('systemUptime')}   value={99.9}         color="primary"   loading={false} delayIndex={3} format="percent" decimals={1} />
        </div>

        {/* Quick actions */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-5">{t('quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, idx) => (
              <Link
                key={action.label}
                href={action.href}
                className={`group relative bg-surface-container-lowest dark:bg-[#0d1526] dark:border-[rgba(107,216,203,0.06)] rounded-2xl p-6 ambient-shadow border border-surface-container-high hover:-translate-y-2 hover:scale-[1.02] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col neon-card transition-all ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}
                style={{
                  transitionDelay: staggerDelay(idx, 80),
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDuration: '500ms',
                }}
              >
                {/* Hover orb */}
                <div className="absolute -top-8 -end-8 w-20 h-20 rounded-full bg-primary opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
                </div>
                <h3 className="font-bold text-on-surface mb-1">{action.label}</h3>
                <p className="text-sm text-on-surface-variant flex-1">{action.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-primary text-sm font-semibold">
                  {t('open')}
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Today's appointments */}
        <section className={`bg-surface-container-lowest dark:bg-[#0d1526] dark:border dark:border-[rgba(107,216,203,0.06)] rounded-xl ambient-shadow border border-surface-container-high overflow-hidden transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(4, 100) }}>
          <div className="px-6 py-5 border-b border-surface-container-high flex flex-wrap items-center gap-3 justify-between">
            <h2 className="text-lg font-bold text-on-surface">{t('todaysSchedule')}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Doctor filter */}
              {doctorNames.length > 0 && (
                <select
                  value={doctorFilter}
                  onChange={e => setDoctorFilter(e.target.value)}
                  className="text-sm rounded-full border border-surface-container-high bg-surface-container-low text-on-surface px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">{t('allDoctors')}</option>
                  {doctorNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => void (async () => { await loadAppointments(); })()}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors"
                title={t('refresh')}
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          </div>

          {loadingAppts ? (
            <div className="p-6 space-y-3">
              {[0,1,2].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : filteredAppts.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">event_busy</span>
              <p className="text-sm text-on-surface-variant">{t('noAppointmentsToday')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="px-6 py-3 text-start text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('patient')}</th>
                    <th className="px-6 py-3 text-start text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('doctor')}</th>
                    <th className="px-6 py-3 text-start text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('time')}</th>
                    <th className="px-6 py-3 text-start text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('status')}</th>
                    <th className="px-6 py-3 text-start text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppts.map((appt, idx) => {
                    const isPending   = appt.status === 'Pending';
                    const isConfirmed = appt.status === 'Confirmed';
                    const isActioning = actioning === appt.id;
                    const rowDelay = Math.min(idx * 60, 600);
                    return (
                      <tr 
                        key={appt.id} 
                        className={`border-b border-surface-container-high last:border-0 hover:bg-surface-container-low transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}
                        style={{ transitionDelay: `${rowDelay}ms` }}
                      >
                        <td className="px-6 py-4 font-medium text-on-surface">{appt.patientName}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{appt.doctorName}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{appt.time}</td>
                        <td className="px-6 py-4"><StatusBadge status={appt.status} t={t} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* Confirm — only when Pending */}
                            {isPending && (
                              <button
                                onClick={() => void (async () => { await handleConfirm(appt.id); })()}
                                disabled={isActioning}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                              >
                                {isActioning
                                  ? <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                  : <span className="material-symbols-outlined text-sm">check_circle</span>
                                }
                                {t('confirm')}
                              </button>
                            )}
                            {/* Cancel — only when Pending or Confirmed */}
                            {(isPending || isConfirmed) && (
                              <button
                                onClick={() => void (async () => { await handleCancel(appt.id); })()}
                                disabled={isActioning}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container text-error text-xs font-semibold hover:opacity-80 transition-colors disabled:opacity-50"
                              >
                                {isActioning
                                  ? <span className="w-3 h-3 border-2 border-error/30 border-t-error rounded-full animate-spin" />
                                  : <span className="material-symbols-outlined text-sm">cancel</span>
                                }
                                {t('cancel')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* WhatsApp Test Panel */}
        <WhatsAppTestPanel />
      </div>
    </>
  );
}

function WhatsAppTestPanel() {
  const t = useTranslations('dashboard.admin');
  const [phone, setPhone] = useState('+201012345678');
  const [breastName, setBreastName] = useState('');
  const [apptName, setApptName] = useState('');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptDate, setApptDate] = useState('2026-06-27T10:00');
  
  const [loadingBreast, setLoadingBreast] = useState(false);
  const [loadingAppt, setLoadingAppt] = useState(false);
  const [resultMsg, setResultMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const isValidPhone = /^\+?2?[0-9]+$/.test(phone);

  const handleBreastTest = async () => {
    if (!isValidPhone) { setResultMsg({type: 'error', text: t('invalidPhone')}); return; }
    setLoadingBreast(true);
    setResultMsg(null);
    try {
      await apiClient.post('/WhatsApp/test-breast-check', {
        phoneNumber: phone,
        patientName: breastName || 'Test Patient'
      });
      setResultMsg({type: 'success', text: t('whatsappSuccess')});
    } catch (err: any) {
      setResultMsg({type: 'error', text: err?.response?.data?.error || t('whatsappError')});
    } finally {
      setLoadingBreast(false);
    }
  };

  const handleApptTest = async () => {
    if (!isValidPhone) { setResultMsg({type: 'error', text: t('invalidPhone')}); return; }
    setLoadingAppt(true);
    setResultMsg(null);
    try {
      await apiClient.post('/WhatsApp/test-appointment-reminder', {
        phoneNumber: phone,
        patientName: apptName || 'Test Patient',
        doctorName: apptDoctor || 'Dr. Test',
        appointmentDate: apptDate
      });
      setResultMsg({type: 'success', text: t('whatsappSuccess')});
    } catch (err: any) {
      setResultMsg({type: 'error', text: err?.response?.data?.error || t('whatsappError')});
    } finally {
      setLoadingAppt(false);
    }
  };

  return (
    <section className="mt-8 bg-surface-container-lowest rounded-2xl ambient-shadow p-6 border border-surface-container-high/50">
      <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined">science</span>
        {t('whatsappTestPanel')}
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-1">{t('testPhone')}</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="w-full max-w-sm px-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Breast Check Panel */}
          <div className="p-4 rounded-xl bg-surface-container/50 border border-surface-container-high/30 space-y-4">
            <h4 className="font-semibold text-primary">{t('breastTestTitle')}</h4>
            <input 
              type="text" 
              placeholder={t('patientName')}
              value={breastName}
              onChange={(e) => setBreastName(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
            />
            <button 
              onClick={handleBreastTest}
              disabled={loadingBreast || !phone}
              className="w-full py-2 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loadingBreast && <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
              {t('sendBreastTest')}
            </button>
          </div>

          {/* Appt Reminder Panel */}
          <div className="p-4 rounded-xl bg-surface-container/50 border border-surface-container-high/30 space-y-4">
            <h4 className="font-semibold text-primary">{t('apptTestTitle')}</h4>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder={t('patientName')}
                value={apptName}
                onChange={(e) => setApptName(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
              />
              <input 
                type="text" 
                placeholder={t('doctorName')}
                value={apptDoctor}
                onChange={(e) => setApptDoctor(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
              />
              <input 
                type="datetime-local" 
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <button 
              onClick={handleApptTest}
              disabled={loadingAppt || !phone}
              className="w-full py-2 bg-secondary/10 text-secondary font-semibold rounded-xl hover:bg-secondary/20 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loadingAppt && <span className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />}
              {t('sendApptTest')}
            </button>
          </div>
        </div>

        {resultMsg && (
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${resultMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'}`}>
            <span className="material-symbols-outlined">{resultMsg.type === 'success' ? 'check_circle' : 'error'}</span>
            {resultMsg.text}
          </div>
        )}
      </div>
    </section>
  );
}
