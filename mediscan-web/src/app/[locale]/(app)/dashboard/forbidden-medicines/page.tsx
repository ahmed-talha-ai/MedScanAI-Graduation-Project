'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { reportService } from '@/services/reportService';
import type { PatientWarning } from '@/types/api';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useTranslations } from 'next-intl';

// ─── Offline fallback reference data ──────────────────────────────────────────
// Shown when the Python RAG service is unreachable
const OFFLINE_WARNINGS: PatientWarning[] = [
  {
    type: 'drug_interaction',
    severity: 'high',
    message: 'Warfarin + Aspirin: Significant bleeding risk. Avoid concurrent use without medical supervision.',
  },
  {
    type: 'drug_interaction',
    severity: 'high',
    message: 'Metformin + Contrast Dye (CT/MRI): Stop Metformin 48 h before contrast procedures and resume only after kidney function confirmed.',
  },
  {
    type: 'drug_interaction',
    severity: 'medium',
    message: 'ACE Inhibitors + Potassium Supplements: Risk of hyperkalemia. Monitor potassium levels regularly.',
  },
  {
    type: 'drug_interaction',
    severity: 'medium',
    message: 'Statins + Grapefruit Juice: Can increase statin blood levels. Avoid grapefruit with Atorvastatin and Simvastatin.',
  },
  {
    type: 'allergy',
    severity: 'high',
    message: 'Penicillin allergy: Cross-reactivity possible with cephalosporins (~1–10%). Inform all providers.',
  },
  {
    type: 'allergy',
    severity: 'high',
    message: 'Sulfonamide allergy: Avoid sulfamethoxazole, furosemide, and some diuretics if confirmed allergy.',
  },
  {
    type: 'drug_interaction',
    severity: 'low',
    message: 'NSAIDs + Antihypertensives: Long-term NSAID use can reduce effectiveness of blood pressure medications.',
  },
  {
    type: 'drug_interaction',
    severity: 'low',
    message: 'Antihistamines + Alcohol: Enhanced CNS depression. Avoid alcohol while taking antihistamines.',
  },
];


// ─── Warning card ──────────────────────────────────────────────────────────────
function WarningCard({ warning, index, mounted }: { warning: PatientWarning; index: number; mounted: boolean }) {
  const t = useTranslations('forbiddenMeds');
  const SEV_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; border: string }> = {
    high: {
      label: t('forbiddenHighRisk'),
      color: 'text-error',
      bg: 'bg-error-container',
      icon: 'dangerous',
      border: 'border-s-4 border-error',
    },
    medium: {
      label: t('warning'),
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      icon: 'warning',
      border: 'border-s-4 border-secondary',
    },
    low: {
      label: t('interaction'),
      color: 'text-on-surface-variant',
      bg: 'bg-surface-container',
      icon: 'info',
      border: 'border-s-4 border-outline-variant',
    },
  };
  const TYPE_LABELS: Record<string, string> = {
    allergy: t('allergy'),
    drug_interaction: t('drugInteraction'),
  };
  const cfg = SEV_CONFIG[warning.severity] ?? SEV_CONFIG.low;
  return (
    <div 
      className={`bg-surface-container-lowest rounded-lg p-5 ambient-shadow ${cfg.border} flex gap-4 transition-all duration-500 ease-out ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
      style={{ transitionDelay: staggerDelay(index, 120) }}
    >
      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5 ${warning.severity === 'high' ? 'anim-ring-pulse' : ''}`}>
        <span className={`material-symbols-outlined text-xl ${cfg.color}`}>{cfg.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-0.5 rounded-full font-medium">
            {TYPE_LABELS[warning.type] ?? warning.type}
          </span>
        </div>
        <p className="text-sm text-on-surface leading-relaxed">{warning.message}</p>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ForbiddenMedicinesPage() {
  const { user } = useAuthStore();
  const t = useTranslations('forbiddenMeds');

  const [warnings, setWarnings]   = useState<PatientWarning[]>([]);
  const [loading, setLoading]     = useState(true);
  const [offline, setOffline]     = useState(false);
  const [filter, setFilter]       = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [mounted, setMounted]     = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const loadWarnings = async () => {
    if (!user?.userId) return;
    setLoading(true);
    setOffline(false);
    try {
      const res = await reportService.fetchWarnings(user.userId);
      if (res.status === 'success' && Array.isArray(res.warnings)) {
        setWarnings(res.warnings);
      } else {
        // API returned but no warnings — show empty from API
        setWarnings([]);
      }
    } catch {
      // Service unreachable — use offline fallback
      setOffline(true);
      setWarnings(OFFLINE_WARNINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => { await loadWarnings(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = filter === 'all' ? warnings : warnings.filter((w) => w.severity === filter);

  const countBySev = (sev: string) => warnings.filter((w) => w.severity === sev).length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <DashboardHero
        icon="medication"
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* Offline notice */}
      {offline && !loading && (
        <div className={`bg-secondary/10 text-secondary rounded-lg p-4 flex items-center gap-3 ${mounted ? 'anim-fade-down-in' : 'anim-fade-down'}`}>
          <span className="material-symbols-outlined">wifi_off</span>
          <div>
            <p className="font-semibold text-sm">{t('offlineTitle')}</p>
            <p className="text-xs opacity-80">{t('offlineDesc')}</p>
          </div>
          <button
            onClick={() => void (async () => { await loadWarnings(); })()}
            className="ms-auto flex-shrink-0 text-xs font-semibold underline hover:no-underline"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Severity stat pills */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'high', label: t('highRisk'), icon: 'dangerous', cls: 'bg-error-container text-error' },
            { key: 'medium', label: t('warning'), icon: 'warning', cls: 'bg-secondary/10 text-secondary' },
            { key: 'low', label: t('interaction'), icon: 'info', cls: 'bg-surface-container text-on-surface-variant' },
          ].map(({ key, label, icon, cls }, idx) => (
            <div 
              key={key} 
              className={`rounded-lg p-5 ${cls} text-center ambient-shadow transition-all duration-500 ease-out ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
              style={{ transitionDelay: staggerDelay(idx, 100) }}
            >
              <span className="material-symbols-outlined text-3xl mb-1">{icon}</span>
              <p className="text-2xl font-extrabold">{countBySev(key)}</p>
              <p className="text-xs font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {!loading && warnings.length > 0 && (
        <div className="flex gap-1 bg-surface-container-high p-1 rounded-full w-fit overflow-x-auto">
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap capitalize ${
                filter === f ? 'bg-surface-container-lowest text-primary ambient-shadow' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f === 'all' ? t('filterAll', { count: warnings.length }) : f}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* Warnings list */}
      {!loading && (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center ambient-shadow ghost-border">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">verified_user</span>
              <h3 className="font-bold text-on-surface text-lg mb-1">{t('noWarnings')}</h3>
              <p className="text-sm text-on-surface-variant">
                {filter === 'all'
                  ? t('noWarningsAll')
                  : t('noWarningsSev', { severity: filter })
                }
              </p>
            </div>
          ) : (
            filtered.map((w, i) => <WarningCard key={i} warning={w} index={i} mounted={mounted} />)
          )}
        </div>
      )}

      {/* Medical disclaimer */}
      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">{t('disclaimerLabel')}</span>
          {t('disclaimerText')}
        </p>
      </div>
    </div>
  );
}
