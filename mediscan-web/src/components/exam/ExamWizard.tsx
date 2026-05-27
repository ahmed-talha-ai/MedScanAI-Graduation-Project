'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ExamStep } from '@/types/exam';
import { useExamStore } from '@/stores/examStore';
import { ExamStepCard } from './ExamStepCard';
import { ExamProgressDots } from './ExamProgressDots';
import { ExamTimer } from './ExamTimer';
import { ANIM_CLASSES } from '@/lib/animations';

interface ExamWizardProps {
  steps: ExamStep[];
  titleKey: string;
  variant: 'clinical' | 'self-exam';
  onComplete: () => void;
  onConcern?: () => void;
}

export function ExamWizard({ steps, titleKey, variant, onComplete, onConcern }: ExamWizardProps) {
  const t = useTranslations();
  const { setResult } = useExamStore();
  const [activeStep, setActiveStep] = useState(0);

  const step = steps[activeStep];
  const handleResult = (stepIndex: number, result: 'normal' | 'abnormal' | 'done' | 'skipped' | 'concern') => {
    setResult(steps[stepIndex].id, result);

    if (result === 'concern' && onConcern) {
      onConcern();
      return;
    }

    if (stepIndex < steps.length - 1) {
      setActiveStep(stepIndex + 1);
      // Optional: scroll into view
    } else {
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">{t(titleKey)}</h1>
        <p className="text-sm text-on-surface-variant">
          {t('exam.shared.stepOf', { step: activeStep + 1, total: steps.length })}
        </p>
        <div className="mt-4 scale-90 transform origin-top max-w-xs mx-auto">
          <ExamProgressDots total={steps.length} current={activeStep} />
        </div>
      </div>

      {/* Accordion Stack */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isPast = index < activeStep;
          const isTimer = step.kind === 'timer' && step.timerSeconds;

          return (
            <div 
              key={step.id} 
              className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
                isActive 
                  ? 'bg-surface-container-lowest border-primary/40 ambient-shadow ring-1 ring-primary/20' 
                  : isPast 
                    ? 'bg-surface-container-low border-outline-variant/30 opacity-75' 
                    : 'bg-surface-container-lowest border-outline-variant/30 opacity-50'
              }`}
            >
              {/* Accordion Header */}
              <button 
                onClick={() => setActiveStep(index)}
                className="w-full flex items-center justify-between p-5 text-start"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    isActive ? 'bg-primary text-on-primary shadow-md shadow-primary/30' : isPast ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {isPast ? <span className="material-symbols-outlined text-lg">check</span> : index + 1}
                  </div>
                  <h2 className={`text-lg font-bold transition-colors ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {t(step.titleKey)}
                  </h2>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? 'rotate-180 text-primary' : 'text-on-surface-variant'}`}>
                  expand_more
                </span>
              </button>

              {/* Accordion Body */}
              <div 
                className={`transition-all duration-500 ease-in-out ${isActive ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
              >
                <div className="p-5 pt-0 border-t border-outline-variant/10">
                  <ExamStepCard
                    step={step}
                    index={index}
                    isActive={isActive}
                    variant={variant}
                    onResult={(res) => handleResult(index, res)}
                    hideHeader={true}
                  >
                    {isTimer && isActive && (
                      <div className="flex-shrink-0 w-full mb-4">
                        <ExamTimer
                          duration={step.timerSeconds!}
                          onComplete={() => {}}
                        />
                      </div>
                    )}
                  </ExamStepCard>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeStep === steps.length - 1 && (
         <div className="pt-6 flex justify-center">
            <button
               onClick={onComplete}
               className="btn-primary w-full max-w-sm"
            >
               {t('exam.shared.finish')}
            </button>
         </div>
      )}
    </div>
  );
}
