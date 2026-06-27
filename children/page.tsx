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
    cardGradient: 'from-teal-50 via-emerald-50/80 to-cyan-50',
    glowColor: 'rgba(20, 184, 166, 0.35)',
    borderFrom: '#5eead4',
    borderVia: '#6ee7b7',
    borderTo: '#22d3ee',
    btnGradient: 'from-teal-500 to-cyan-600',
    textColor: 'text-teal-900',
    descColor: 'text-teal-700/60',
    iconBg: 'bg-gradient-to-br from-teal-100 to-emerald-100',
  },
  {
    slug: 'bmi-calculator',
    icon: 'monitor_weight',
    image: '/images/children-3d/bmi-calculator.png',
    title: 'BMI Calculator',
    desc: 'Calculate body-mass index and weight category',
    cardGradient: 'from-green-50 via-lime-50/80 to-emerald-50',
    glowColor: 'rgba(34, 197, 94, 0.35)',
    borderFrom: '#86efac',
    borderVia: '#bef264',
    borderTo: '#34d399',
    btnGradient: 'from-green-500 to-emerald-600',
    textColor: 'text-green-900',
    descColor: 'text-green-700/60',
    iconBg: 'bg-gradient-to-br from-green-100 to-lime-100',
  },
  {
    slug: 'symptom-checker',
    icon: 'thermometer',
    image: '/images/children-3d/symptom-checker.png',
    title: 'Symptom Checker',
    desc: 'Checklist-based triage guidance for common symptoms',
    cardGradient: 'from-rose-50 via-pink-50/80 to-fuchsia-50',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    borderFrom: '#fda4af',
    borderVia: '#f9a8d4',
    borderTo: '#e879f9',
    btnGradient: 'from-rose-500 to-pink-600',
    textColor: 'text-rose-900',
    descColor: 'text-rose-700/60',
    iconBg: 'bg-gradient-to-br from-rose-100 to-pink-100',
  },
  {
    slug: 'milestones',
    icon: 'psychology',
    image: '/images/children-3d/milestones.png',
    title: 'Developmental Milestones',
    desc: 'Track age-appropriate developmental achievements',
    cardGradient: 'from-blue-50 via-indigo-50/80 to-violet-50',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    borderFrom: '#93c5fd',
    borderVia: '#a5b4fc',
    borderTo: '#8b5cf6',
    btnGradient: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-900',
    descColor: 'text-blue-700/60',
    iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
  },
  {
    slug: 'dosage-calculator',
    icon: 'vaccines',
    image: '/images/children-3d/dosage-calculator.png',
    title: 'Dosage Calculator',
    desc: 'Weight-based Paracetamol & Ibuprofen dosing',
    cardGradient: 'from-orange-50 via-amber-50/80 to-yellow-50',
    glowColor: 'rgba(251, 146, 60, 0.35)',
    borderFrom: '#fdba74',
    borderVia: '#fcd34d',
    borderTo: '#f59e0b',
    btnGradient: 'from-orange-500 to-amber-600',
    textColor: 'text-orange-900',
    descColor: 'text-orange-700/60',
    iconBg: 'bg-gradient-to-br from-orange-100 to-amber-100',
  },
  {
    slug: 'vaccination-tracker',
    icon: 'medical_services',
    image: '/images/children-3d/vaccination-tracker.png',
    title: 'Vaccination Tracker',
    desc: 'Record and schedule your child\'s vaccinations',
    cardGradient: 'from-emerald-50 via-teal-50/80 to-green-50',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    borderFrom: '#6ee7b7',
    borderVia: '#5eead4',
    borderTo: '#2dd4bf',
    btnGradient: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-900',
    descColor: 'text-emerald-700/60',
    iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
  },
  {
    slug: 'food-guide',
    icon: 'restaurant',
    image: '/images/children-3d/food-guide.png',
    title: 'Food Guide',
    desc: 'Age-appropriate foods: safe, avoid, and introduce',
    cardGradient: 'from-yellow-50 via-amber-50/80 to-orange-50',
    glowColor: 'rgba(234, 179, 8, 0.35)',
    borderFrom: '#fde047',
    borderVia: '#fbbf24',
    borderTo: '#fb923c',
    btnGradient: 'from-yellow-500 to-amber-600',
    textColor: 'text-yellow-900',
    descColor: 'text-yellow-700/60',
    iconBg: 'bg-gradient-to-br from-yellow-100 to-amber-100',
  },
  {
    slug: 'first-aid',
    icon: 'emergency',
    image: '/images/children-3d/first-aid.png',
    title: 'First Aid Hub',
    desc: 'Step-by-step guides for 10 common emergencies',
    cardGradient: 'from-red-50 via-rose-50/80 to-pink-50',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    borderFrom: '#fca5a5',
    borderVia: '#fb7185',
    borderTo: '#f43f5e',
    btnGradient: 'from-red-500 to-rose-600',
    textColor: 'text-red-900',
    descColor: 'text-red-700/60',
    iconBg: 'bg-gradient-to-br from-red-100 to-rose-100',
  },
] as const;

export default function ChildrenHubPage() {
  const t = useTranslations('children');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  return (
    <>
      {/* Premium custom styles — single styled-jsx block, no nesting */}
      <style jsx>{`
        @keyframes heroGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(4px) rotate(-1deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -20px) scale(1.1); }
          50% { transform: translate(-5px, -35px) scale(0.95); }
          75% { transform: translate(15px, -15px) scale(1.05); }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-15px, -10px) scale(1.05); }
          50% { transform: translate(10px, -25px) scale(1.1); }
          75% { transform: translate(-8px, -18px) scale(0.95); }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(8px, -15px) scale(1.08); }
          66% { transform: translate(-12px, -30px) scale(0.92); }
        }
        .hero-gradient {
          background-size: 200% 200%;
          animation: heroGradient 8s ease infinite;
        }
        .float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .card-glow {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
        }
        .card-glow:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 0 40px var(--glow-color), 0 20px 60px -15px rgba(0, 0, 0, 0.15);
        }
        .shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transform: translateX(-100%);
        }
        .shimmer-btn:hover::after {
          animation: shimmer 0.8s ease forwards;
        }
        .gradient-border {
          position: relative;
          background-clip: padding-box;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.5px;
          background: linear-gradient(135deg, var(--border-from), var(--border-via), var(--border-to));
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .particle {
          pointer-events: none;
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(1px);
        }
      `}</style>

      <div className="space-y-10">
        {/* ═══════════════════════════════════════════════════════════
            Hero Section — Premium Animated Gradient + Particles
            ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-3xl p-10 hero-gradient bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl">
          {/* Animated floating particles */}
          <div className="particle w-4 h-4 top-[15%] start-[10%]" style={{ animation: 'particleFloat1 7s ease-in-out infinite' }} />
          <div className="particle w-6 h-6 top-[60%] start-[80%]" style={{ animation: 'particleFloat2 9s ease-in-out infinite 1s' }} />
          <div className="particle w-3 h-3 top-[30%] start-[65%]" style={{ animation: 'particleFloat3 6s ease-in-out infinite 2s' }} />
          <div className="particle w-5 h-5 top-[75%] start-[25%]" style={{ animation: 'particleFloat1 8s ease-in-out infinite 0.5s' }} />
          <div className="particle w-2 h-2 top-[20%] start-[45%]" style={{ animation: 'particleFloat2 5s ease-in-out infinite 3s' }} />

          {/* Decorative glowing orbs */}
          <div className="absolute -top-20 -start-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -end-16 w-56 h-56 rounded-full bg-white/8 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 end-12 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" style={{ animation: 'pulseGlow 4s ease-in-out infinite' }} />

          <div className="relative z-10 flex items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-5">
                {/* Premium icon with double ring */}
                <div className="relative">
                  <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-white/10 blur-md" />
                  <div className="relative w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/25 shadow-lg">
                    <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">{t('title')}</h1>
                  <p className="text-white/75 text-sm mt-1 font-medium">{t('subtitle')}</p>
                </div>
              </div>

              {/* Premium badges */}
              <div className="flex gap-3 mt-6 flex-wrap">
                <span className="bg-white/15 backdrop-blur-md text-white text-xs font-semibold px-5 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg hover:bg-white/25 transition-colors duration-300 cursor-default">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
                  {t('offlineBadge')}
                </span>
                <span className="bg-white/15 backdrop-blur-md text-white text-xs font-semibold px-5 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg hover:bg-white/25 transition-colors duration-300 cursor-default">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>storage</span>
                  {t('savedLocallyBadge')}
                </span>
                <span className="bg-white/15 backdrop-blur-md text-white text-xs font-semibold px-5 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg hover:bg-white/25 transition-colors duration-300 cursor-default">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>privacy_tip</span>
                  {t('privacyFirstBadge')}
                </span>
              </div>
            </div>

            {/* Mascot area — premium glassmorphism card */}
            <div className="hidden lg:flex items-center gap-5 bg-white/10 backdrop-blur-xl rounded-3xl px-8 py-5 border border-white/20 shadow-2xl float-slow">
              <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-white text-5xl drop-shadow-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div>
                <p className="text-white font-extrabold text-xl tracking-tight">Kids Portal</p>
                <p className="text-white/60 text-sm font-medium">8 Premium Tools</p>
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-white/40" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            Tool Cards — Premium Gradient + Glass + Glow
            ═══════════════════════════════════════════════════════════ */}
        <section>
          {/* Section title with decorative accent */}
          <div className="flex items-center gap-4 mb-7">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent" />
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight">{t('chooseTool')}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOLS.map(({ slug, icon, cardGradient, glowColor, borderFrom, borderVia, borderTo, btnGradient, textColor, descColor, iconBg }, idx) => (
              <Link
                key={slug}
                href={`/${locale}/dashboard/children/${slug}`}
                className={`group relative card-glow rounded-2xl p-6 shadow-lg active:scale-[0.97] overflow-hidden flex flex-col items-center text-center gap-4 bg-gradient-to-br ${cardGradient} gradient-border ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
                  }`}
                style={{
                  '--glow-color': glowColor,
                  '--border-from': borderFrom,
                  '--border-via': borderVia,
                  '--border-to': borderTo,
                  transitionDelay: staggerDelay(idx, 80),
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transitionDuration: '500ms',
                } as React.CSSProperties}
              >
                {/* Hover glow overlay */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${glowColor}, transparent 70%)`,
                  }}
                />

                {/* Decorative corner shapes */}
                <div className="absolute -top-8 -end-8 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:scale-[2] transition-transform duration-1000" />
                <div className="absolute -bottom-6 -start-6 w-20 h-20 rounded-full bg-white/15 blur-xl pointer-events-none group-hover:scale-[1.8] transition-transform duration-1000" />

                {/* Image — large, floating, with shadow */}
                {'image' in TOOLS[idx] && (TOOLS[idx] as any).image ? (
                  <div
                    className="relative w-28 h-28 rounded-2xl flex items-center justify-center float-slow"
                    style={{ animationDelay: `${idx * 0.4}s` }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-white/30 blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <img
                      src={(TOOLS[idx] as any).image}
                      alt={t(`tools.${slug}.title` as never)}
                      className="relative w-full h-full object-contain drop-shadow-xl group-hover:scale-110 group-hover:drop-shadow-2xl transition-all duration-500"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-28 h-28 rounded-2xl ${iconBg} flex items-center justify-center float-slow shadow-lg`}
                    style={{ animationDelay: `${idx * 0.4}s` }}
                  >
                    <span className="material-symbols-outlined text-5xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                )}

                {/* Text content */}
                <div className="relative z-10 flex-1">
                  <h3 className={`font-extrabold ${textColor} text-[15px] mb-1.5 tracking-tight`}>{t(`tools.${slug}.title` as never)}</h3>
                  <p className={`text-[11px] ${descColor} leading-relaxed font-medium`}>{t(`tools.${slug}.desc` as never)}</p>
                </div>

                {/* Premium CTA Button — gradient + shimmer */}
                <div className={`relative z-10 shimmer-btn bg-gradient-to-r ${btnGradient} text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg group-hover:shadow-xl group-hover:gap-3 transition-all duration-300`}>
                  {t('openTool')}
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform duration-300">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            Disclaimer — Premium frosted style
            ═══════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-surface-container via-surface-container-lowest to-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-md">
          <div className="absolute -top-4 -end-4 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <span className="font-bold text-on-surface">{t('medicalDisclaimer')}</span>{' '}
              {t('disclaimerText')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
