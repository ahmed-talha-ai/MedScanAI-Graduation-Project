'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useExamStore } from '@/stores/examStore';
import { ExamWizard } from '@/components/exam/ExamWizard';
import { Typewriter } from '@/components/ui/Typewriter';
import { BRAIN_TUMOR_STEPS } from '@/data/exam-steps';
import { ANIM_CLASSES } from '@/lib/animations';

function BrainExamContent() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const searchParams = useSearchParams();
  const { setPatient } = useExamStore();
  const [view, setView] = useState<'wizard' | 'complete'>('wizard');

  const patientId = searchParams.get('patientId');
  const patientName = searchParams.get('patientName');

  useEffect(() => {
    if (patientId && patientName) {
      setPatient(patientId, patientName);
    }
  }, [patientId, patientName, setPatient]);

  const handleComplete = () => {
    setView('complete');
  };

  if (view === 'complete') {
    return (
      <div className={`w-full max-w-2xl mx-auto px-4 py-12 ${ANIM_CLASSES.visible}`}>
        <div className="bg-primary/5 dark:bg-primary/10 backdrop-blur-sm rounded-3xl p-8 text-center ambient-shadow border border-primary/20">
          <div className={`relative w-24 h-24 mx-auto mb-6 ${ANIM_CLASSES.scaleIn}`}>
            <div className="absolute inset-0 bg-primary/20 rounded-full anim-ring-pulse"></div>
            <div className="absolute inset-0 bg-primary text-on-primary rounded-full flex items-center justify-center anim-bounce-in shadow-xl">
              <span className="text-5xl">🌟</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-on-surface mb-4">{t('exam.landing.brainCompleteTitle')}</h2>
          <p className="text-lg text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
            {t('exam.landing.brainCompleteMsg')}
          </p>

          {/* Empathetic Terminal Panel */}
          <div className="bg-surface-container-highest text-on-surface p-6 rounded-2xl font-mono text-sm shadow-inner text-start mb-8 border-s-4 border-primary relative overflow-hidden">
            <div className="flex gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <Typewriter as="p" text="$ systemctl status exam_session --complete" className="text-primary mb-2" speed={25} />
            <Typewriter as="p" text="● All 5 neurological screening steps completed." className="opacity-80 mb-1 text-xs" speed={30} delay={800} />
            <Typewriter as="p" text="● Results saved. Ready for AI analysis." className="text-emerald-500 font-bold text-xs" speed={30} delay={2000} />
          </div>

          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <Link
              href={`/${locale}/dashboard/ai-tools/brain-tumor`}
              className="w-full py-4 signature-gradient text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span className="material-symbols-outlined">psychology</span>
              {t('exam.landing.brainCta')}
            </Link>
            <button
              onClick={() => router.push(`/${locale}/examinations`)}
              className="w-full py-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              {t('exam.shared.backToDashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ANIM_CLASSES.visible} w-full py-8 px-4`}>
      {patientName && (
        <div className="max-w-3xl mx-auto mb-4">
          <p className="text-on-surface-variant text-sm">
            {t('nav.examinations')} ·{' '}
            <span className="font-semibold text-on-surface">{patientName}</span>
          </p>
        </div>
      )}
      <ExamWizard
        steps={BRAIN_TUMOR_STEPS}
        titleKey="exam.brainTumor.title"
        variant="clinical"
        onComplete={handleComplete}
      />
    </div>
  );
}

export default function ExaminationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading...</div>}>
      <BrainExamContent />
    </Suspense>
  );
}
