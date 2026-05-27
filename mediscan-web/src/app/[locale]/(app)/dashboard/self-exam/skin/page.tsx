'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ExamWizard } from '@/components/exam/ExamWizard';
import { Typewriter } from '@/components/ui/Typewriter';
import { SKIN_SELF_STEPS } from '@/data/exam-steps';
import { ANIM_CLASSES } from '@/lib/animations';

export default function SkinSelfExamPage() {
  const t = useTranslations();
  const [view, setView] = useState<'wizard' | 'concern' | 'complete'>('wizard');

  const handleComplete = () => {
    localStorage.setItem('selfExam_skin_lastComplete', new Date().toISOString());
    setView('complete');
  };

  if (view === 'concern') {
    return (
      <div className={`w-full max-w-2xl mx-auto px-4 py-12 ${ANIM_CLASSES.visible}`}>
        <div className="bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100 rounded-3xl p-8 text-center ambient-shadow border border-amber-200 dark:border-amber-900/50">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">favorite</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">{t('exam.shared.concernTitle')}</h2>
          
          {/* Empathetic Terminal Panel */}
          <div className="bg-surface-container-highest text-on-surface p-6 rounded-2xl font-mono text-sm shadow-inner text-start mb-8 border-s-4 border-amber-500 relative overflow-hidden">
            <div className="absolute top-0 end-0 p-3 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-4xl">terminal</span>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <Typewriter as="p" text="$ systemctl analyze symptom_report" className="text-amber-600 dark:text-amber-400 mb-3" speed={20} />
            <Typewriter as="p" text={t('exam.shared.concernTerminal1')} className="opacity-90 mb-1" speed={30} delay={800} />
            <Typewriter as="p" text={t('exam.shared.concernTerminal2')} className="opacity-90 mb-3" speed={30} delay={2000} />
            <Typewriter as="p" text={t('exam.shared.concernTerminalAction')} className="text-emerald-600 dark:text-emerald-400 font-bold" speed={40} delay={4000} />
          </div>
          
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <Link
              href="/dashboard/ai-tools/skin"
              className="w-full py-4 bg-amber-900 dark:bg-amber-100 text-amber-50 dark:text-amber-900 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">psychology</span>
              {t('exam.shared.tryAiAnalysis')}
            </Link>
            
            <Link
              href="/dashboard/appointments"
              className="w-full py-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-amber-200 dark:border-amber-900/50 rounded-xl font-bold hover:bg-white/80 dark:hover:bg-black/50 transition-colors flex items-center justify-center gap-2 text-amber-900 dark:text-amber-100"
            >
              <span className="material-symbols-outlined text-xl">calendar_month</span>
              {t('exam.shared.bookAppointment')}
            </Link>
            
            <button
              onClick={() => setView('wizard')}
              className="mt-4 text-sm font-medium hover:underline opacity-80"
            >
              {t('exam.shared.continueExam')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'complete') {
    return (
      <div className={`w-full max-w-2xl mx-auto px-4 py-12 ${ANIM_CLASSES.visible}`}>
        <div className="bg-primary/5 dark:bg-primary/10 backdrop-blur-sm rounded-3xl p-8 text-center ambient-shadow border border-primary/20">
          <div className={`relative w-24 h-24 mx-auto mb-6 ${ANIM_CLASSES.scaleIn}`}>
            <div className="absolute inset-0 bg-primary/20 rounded-full anim-ring-pulse"></div>
            <div className={`absolute inset-0 bg-primary text-on-primary rounded-full flex items-center justify-center anim-bounce-in shadow-xl`}>
              <span className="text-5xl">🌟</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-on-surface mb-4">{t('landing.brainCompleteTitle')}</h2>
          <p className="text-lg text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed" dir={t('landing.brainCompleteMsg').includes('لو لقيت') ? 'rtl' : 'ltr'}>
            {t('landing.brainCompleteMsg')}
          </p>
          
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <Link
              href="/ai-tools/brain-scan"
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {t('landing.brainCta')}
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">home</span>
              {t('exam.shared.backToDashboard')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ANIM_CLASSES.visible} max-w-4xl mx-auto py-8 px-4`}>
      <ExamWizard
        steps={SKIN_SELF_STEPS}
        titleKey="exam.skinSelf.title"
        variant="self-exam"
        onComplete={handleComplete}
        onConcern={() => setView('concern')}
      />
    </div>
  );
}
