'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { ExamStep } from '@/types/exam';
import { useExamStore } from '@/stores/examStore';
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
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const step = steps[activeStep];
  const isLast = activeStep === steps.length - 1;

  // Play / pause video when active step changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (step.videoSrc && !step.videoSrc.endsWith('.gif')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const fullSrc = origin + step.videoSrc;
      if (video.getAttribute('src') !== step.videoSrc && video.src !== fullSrc) {
        video.src = step.videoSrc;
        video.load();
      }
      video.play().catch(() => {});
    } else {
      video?.pause();
    }
    // Scroll to top of container on step change
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep, step.videoSrc]);

  const handleResult = (result: 'normal' | 'abnormal' | 'done' | 'skipped' | 'concern') => {
    setResult(step.id, result);
    setNoteOpen(false);
    setNote('');
    if (result === 'concern' && onConcern) { onConcern(); return; }
    if (!isLast) setActiveStep(prev => prev + 1);
    else onComplete();
  };

  const goNext = () => {
    if (!isLast) setActiveStep(prev => prev + 1);
    else onComplete();
  };

  const renderMedia = () => {
    if (!step.videoSrc) {
      const iconMap: Record<string, string> = { timer: 'timer', observation: 'visibility', cognitive: 'psychology', instruction: 'info' };
      return (
        <div className="w-full rounded-2xl bg-surface-container-low flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-9xl text-on-surface-variant opacity-20">{iconMap[step.kind] || 'info'}</span>
        </div>
      );
    }
    if (step.videoSrc.endsWith('.gif')) {
      return (
        <div className="w-full flex justify-center">
          <img 
            src={step.videoSrc} 
            alt={t(step.titleKey)} 
            className="w-full max-w-lg max-h-[50vh] object-contain rounded-2xl shadow-sm" 
          />
        </div>
      );
    }
    return (
      <div className="w-full flex justify-center">
        <video
          ref={videoRef}
          src={step.videoSrc}
          loop muted playsInline
          poster={step.diagram}
          className="w-full max-w-lg max-h-[50vh] object-contain rounded-2xl shadow-sm"
          onCanPlay={() => { videoRef.current?.play().catch(() => {}); }}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6" ref={containerRef}>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-primary">
            {t('exam.shared.stepOf', { step: activeStep + 1, total: steps.length })}
          </span>
          <span className="text-xs text-on-surface-variant">{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full signature-gradient rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex gap-2 mt-3 justify-center flex-wrap">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeStep
                  ? 'w-8 h-3 bg-primary'
                  : i < activeStep
                  ? 'w-3 h-3 bg-primary/40'
                  : 'w-3 h-3 bg-surface-container-high'
              }`}
              title={t(s.titleKey)}
            />
          ))}
        </div>
      </div>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-on-surface mb-6 text-center">{t(titleKey)}</h1>

      {/* Step card */}
      <div className={`bg-surface-container-lowest rounded-2xl overflow-hidden ambient-shadow border-2 border-primary/20 ${ANIM_CLASSES.visible}`}>

        {/* Step header */}
        <div className="signature-gradient p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {activeStep + 1}
          </div>
          <h2 className="text-xl font-bold text-white leading-snug flex-1">{t(step.titleKey)}</h2>
        </div>

        {/* Video — full width */}
        <div className="p-4 flex justify-center">
          {renderMedia()}
        </div>

        {/* Timer if needed */}
        {step.kind === 'timer' && step.timerSeconds && (
          <div className="px-5 pt-2">
            <ExamTimer duration={step.timerSeconds} onComplete={() => {}} />
          </div>
        )}

        {/* Instruction */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-lg text-on-surface leading-relaxed">
            {t(step.instructionKey)}
          </p>

          {step.observationHintKey && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30">
              <span className="material-symbols-outlined text-xl text-amber-500 shrink-0 mt-0.5">lightbulb</span>
              <p className="text-base text-amber-800 dark:text-amber-300 leading-relaxed">{t(step.observationHintKey)}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-6 space-y-3">
          {variant === 'clinical' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleResult('normal')}
                  className="py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  {t('exam.shared.normal')}
                </button>
                <button
                  onClick={() => handleResult('abnormal')}
                  className="py-4 bg-error text-on-error rounded-2xl font-bold text-lg hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">cancel</span>
                  {t('exam.shared.abnormal')}
                </button>
              </div>
              <button
                onClick={() => setNoteOpen(!noteOpen)}
                className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base">{noteOpen ? 'expand_less' : 'edit_note'}</span>
                {t('exam.shared.addNote')}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${noteOpen ? 'max-h-32' : 'max-h-0'}`}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('exam.shared.addNote')}
                  className="w-full h-24 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface text-sm focus:outline-none focus:border-primary resize-none mt-1"
                />
              </div>
            </>
          )}

          {variant === 'self-exam' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleResult('done')}
                  className="py-4 signature-gradient text-white rounded-2xl font-bold text-lg hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {t('exam.shared.done')}
                  <span className="material-symbols-outlined text-xl">check</span>
                </button>
                <button
                  onClick={() => handleResult('concern')}
                  className="py-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-2xl font-bold text-lg hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">warning</span>
                  {t('exam.shared.concern')}
                </button>
              </div>
              <button
                onClick={() => handleResult('skipped')}
                className="w-full py-2.5 text-sm text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-xl transition-all"
              >
                {t('exam.shared.skip')}
              </button>
            </div>
          )}

          {/* Next / Finish navigation */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_back</span>
              {t('exam.shared.previous')}
            </button>

            {isLast ? (
              <button
                onClick={onComplete}
                className="flex-1 py-3 signature-gradient text-white rounded-2xl font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">task_alt</span>
                {t('exam.shared.finish')}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex-1 py-3 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-on-surface rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2"
              >
                {t('exam.shared.next')}
                <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
