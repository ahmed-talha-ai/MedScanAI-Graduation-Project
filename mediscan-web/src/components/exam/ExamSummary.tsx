'use client';

import { useTranslations } from 'next-intl';
import { useExamStore } from '@/stores/examStore';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import type { ExamStep } from '@/types/exam';

interface ExamSummaryProps {
  steps: ExamStep[];
  onGenerateReport: () => void;
  onSaveAndClose: () => void;
}

export function ExamSummary({ steps, onGenerateReport, onSaveAndClose }: ExamSummaryProps) {
  const t = useTranslations();
  const { results } = useExamStore();

  const getStatusConfig = (result?: string) => {
    switch (result) {
      case 'normal':
        return { label: t('exam.shared.normal'), classes: 'bg-primary/10 text-primary' };
      case 'done':
        return { label: t('exam.shared.done'), classes: 'bg-primary/10 text-primary' };
      case 'abnormal':
        return { label: t('exam.shared.abnormal'), classes: 'bg-tertiary/10 text-tertiary' };
      case 'skipped':
        return { label: t('exam.shared.skip'), classes: 'bg-surface-container-high text-on-surface-variant border border-outline-variant' };
      case 'concern':
        return { label: t('exam.shared.concern'), classes: 'bg-error-container text-error' };
      default:
        return { label: 'Pending', classes: 'bg-surface-container text-on-surface-variant' };
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-3 mb-8">
        {steps.map((step, index) => {
          const result = results[step.id];
          const config = getStatusConfig(result);

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest ambient-shadow transition-all ${ANIM_CLASSES.scaleIn}`}
              style={{ transitionDelay: staggerDelay(index, 150) }}
            >
              <span className="font-medium text-on-surface">{t(step.titleKey)}</span>
              <span className={`px-3 py-1 text-sm font-bold rounded-full ${config.classes}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onGenerateReport}
          className="flex-1 py-4 bg-primary text-on-primary rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t('exam.shared.generateReport')}
        </button>
        <button
          onClick={onSaveAndClose}
          className="flex-1 py-4 border border-outline-variant text-on-surface rounded-xl font-bold hover:bg-surface-container-low active:scale-95 transition-all"
        >
          {t('exam.shared.saveClose')}
        </button>
      </div>
    </div>
  );
}
