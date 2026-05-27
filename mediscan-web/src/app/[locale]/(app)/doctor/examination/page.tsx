'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useExamStore } from '@/stores/examStore';
import { BRAIN_TUMOR_STEPS } from '@/data/exam-steps';
import Link from 'next/link';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';

function ExaminationLandingContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { setPatient } = useExamStore();

  const patientId = searchParams.get('patientId');
  const patientName = searchParams.get('patientName');

  useEffect(() => {
    if (patientId && patientName) {
      setPatient(patientId, patientName);
    }
  }, [patientId, patientName, setPatient]);

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 py-8 ${ANIM_CLASSES.visible}`}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">
            {t('exam.brainTumor.title')}
          </h1>
          {patientName && (
            <p className="text-on-surface-variant text-lg">
              Patient: <span className="font-semibold text-on-surface">{patientName}</span>
            </p>
          )}
        </div>
        <Link
          href="/doctor/examination/run"
          className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all text-lg shadow-lg hover:shadow-xl"
        >
          {t('exam.shared.start')}
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 ambient-shadow">
        <h2 className="text-xl font-bold text-on-surface mb-6">{t('exam.brainTumor.subtitle')}</h2>
        
        <div className="space-y-4">
          {BRAIN_TUMOR_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex gap-4 p-4 rounded-xl bg-surface-container-low transition-all ${ANIM_CLASSES.leftIn}`}
              style={{ transitionDelay: staggerDelay(index, 100) }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                {index + 1}
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg mb-1">{t(step.titleKey)}</h3>
                <p className="text-on-surface-variant line-clamp-2" dir="rtl">{t(step.instructionKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExaminationLandingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ExaminationLandingContent />
    </Suspense>
  );
}
