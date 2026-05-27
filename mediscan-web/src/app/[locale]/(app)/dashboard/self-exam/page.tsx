'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';

export default function SelfExamHubPage() {
  const t = useTranslations();
  const [breastDate, setBreastDate] = useState<string | null>(null);
  const [skinDate, setSkinDate] = useState<string | null>(null);
  const [remindMonthly, setRemindMonthly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      setBreastDate(localStorage.getItem('selfExam_breast_lastComplete'));
      setSkinDate(localStorage.getItem('selfExam_skin_lastComplete'));
      setRemindMonthly(localStorage.getItem('selfExam_remindMonthly') === 'true');
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleRemindToggle = () => {
    const newValue = !remindMonthly;
    setRemindMonthly(newValue);
    localStorage.setItem('selfExam_remindMonthly', newValue.toString());
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 py-8 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">{t('exam.hub.title')}</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl">{t('exam.hub.subtitle')}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breast Exam Card */}
        <Link
          href="/dashboard/self-exam/breast"
          className={`group block p-8 rounded-3xl bg-surface-container-lowest ambient-shadow hover:shadow-xl transition-all duration-500 border border-transparent hover:border-primary/20 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
          style={{ transitionDelay: staggerDelay(0, 100) }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">woman</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
            {t('exam.hub.breastCard')}
          </h2>
          <p className="text-on-surface-variant mb-6">{t('exam.breastSelf.subtitle')}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm font-medium text-on-surface-variant">
              {breastDate ? t('exam.shared.lastCompleted', { date: formatDate(breastDate) }) : 'Not completed yet'}
            </span>
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2">
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </div>
          </div>
        </Link>

        {/* Skin Exam Card */}
        <Link
          href="/dashboard/self-exam/skin"
          className={`group block p-8 rounded-3xl bg-surface-container-lowest ambient-shadow hover:shadow-xl transition-all duration-500 border border-transparent hover:border-tertiary/20 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
          style={{ transitionDelay: staggerDelay(1, 100) }}
        >
          <div className="w-16 h-16 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">dermatology</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-tertiary transition-colors">
            {t('exam.hub.skinCard')}
          </h2>
          <p className="text-on-surface-variant mb-6">{t('exam.skinSelf.subtitle')}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm font-medium text-on-surface-variant">
              {skinDate ? t('exam.shared.lastCompleted', { date: formatDate(skinDate) }) : 'Not completed yet'}
            </span>
            <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2">
              <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
