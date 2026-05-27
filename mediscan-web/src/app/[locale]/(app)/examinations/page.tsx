'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';

export default function ExaminationsHubPage() {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [remindMonthly, setRemindMonthly] = useState(false);
  
  // We'll just read from local storage if needed, or simply render the options.
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">{t('nav.examinations')}</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl">
            {t('exam.hub.subtitle') || 'Select an examination to proceed'}
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-surface-container-lowest ambient-shadow w-fit">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={remindMonthly}
              onChange={handleRemindToggle}
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${remindMonthly ? 'bg-primary' : 'bg-surface-container-high'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${remindMonthly ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <span className="font-medium text-on-surface select-none">{t('exam.shared.remindMonthly')}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Brain Tumor Examination Card */}
        <Link
          href="/doctor/examination"
          className={`group relative block p-8 rounded-3xl bg-surface-container-lowest dark:glass-panel ambient-shadow dark:border-white/10 overflow-hidden hover:-translate-y-2 hover:scale-[1.02] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] neon-card transition-all flex flex-col h-full ${
            mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
          }`}
          style={{
            transitionDelay: staggerDelay(0, 80),
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDuration: '500ms',
          }}
        >
          <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-primary opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
            {t('exam.brainTumor.title')}
          </h2>
          <p className="text-on-surface-variant mb-6 flex-grow">{t('exam.brainTumor.subtitle')}</p>
          <div className="flex items-center justify-end mt-auto">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2">
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </div>
          </div>
        </Link>

        {/* Breast Exam Card */}
        <Link
          href="/dashboard/self-exam/breast"
          className={`group relative block p-8 rounded-3xl bg-surface-container-lowest dark:glass-panel ambient-shadow dark:border-white/10 overflow-hidden hover:-translate-y-2 hover:scale-[1.02] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] neon-card transition-all flex flex-col h-full ${
            mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
          }`}
          style={{
            transitionDelay: staggerDelay(1, 80),
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDuration: '500ms',
          }}
        >
          <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-secondary opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>woman</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-secondary transition-colors">
            {t('exam.hub.breastCard')}
          </h2>
          <p className="text-on-surface-variant mb-6 flex-grow">{t('exam.breastSelf.subtitle')}</p>
          <div className="flex items-center justify-end mt-auto">
            <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2">
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </div>
          </div>
        </Link>

        {/* Skin Exam Card */}
        <Link
          href="/dashboard/self-exam/skin"
          className={`group relative block p-8 rounded-3xl bg-surface-container-lowest dark:glass-panel ambient-shadow dark:border-white/10 overflow-hidden hover:-translate-y-2 hover:scale-[1.02] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] neon-card transition-all flex flex-col h-full ${
            mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale
          }`}
          style={{
            transitionDelay: staggerDelay(2, 80),
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDuration: '500ms',
          }}
        >
          <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-tertiary opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-tertiary group-hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>dermatology</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-tertiary transition-colors">
            {t('exam.hub.skinCard')}
          </h2>
          <p className="text-on-surface-variant mb-6 flex-grow">{t('exam.skinSelf.subtitle')}</p>
          <div className="flex items-center justify-end mt-auto">
            <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2">
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
