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
    color: 'from-emerald-500/80 to-emerald-700/90',
    border: 'border-emerald-400/40',
    iconBg: 'bg-emerald-500',
    badge: '📊',
    titleColor: 'text-white',
    descColor: 'text-teal-50',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-teal-700',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
  },
  {
    slug: 'bmi-calculator',
    icon: 'monitor_weight',
    image: '/images/children-3d/bmi-calculator.png',
    color: 'from-blue-500/80 to-blue-700/90',
    border: 'border-blue-400/40',
    iconBg: 'bg-blue-500',
    badge: '⚡',
    titleColor: 'text-white',
    descColor: 'text-blue-50',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-blue-700',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
  },
  {
    slug: 'symptom-checker',
    icon: 'thermometer',
    image: '/images/children-3d/symptom-checker.png',
    color: 'from-amber-500/80 to-amber-700/90',
    border: 'border-amber-400/40',
    iconBg: 'bg-amber-500',
    badge: '🩺',
    titleColor: 'text-white',
    descColor: 'text-amber-50',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-amber-700',
    shadow: 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]',
  },
  {
    slug: 'milestones',
    icon: 'psychology',
    image: '/images/children-3d/milestones.png',
    color: 'from-purple-500/80 to-purple-700/90',
    border: 'border-purple-400/40',
    iconBg: 'bg-purple-500',
    badge: '⭐',
    titleColor: 'text-white',
    descColor: 'text-white/90',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-purple-700',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
  },
  {
    slug: 'dosage-calculator',
    icon: 'vaccines',
    image: '/images/children-3d/dosage-calculator.png',
    color: 'from-rose-500/80 to-rose-700/90',
    border: 'border-rose-400/40',
    iconBg: 'bg-rose-500',
    badge: '💊',
    titleColor: 'text-white',
    descColor: 'text-pink-50',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-pink-700',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
  },
  {
    slug: 'vaccination-tracker',
    icon: 'medical_services',
    image: '/images/children-3d/vaccination-tracker.png',
    color: 'from-cyan-500/80 to-cyan-700/90',
    border: 'border-cyan-400/40',
    iconBg: 'bg-cyan-500',
    badge: '🛡️',
    titleColor: 'text-white',
    descColor: 'text-cyan-50',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-cyan-700',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
  },
  {
    slug: 'food-guide',
    icon: 'restaurant',
    image: '/images/children-3d/food-guide.png',
    color: 'from-lime-500/80 to-lime-700/90',
    border: 'border-lime-400/40',
    iconBg: 'bg-lime-500',
    badge: '🥗',
    titleColor: 'text-white',
    descColor: 'text-white/95',
    badgeBg: 'bg-black/50',
    btnTextColor: 'text-green-700',
    shadow: 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]',
  },
  {
    slug: 'first-aid',
    icon: 'emergency',
    image: '/images/children-3d/first-aid.png',
    color: 'from-red-500/80 to-red-700/90',
    border: 'border-red-400/40',
    iconBg: 'bg-red-500',
    badge: '🚨',
    titleColor: 'text-white',
    descColor: 'text-red-50',
    badgeBg: 'bg-black/40',
    btnTextColor: 'text-red-700',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
  },
] as const;

/* Particle config — kept static to avoid re-renders */
const PARTICLES = [
  { size: 6, top: '12%', start: '8%',  delay: '0s',   dur: '7s',  anim: 'particleFloat1' },
  { size: 4, top: '55%', start: '15%', delay: '1.2s', dur: '9s',  anim: 'particleFloat2' },
  { size: 8, top: '25%', start: '72%', delay: '0.4s', dur: '8s',  anim: 'particleFloat3' },
  { size: 5, top: '70%', start: '85%', delay: '2s',   dur: '7.5s', anim: 'particleFloat1' },
  { size: 3, top: '38%', start: '48%', delay: '0.8s', dur: '10s', anim: 'particleFloat2' },
  { size: 7, top: '80%', start: '30%', delay: '1.6s', dur: '6.5s', anim: 'particleFloat3' },
];

export default function ChildrenHubPage() {
  const t = useTranslations('children');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const timer = setTimeout(() => setMounted(true), 10); return () => clearTimeout(timer); }, []);

  return (
    <div data-theme="children" className="space-y-8">
      {/* ─── Scoped keyframes via styled-jsx ─── */}
      <style jsx>{`
        @keyframes heroGradient {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0) scale(1);   opacity: 0.5; }
          50%      { transform: translateY(-18px) scale(1.3); opacity: 0.9; }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0) translateX(0) scale(1);   opacity: 0.4; }
          50%      { transform: translateY(-14px) translateX(10px) scale(1.2); opacity: 0.8; }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translateY(0) translateX(0) scale(1);   opacity: 0.6; }
          50%      { transform: translateY(-22px) translateX(-8px) scale(1.15); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1);   }
          50%      { opacity: 0.8; transform: scale(1.15); }
        }
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%);  }
        }
        .hero-gradient {
          background-size: 200% 200%;
          animation: heroGradient 8s ease infinite;
        }
        .shimmer-cta {
          position: relative;
          overflow: hidden;
        }
        .shimmer-cta::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
          animation: shimmerSlide 2.5s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* ─── Premium Hero Section ─── */}
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-10 hero-gradient bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl">
        {/* Decorative blur orbs */}
        <div className="absolute -top-16 -start-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -end-12 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 start-1/3 w-24 h-24 rounded-full bg-white/8 blur-2xl pointer-events-none" style={{ animation: 'pulseGlow 4s ease-in-out infinite' }} />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              insetInlineStart: p.start,
              animation: `${p.anim} ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}

        {/* Hero content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {/* Double-ring glassmorphism icon */}
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-2xl bg-white/10 blur-sm" />
                <div className="relative w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{t('title')}</h1>
                <p className="text-white/70 text-sm mt-0.5">{t('subtitle')}</p>
              </div>
            </div>

            {/* Premium feature badges */}
            <div className="flex gap-2.5 mt-5 flex-wrap">
              <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pediatrics</span>
                {t('offlineBadge')}
              </span>
              <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                {t('savedLocallyBadge')}
              </span>
              <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>accessibility</span>
                {t('privacyFirstBadge')}
              </span>
            </div>
          </div>

          {/* Glass mascot box — decorative, large screens */}
          <div className="hidden lg:flex w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 items-center justify-center flex-shrink-0 shadow-xl">
            <span className="material-symbols-outlined text-white/80 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
          </div>
        </div>
      </section>

      {/* ─── Section title with decorative divider ─── */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent" />
        <h2 className="text-xl font-extrabold text-on-surface tracking-tight">{t('chooseTool')}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent" />
      </div>

      {/* ─── Tool cards — image as background (UNCHANGED structure) ─── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map(({ slug, image, color, border, badge, titleColor, descColor, badgeBg, btnTextColor, shadow }, idx) => (
            <Link
              key={slug}
              href={`/${locale}/dashboard/children/${slug}`}
              data-child-tool={slug}
              className={`group relative rounded-2xl overflow-hidden ambient-shadow border ${border} hover:-translate-y-2 hover:scale-[1.03] active:scale-95 transition-all duration-500 flex flex-col min-h-[200px] ${
                mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
              }`}
              style={{
                transitionDelay: staggerDelay(idx, 80),
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${image})` }}
              />
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />

              {/* Floating badge — top-right */}
              <span className="absolute top-3 end-3 z-20 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                {badge} {t(`tools.${slug}.badge` as never)}
              </span>

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-end h-full p-5 items-start">
                <h3 className="font-bold text-white text-base mb-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md w-fit">
                  {t(`tools.${slug}.title` as never)}
                </h3>
                <p className="text-white/90 text-xs leading-relaxed line-clamp-2 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md w-fit mb-3">
                  {t(`tools.${slug}.desc` as never)}
                </p>
                {/* Shimmer CTA */}
                <div className="shimmer-cta bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 hover:bg-white/90 transition-all duration-300 w-fit shadow-md">
                  {t('openTool')}
                  <span className="material-symbols-outlined text-sm child-icon group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform duration-300 text-primary">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Premium Disclaimer ─── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-container via-surface-container-lowest to-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-md">
        <div className="absolute -top-4 -end-4 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface">{t('medicalDisclaimer')} </span>
            {t('disclaimerText')}
          </p>
        </div>
      </div>
    </div>
  );
}
