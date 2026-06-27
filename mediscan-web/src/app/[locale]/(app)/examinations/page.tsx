'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { Brain, Ribbon } from 'lucide-react';

const EXAM_CARDS = [
  {
    slug: 'brain',
    titleKey: 'exam.brainTumor.title',
    subtitleKey: 'exam.brainTumor.subtitle',
    icon: <Brain />,
    steps: 5,
    // teal/primary color matching profile page gradient cards
    accentFrom: 'from-[#00685f]',
    accentTo: 'to-[#006780]',
    borderColor: 'border-[#00685f]/50',
    glowColor: 'rgba(0,104,95,0.25)',
    href: (locale: string) => `/${locale}/doctor/examination`,
    image: '/images/examinations/Brain-tumer.jpg',
    overlayColor: '#9333ea',
  },
  {
    slug: 'breast',
    titleKey: 'exam.hub.breastCard',
    subtitleKey: 'exam.breastSelf.subtitle',
    icon: <Ribbon />,
    steps: 6,
    accentFrom: 'from-pink-600',
    accentTo: 'to-rose-500',
    borderColor: 'border-pink-500/50',
    glowColor: 'rgba(219,39,119,0.25)',
    href: (locale: string) => `/${locale}/dashboard/self-exam/breast`,
    image: '/images/examinations/Braest-Cancer.jpg',
    overlayColor: '#db2777',
  },
] as const;

export default function ExaminationsHubPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const [mounted, setMounted] = useState(false);
  const [remindMonthly, setRemindMonthly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setRemindMonthly(localStorage.getItem('selfExam_remindMonthly') === 'true');
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemindToggle = () => {
    const newValue = !remindMonthly;
    setRemindMonthly(newValue);
    localStorage.setItem('selfExam_remindMonthly', newValue.toString());
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 py-8 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
      {/* Header */}
      <DashboardHero
        icon="medical_information"
        title={t('nav.examinations')}
        subtitle={t('exam.hub.subtitle')}
        action={
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-colors">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={remindMonthly} onChange={handleRemindToggle} />
              <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ${remindMonthly ? 'bg-primary' : 'bg-surface-container-high'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-sm ${remindMonthly ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <span className="font-medium text-white select-none text-sm">{t('exam.shared.remindMonthly')}</span>
          </label>
        }
      />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EXAM_CARDS.map((card, idx) => (
          <Link
            key={card.slug}
            href={card.href(locale)}
            className={`group relative block rounded-2xl overflow-hidden ambient-shadow border-2 ${card.borderColor} hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02] active:scale-[0.99] ${
              mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
            }`}
            style={{
              transitionDelay: staggerDelay(idx, 80),
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: `0 4px 24px ${card.glowColor}`,
            }}
          >
            {/* Background image — zooms on hover */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
              style={{ backgroundImage: `url('${card.image}')` }}
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10 transition-opacity duration-300 group-hover:from-black/75" />
            {/* Subtle color tint overlay */}
            <div className="absolute inset-0 mix-blend-multiply opacity-20 pointer-events-none" style={{ backgroundColor: card.overlayColor }} />

            <div className="relative z-10 flex flex-col h-full w-full">
              {/* Gradient top bar — same style as profile page appointment card */}
              <div className={`h-2 w-full bg-gradient-to-r ${card.accentFrom} ${card.accentTo}`} />

              {/* Card body */}
              <div className="p-5 flex flex-col flex-1 text-white justify-end mt-12 items-start">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.accentFrom} ${card.accentTo} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-6 [&>svg]:h-6 text-white`}
                  style={{ boxShadow: `0 4px 12px ${card.glowColor}` }}
                >
                  {typeof card.icon === 'string' ? (
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                  ) : (
                    card.icon
                  )}
                </div>

                {/* Text */}
                <h2 className="text-xl font-bold text-white mb-2 transition-colors duration-200 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                  {t(card.titleKey)}
                </h2>
                <p className="text-white/90 text-sm leading-relaxed mb-4 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                  {t(card.subtitleKey)}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-3 w-full">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r ${card.accentFrom} ${card.accentTo} text-white`}>
                    {card.steps} {t('exam.shared.stepOf', { step: '', total: '' }).split('{')[0].trim() || 'steps'}
                  </span>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.accentFrom} ${card.accentTo} text-white flex items-center justify-center group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-300`}>
                    <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
