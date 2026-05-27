'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { doctorService } from '@/services/doctorService';
import { doctorExtraService } from '@/services/doctorExtraService';
import type { DoctorDashboardResponse, DoctorExtraResponse } from '@/types/api';
import { useTranslations } from 'next-intl';

function StatPill({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-on-surface-variant font-medium">{label}</p>
        <p className="font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { user } = useAuthStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('doctorDash');
  const tApp = useTranslations('app');

  const [data, setData]     = useState<DoctorDashboardResponse | null>(null);
  const [extra, setExtra]   = useState<DoctorExtraResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const run = async () => {
      try {
        const [dashRes, extraRes] = await Promise.all([
          doctorService.getDashboard(user.userId),
          doctorExtraService.getExtra(user.userId)
        ]);
        
        if (cancelled) return;
        
        if (dashRes.succeeded && dashRes.data) setData(dashRes.data);
        else setError(dashRes.message || t('failedLoad'));

        if (extraRes.succeeded && extraRes.data) setExtra(extraRes.data);
        
      } catch {
        if (!cancelled) setError(tApp('networkError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [user]);

  const doctorName = data?.doctorName ?? '—';
  const patientCount = data?.patients.length ?? 0;
  const initials = doctorName !== '—'
    ? doctorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'DR';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-primary">{t('profileTitle')}</h1>
        <p className="text-on-surface-variant mt-1">{t('profileSubtitle')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container text-error rounded-xl p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden">
        {/* Gradient banner */}
        <div className="h-32 signature-gradient relative">
          <div className="absolute bottom-0 start-6 translate-y-1/2">
            <div className="w-24 h-24 rounded-full bg-surface-container-lowest border-4 border-surface-container-lowest flex items-center justify-center overflow-hidden">
              {loading ? (
                <div className="w-full h-full rounded-full bg-surface-container-high animate-pulse" />
              ) : extra?.photoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={extra.photoBase64} alt={doctorName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">{initials}</span>
              )}
            </div>
          </div>
        </div>

        {/* Name + role */}
        <div className="px-6 pt-16 pb-6 border-b border-surface-container-high">
          {loading ? (
            <div className="space-y-2">
              <div className="h-6 bg-surface-container-high rounded-full w-40 animate-pulse" />
              <div className="h-4 bg-surface-container-high rounded-full w-24 animate-pulse" />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-on-surface">Dr. {doctorName}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{t('doctor')}</span>
                {extra?.governorate && (
                  <span className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {extra.governorate}
                  </span>
                )}
                <span className="bg-surface-container text-on-surface-variant text-xs px-3 py-1 rounded-full">MediScan AI</span>
              </div>
            </>
          )}
        </div>

        {/* Professional Details Section */}
        <div className="p-6 bg-surface-container-lowest">
           <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4">
             <span className="material-symbols-outlined text-primary">history_edu</span>
             Professional Information
           </h3>
           <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Biography & Academic Degree</p>
                {loading ? <div className="h-16 bg-surface-container-high rounded-lg animate-pulse" /> : (
                  <p className="text-sm text-on-surface leading-relaxed">{extra?.bio || 'No biography provided yet. Please contact your admin to update your profile.'}</p>
                )}
              </div>
           </div>
        </div>

        {/* Clinic & Contact Section */}
        <div className="p-6 bg-surface-container-low border-t border-surface-container-high">
           <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4">
             <span className="material-symbols-outlined text-tertiary">local_hospital</span>
             Clinic Details & Booking
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Clinic Address</p>
                {loading ? <div className="h-6 bg-surface-container-high rounded animate-pulse w-3/4" /> : (
                  <p className="text-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">storefront</span>
                    {extra?.clinicAddress || '—'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Consultation Fee</p>
                {loading ? <div className="h-6 bg-surface-container-high rounded animate-pulse w-1/2" /> : (
                  <p className="text-sm text-on-surface flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-sm text-green-600">payments</span>
                    {extra?.consultationFee ? `${extra.consultationFee} EGP` : '—'}
                  </p>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatPill icon="groups" label={t('totalPatients')} value={loading ? '…' : patientCount} />
        <StatPill icon="badge" label={t('role')} value={t('doctor')} />
        <StatPill icon="id_card" label={t('userId')} value={user?.userId?.substring(0, 8) ?? '—'} />
        <StatPill icon="verified_user" label={t('accountStatus')} value={t('active')} />
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href={`/${locale}/doctor/appointments`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all ambient-shadow"
        >
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          {t('viewAppts')}
        </Link>
        <Link
          href={`/${locale}/dashboard/ai-tools`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-lowest text-primary border border-outline-variant font-semibold text-sm hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-sm">psychology</span>
          {t('aiTools')}
        </Link>
      </div>
    </div>
  );
}
