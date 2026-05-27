'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { ExamStep } from '@/types/exam';
import { ANIM_CLASSES } from '@/lib/animations';

interface ExamStepCardProps {
  step: ExamStep;
  index: number;
  isActive: boolean;
  variant: 'clinical' | 'self-exam';
  onResult: (result: 'normal' | 'abnormal' | 'done' | 'skipped' | 'concern') => void;
  hideHeader?: boolean;
  children?: React.ReactNode;
}

export function ExamStepCard({ step, index, isActive, variant, onResult, hideHeader, children }: ExamStepCardProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && step.videoSrc) {
      const fullSrc = window.location.origin + step.videoSrc;
      if (video.src !== fullSrc && video.getAttribute('src') !== step.videoSrc) {
        video.src = step.videoSrc;
        video.load();
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isActive, step.videoSrc]);

  const iconMap: Record<string, string> = {
    timer: 'timer',
    observation: 'visibility',
    cognitive: 'psychology',
    instruction: 'info'
  };

  const renderMedia = () => {
    if (step.videoSrc) {
      if (step.videoSrc.endsWith('.gif')) {
        return (
          <div className="relative h-full max-h-full w-full rounded-xl overflow-hidden bg-surface-container-low">
            <Image
              src={step.videoSrc}
              alt={t(step.titleKey)}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        );
      }
      return (
        <video
          ref={videoRef}
          src={step.videoSrc}
          loop
          muted
          playsInline
          poster={step.diagram}
          className="h-full max-h-full w-full object-contain rounded-xl bg-surface-container-low"
          onCanPlay={() => {
            if (isActive) videoRef.current?.play().catch(() => {});
          }}
        />
      );
    }

    if (step.diagram) {
      return (
        <div className="relative w-full h-full max-h-full aspect-video rounded-xl overflow-hidden bg-surface-container-low">
          <Image
            src={step.diagram}
            alt={t(step.titleKey)}
            fill
            className="object-contain"
          />
        </div>
      );
    }

    return (
      <div className="w-full max-h-[40vh] rounded-xl bg-surface-container-low flex items-center justify-center py-12">
        <span className="material-symbols-outlined text-7xl text-on-surface-variant">
          {iconMap[step.kind] || 'info'}
        </span>
      </div>
    );
  };

  return (
    <div className={`flex flex-col overflow-hidden w-full max-w-2xl mx-auto ${hideHeader ? '' : 'h-full'}`}>

      {/* Top: step number badge + title (flex-shrink-0) */}
      {!hideHeader && (
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {index + 1}
            </div>
            <h2 className="text-lg font-bold text-on-surface leading-tight">{t(step.titleKey)}</h2>
          </div>
          {children}
        </div>
      )}
      {hideHeader && children && (
        <div className="flex-shrink-0 mb-4">
          {children}
        </div>
      )}

      {/* Middle: media — centered, takes available space */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-1">
        {renderMedia()}
      </div>

      {/* Bottom: instruction + action buttons (flex-shrink-0) */}
      <div className="flex-shrink-0 pt-2 space-y-2">
        {/* Instruction text — max 3 lines */}
        <div className="bg-surface-container-lowest rounded-xl px-3 py-2 ambient-shadow">
          <p className="text-xs text-on-surface leading-relaxed line-clamp-3">
            {t(step.instructionKey)}
          </p>
          {step.observationHintKey && (
            <div className={`mt-1 flex items-start gap-1 text-[11px] text-yellow-700 dark:text-yellow-300 ${ANIM_CLASSES.fadeDownIn}`}>
              <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">lightbulb</span>
              <p className="line-clamp-2">{t(step.observationHintKey)}</p>
            </div>
          )}
        </div>

        {/* Clinical action buttons — single row */}
        {variant === 'clinical' && (
          <div className="space-y-1.5">
            <div className="flex flex-row gap-2">
              <button
                onClick={() => onResult('normal')}
                className="flex-1 py-2 bg-primary text-on-primary rounded-full font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('exam.shared.normal')}
              </button>
              <button
                onClick={() => onResult('abnormal')}
                className="flex-1 py-2 bg-error text-on-error rounded-full font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('exam.shared.abnormal')}
              </button>
            </div>
            {/* Add note — small text link, not full-width */}
            <button
              onClick={() => setNoteOpen(!noteOpen)}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-xs">
                {noteOpen ? 'expand_less' : 'expand_more'}
              </span>
              {t('exam.shared.addNote')}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${noteOpen ? 'max-h-20 mt-1' : 'max-h-0'}`}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('exam.shared.addNote')}
                className="w-full h-16 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        )}

        {/* Self-exam action buttons — single row */}
        {variant === 'self-exam' && (
          <div className="flex flex-row gap-2 items-center">
            <button
              onClick={() => onResult('done')}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              {t('exam.shared.done')}
              <span className="material-symbols-outlined text-[14px]">check</span>
            </button>
            <button
              onClick={() => onResult('concern')}
              className="flex-1 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full font-bold text-xs hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {t('exam.shared.concern')}
            </button>
            <button
              onClick={() => onResult('skipped')}
              className="text-xs text-on-surface-variant font-medium hover:text-on-surface transition-colors whitespace-nowrap"
            >
              {t('exam.shared.skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
