'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useTranslations } from 'next-intl';

const TOOLS = [
  {
    slug: 'growth-tracker',
    icon: 'trending_up',
    image: '/images/children-3d/growth-tracker.png',
    title: 'Growth Tracker',
    desc: 'Log and visualise height & weight over time',
    color: 'bg-emerald-50 text-emerald-600',
    accent: 'bg-emerald-500',
  },
  {
    slug: 'bmi-calculator',
    icon: 'monitor_weight',
    image: '/images/children-3d/bmi-calculator.png',
    title: 'BMI Calculator',
    desc: 'Calculate body-mass index and weight category',
    color: 'bg-blue-50 text-blue-600',
    accent: 'bg-blue-500',
  },
  {
    slug: 'symptom-checker',
    icon: 'thermometer',
    image: '/images/children-3d/symptom-checker.png',
    title: 'Symptom Checker',
    desc: 'Checklist-based triage guidance for common symptoms',
    color: 'bg-amber-50 text-amber-600',
    accent: 'bg-amber-500',
  },
  {
    slug: 'milestones',
    icon: 'psychology',
    image: '/images/children-3d/milestones.png',
    title: 'Developmental Milestones',
    desc: 'Track age-appropriate developmental achievements',
    color: 'bg-purple-50 text-purple-600',
    accent: 'bg-purple-500',
  },
  {
    slug: 'dosage-calculator',
    icon: 'vaccines',
    image: '/images/children-3d/dosage-calculator.png',
    title: 'Dosage Calculator',
    desc: 'Weight-based Paracetamol & Ibuprofen dosing',
    color: 'bg-rose-50 text-rose-600',
    accent: 'bg-rose-500',
  },
  {
    slug: 'vaccination-tracker',
    icon: 'medical_services',
    image: '/images/children-3d/vaccination-tracker.png',
    title: 'Vaccination Tracker',
    desc: 'Record and schedule your child\'s vaccinations',
    color: 'bg-cyan-50 text-cyan-600',
    accent: 'bg-cyan-500',
  },
  {
    slug: 'food-guide',
    icon: 'restaurant',
    image: '/images/children-3d/food-guide.png',
    title: 'Food Guide',
    desc: 'Age-appropriate foods: safe, avoid, and introduce',
    color: 'bg-lime-50 text-lime-600',
    accent: 'bg-lime-500',
  },
  {
    slug: 'first-aid',
    icon: 'emergency',
    image: '/images/children-3d/first-aid.png',
    title: 'First Aid Hub',
    desc: 'Step-by-step guides for 10 common emergencies',
    color: 'bg-red-50 text-red-600',
    accent: 'bg-red-500',
  },
] as const;

export default function ChildrenHubPage() {
  const t = useTranslations('children');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-8 ambient-shadow ghost-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
        <div className="absolute -top-8 -end-8 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full signature-gradient flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">child_care</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-on-surface">{t('title')}</h1>
              <p className="text-on-surface-variant text-sm">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">wifi_off</span>
              {t('offlineBadge')}
            </span>
            <span className="bg-secondary/10 text-secondary text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">storage</span>
              {t('savedLocallyBadge')}
            </span>
            <span className="bg-surface-container text-on-surface-variant text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">privacy_tip</span>
              {t('privacyFirstBadge')}
            </span>
          </div>
        </div>
      </section>

      {/* Tool cards — pastel bento grid */}
      <section>
        <h2 className="text-lg font-bold text-on-surface mb-5">{t('chooseTool')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map(({ slug, icon, color, accent }, idx) => (
            <Link
              key={slug}
              href={`/${locale}/dashboard/children/${slug}`}
              className={`group relative bg-surface-container-lowest dark:glass-panel rounded-2xl p-6 ambient-shadow ghost-border dark:border-white/10 hover:-translate-y-2 hover:scale-105 active:scale-95 dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] duration-300 elastic-bounce transition-all overflow-hidden flex flex-col gap-4 ${
                mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
              }`}
              style={{
                transitionDelay: staggerDelay(idx, 80),
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDuration: '500ms',
              }}
            >
              {/* Accent top bar */}
              <div className={`absolute top-0 start-0 end-0 h-1 ${accent} rounded-t-2xl`} />
              
              {/* Subtle background orb */}
              <div className={`absolute -bottom-8 -end-8 w-24 h-24 rounded-full ${accent} opacity-0 group-hover:opacity-5 blur-2xl transition-opacity duration-500 pointer-events-none`} />

              {/* Floating icon or Image */}
              {'image' in TOOLS[idx] && (TOOLS[idx] as any).image ? (
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 anim-float overflow-hidden"
                  style={{ animationDelay: `${idx * 0.3}s` }}
                >
                  {/* Using standard img to avoid next/image layout shift complexity here */}
                  <img 
                    src={(TOOLS[idx] as any).image} 
                    alt={t(`tools.${slug}.title` as never)} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 anim-float`}
                  style={{ animationDelay: `${idx * 0.3}s` }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-bold text-on-surface text-base mb-1">{t(`tools.${slug}.title` as never)}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{t(`tools.${slug}.desc` as never)}</p>
              </div>

              <div className="flex items-center gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                {t('openTool')}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">arrow_forward</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">{t('medicalDisclaimer')} </span>
          {t('disclaimerText')}
        </p>
      </div>
    </div>
  );
}
