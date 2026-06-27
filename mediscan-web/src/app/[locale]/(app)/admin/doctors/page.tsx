'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { DoctorListEntry, DoctorForAppointment } from '@/types/api';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useTranslations } from 'next-intl';
import { DashboardHero } from '@/components/ui/DashboardHero';

type FilterTab = 'all' | 'active' | 'inactive';

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-secondary/10 text-secondary',
  'bg-tertiary/10 text-tertiary',
  'bg-secondary-container text-on-secondary-container',
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Doctor card ──────────────────────────────────────────────────────────────
function DoctorCard({
  doctor, index, actioning, onDeactivate, onRestore,
}: {
  doctor: DoctorListEntry;
  index: number;
  actioning: string | null;
  onDeactivate: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const t = useTranslations('dashboard.admin.doctorsPage');
  const colorCls = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const isActioning = actioning === doctor.id;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const tVal = setTimeout(() => setMounted(true), 10); return () => clearTimeout(tVal); }, []);

  return (
    <div 
      className={`bg-surface-container-lowest rounded-xl p-5 ambient-shadow ghost-border transition-all duration-700 ${!doctor.isActive ? 'opacity-60 grayscale' : ''} ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
      style={{ transitionDelay: staggerDelay(index, 100) }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorCls}`}>
          {getInitials(doctor.fullName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-on-surface truncate">
              {t('drPrefix')}{doctor.fullName}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
              doctor.isActive ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'
            }`}>
              {doctor.isActive ? t('statusActive') : t('statusInactive')}
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm flex-shrink-0">mail</span>
              <span className="truncate">{doctor.email}</span>
            </p>
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm flex-shrink-0">phone</span>
              {doctor.phoneNumber}
            </p>
            {doctor.specialization && (
              <p className="text-xs text-primary flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-sm flex-shrink-0">medical_services</span>
                {doctor.specialization}
                {doctor.yearsOfExperience !== undefined && (
                  <span className="text-on-surface-variant font-normal">
                    &nbsp;&bull;&nbsp;{doctor.yearsOfExperience === 1 ? t('yrExp', { exp: doctor.yearsOfExperience }) : t('yrsExp', { exp: doctor.yearsOfExperience })}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {doctor.isActive ? (
              <button
                onClick={() => onDeactivate(doctor.id)}
                disabled={isActioning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-error text-xs font-semibold hover:opacity-80 transition-all disabled:opacity-50"
              >
                {isActioning
                  ? <span className="w-3 h-3 border-2 border-error/30 border-t-error rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-sm">person_off</span>
                }
                {t('deactivate')}
              </button>
            ) : (
              <button
                onClick={() => onRestore(doctor.id)}
                disabled={isActioning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {isActioning
                  ? <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-sm">person_check</span>
                }
                {t('restore')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DoctorManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('dashboard.admin.doctorsPage');

  const [doctors, setDoctors]   = useState<DoctorListEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<FilterTab>('all');
  const [actioning, setActioning] = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const tVal = setTimeout(() => setMounted(true), 10); return () => clearTimeout(tVal); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel: base list + rich data — merge by id
      const [baseRes, richRes] = await Promise.allSettled([
        adminService.getAllDoctors(),
        adminService.getDoctorsForAppointment(),
      ]);

      let baseList: DoctorListEntry[] = [];
      if (baseRes.status === 'fulfilled' && baseRes.value.succeeded && baseRes.value.data) {
        baseList = baseRes.value.data;
      } else {
        setError(t('networkError'));
        return;
      }

      // Build rich lookup map — graceful fallback if GetDoctors fails
      const richMap = new Map<string, DoctorForAppointment>();
      if (richRes.status === 'fulfilled' && richRes.value.succeeded && richRes.value.data) {
        for (const d of richRes.value.data) richMap.set(d.id, d);
      }

      // Merge
      const merged: DoctorListEntry[] = baseList.map(d => ({
        ...d,
        specialization: richMap.get(d.id)?.specialization,
        yearsOfExperience: richMap.get(d.id)?.yearsOfExperience,
      }));

      setDoctors(merged);
    } catch {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  const handleDeactivate = async (doctorId: string) => {
    setActioning(doctorId);
    try {
      const res = await adminService.deleteDoctor({ doctorId });
      if (res.succeeded) {
        setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isActive: false } : d));
        showToast(t('deactivatedToast'));
      } else {
        showToast(res.message || t('failedDeactivate'));
      }
    } catch { showToast(t('networkError')); }
    finally { setActioning(null); }
  };

  const handleRestore = async (doctorId: string) => {
    setActioning(doctorId);
    try {
      const res = await adminService.restoreDoctor({ doctorId });
      if (res.succeeded) {
        setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isActive: true } : d));
        showToast(t('restoredToast'));
      } else {
        showToast(res.message || t('failedRestore'));
      }
    } catch { showToast(t('networkError')); }
    finally { setActioning(null); }
  };

  const filtered = doctors.filter(d => {
    if (filter === 'active')   return d.isActive;
    if (filter === 'inactive') return !d.isActive;
    return true;
  });

  const countActive   = doctors.filter(d => d.isActive).length;
  const countInactive = doctors.filter(d => !d.isActive).length;

  return (
    <>
      {toast && (
        <div className="fixed top-6 end-6 z-50 bg-primary text-white px-5 py-3 rounded-full text-sm font-semibold ambient-shadow animate-fade-in-up">
          {toast}
        </div>
      )}

      <div className={`space-y-6 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
        {/* Header */}
        <DashboardHero 
          title={t('title')} 
          subtitle={t('subtitle')} 
          icon="medical_services" 
          action={
            <Link
              href={`/${locale}/admin/add-doctor`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-primary font-semibold text-sm hover:bg-white/90 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              {t('addDoctor')}
            </Link>
          }
        />

        {/* Filter tabs */}
        <div className="flex gap-8 border-b border-surface-container-high overflow-x-auto w-full">
          {([
            { key: 'all',      label: t('tabAll', { count: doctors.length }) },
            { key: 'active',   label: t('tabActive', { count: countActive }) },
            { key: 'inactive', label: t('tabInactive', { count: countInactive }) },
          ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`relative pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === key
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
              <div 
                className={`absolute bottom-0 start-0 w-full h-0.5 bg-primary transition-transform duration-300 origin-left ${filter === key ? 'scale-x-100' : 'scale-x-0'}`}
              />
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">{[0,1,2,3].map(i => <SkeletonRow key={i} />)}</div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-error-container text-error rounded-xl p-6 flex items-center gap-3">
            <span className="material-symbols-outlined">error_outline</span>
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => void (async () => { await load(); })()} className="ms-auto underline text-sm font-semibold">{t('retry')}</button>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && (
          filtered.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-14 text-center ambient-shadow ghost-border">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">medical_services</span>
              <p className="font-bold text-on-surface text-lg mb-1">{t('noDoctors')}</p>
              <p className="text-sm text-on-surface-variant">
                {filter !== 'all' ? t('noDoctorsFilter') : t('noDoctorsRegistered')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((doc, i) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  index={i}
                  actioning={actioning}
                  onDeactivate={(id) => void (async () => { await handleDeactivate(id); })()}
                  onRestore={(id) => void (async () => { await handleRestore(id); })()}
                />
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
