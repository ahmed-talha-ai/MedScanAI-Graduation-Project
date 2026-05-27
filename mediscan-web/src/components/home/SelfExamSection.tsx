'use client';

import { useState } from 'react';
import { Brain, Ribbon, Eye, Hand, Ear, Activity, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useInView, ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { useTranslations } from 'next-intl';

function BrainExamCard() {
  const [step, setStep] = useState(0);
  const t = useTranslations('exam.landing');
  const tBrain = useTranslations('exam.brainTumor');

  const BRAIN_STEPS = [
    { title: tBrain('step1Title'), desc: tBrain('step1Instruction'), icon: Activity },
    { title: tBrain('step2Title'), desc: tBrain('step2Instruction'), icon: Hand },
    { title: tBrain('step3Title'), desc: tBrain('step3Instruction'), icon: Eye },
    { title: tBrain('step4Title'), desc: tBrain('step4Instruction'), icon: Activity },
    { title: tBrain('step5Title'), desc: tBrain('step5Instruction'), icon: Ear },
  ];

  return (
    <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 rounded-3xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-6 right-6 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-300 z-10 backdrop-blur-sm">
        {t('brainStepsBadge')}
      </div>
      
      {step === 0 && (
        <div className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-2xl font-bold text-violet-900 dark:text-violet-100 mb-2">{t('brainTitle')}</h3>
          <p className="text-violet-700 dark:text-violet-300 mb-8">{t('brainSubtitle')}</p>
          
          <div className="text-start bg-white/60 dark:bg-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <p className="font-semibold text-violet-900 dark:text-violet-100 mb-3">{t('whatYoullCheck')}</p>
            <ul className="space-y-2 text-violet-800 dark:text-violet-200 text-sm">
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" /> {t('balanceCoord')}</li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" /> {t('eyeMovement')}</li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" /> {t('motorSpeech')}</li>
            </ul>
          </div>
          
          <button 
            onClick={() => setStep(1)}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all hover:opacity-90 animate-[pulse-soft_2s_infinite] flex items-center justify-center gap-2"
          >
            {t('startExam')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step > 0 && step <= 5 && (
        <div className="p-8 md:p-12 flex flex-col h-full anim-scale-in">
          <div className="mb-8">
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-3">{t('stepOf', { step, total: 5 })}</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step ? 'bg-violet-600 dark:bg-violet-500' : i === step ? 'bg-violet-400 dark:bg-violet-700' : 'bg-violet-200 dark:bg-violet-950'}`} />
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center mb-6">
              {(() => {
                const Icon = BRAIN_STEPS[step-1].icon;
                return <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />;
              })()}
            </div>
            <h4 className="text-xl font-bold text-violet-900 dark:text-violet-100 mb-4">{BRAIN_STEPS[step-1].title}</h4>
            <p className="text-violet-800 dark:text-violet-200 text-base leading-relaxed" dir="rtl">{BRAIN_STEPS[step-1].desc}</p>
          </div>
          
          <div className="flex gap-4 mt-auto">
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 rounded-xl font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> {t('previous')}
            </button>
            <button 
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {step === 5 ? t('completeExam') : t('nextStep')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center h-full anim-scale-in">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-[bounce-in_0.6s_ease-out] text-green-600 dark:text-green-400">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-violet-900 dark:text-violet-100 mb-4">{t('brainCompleteTitle')}</h3>
          <p className="text-violet-700 dark:text-violet-300 mb-8 leading-relaxed" dir={t('brainCompleteMsg').includes('لو لقيت') ? 'rtl' : 'ltr'}>{t('brainCompleteMsg')}</p>
          
          <Link href="/register" className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
            {t('brainCta')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function BreastExamCard() {
  const [step, setStep] = useState(0);
  const t = useTranslations('exam.landing');
  const tBreast = useTranslations('exam.breastSelf');

  const BREAST_STEPS = [
    { title: tBreast('step1Title'), desc: tBreast('step1Instruction'), icon: Eye },
    { title: tBreast('step2Title'), desc: tBreast('step2Instruction'), icon: Activity },
    { title: tBreast('step3Title'), desc: tBreast('step3Instruction'), icon: Eye },
    { title: tBreast('step4Title'), desc: tBreast('step4Instruction'), icon: Hand },
    { title: tBreast('step5Title'), desc: tBreast('step5Instruction'), icon: Hand },
    { title: tBreast('step6Title'), desc: tBreast('step6Instruction'), icon: Activity },
  ];

  return (
    <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/50 rounded-3xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-6 right-6 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full text-xs font-semibold text-pink-700 dark:text-pink-300 z-10 backdrop-blur-sm">
        {t('breastStepsBadge')}
      </div>
      
      {step === 0 && (
        <div className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ribbon className="w-10 h-10 text-pink-600 dark:text-pink-400" />
          </div>
          <h3 className="text-2xl font-bold text-pink-900 dark:text-pink-100 mb-2">{t('breastTitle')}</h3>
          <p className="text-pink-700 dark:text-pink-300 mb-8">{t('breastSubtitle')}</p>
          
          <div className="text-start bg-white/60 dark:bg-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <p className="font-semibold text-pink-900 dark:text-pink-100 mb-3">{t('whatYoullCheck')}</p>
            <ul className="space-y-2 text-pink-800 dark:text-pink-200 text-sm">
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-pink-500 dark:text-pink-400 flex-shrink-0 mt-0.5" /> {t('visualMirror')}</li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-pink-500 dark:text-pink-400 flex-shrink-0 mt-0.5" /> {t('palpation')}</li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-pink-500 dark:text-pink-400 flex-shrink-0 mt-0.5" /> {t('skinNipple')}</li>
            </ul>
          </div>
          
          <button 
            onClick={() => setStep(1)}
            className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all hover:opacity-90 animate-[pulse-soft_2s_infinite] flex items-center justify-center gap-2"
          >
            {t('startExam')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step > 0 && step <= 6 && (
        <div className="p-8 md:p-12 flex flex-col h-full anim-scale-in">
          <div className="mb-8">
            <p className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">{t('stepOf', { step, total: 6 })}</p>
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step ? 'bg-pink-600 dark:bg-pink-500' : i === step ? 'bg-pink-400 dark:bg-pink-700' : 'bg-pink-200 dark:bg-pink-950'}`} />
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-xl flex items-center justify-center mb-6">
              {(() => {
                const Icon = BREAST_STEPS[step-1].icon;
                return <Icon className="w-6 h-6 text-pink-600 dark:text-pink-400" />;
              })()}
            </div>
            <h4 className="text-xl font-bold text-pink-900 dark:text-pink-100 mb-4">{BREAST_STEPS[step-1].title}</h4>
            <p className="text-pink-800 dark:text-pink-200 text-base leading-relaxed" dir="rtl">{BREAST_STEPS[step-1].desc}</p>
          </div>
          
          <div className="flex gap-4 mt-auto">
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 rounded-xl font-medium hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> {t('previous')}
            </button>
            <button 
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {step === 6 ? t('completeExam') : t('nextStep')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center h-full anim-scale-in">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-[bounce-in_0.6s_ease-out] text-green-600 dark:text-green-400">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-pink-900 dark:text-pink-100 mb-4">{t('breastCompleteTitle')}</h3>
          <p className="text-pink-700 dark:text-pink-300 mb-8 leading-relaxed" dir={t('breastCompleteMsg').includes('طالما') ? 'rtl' : 'ltr'}>{t('breastCompleteMsg')}</p>
          
          <Link href="/register" className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
            {t('breastCta')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function SelfExamSection() {
  const [ref, inView] = useInView<HTMLElement>(0.2);
  const t = useTranslations('exam.landing');

  return (
    <section ref={ref} id="self-exam" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 
            className={`text-4xl font-bold text-on-surface mb-4 transition-all duration-1000 ease-out ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(0, 150) }}
          >
            {t('sectionTitle')}
          </h2>
          <p 
            className={`text-on-surface-variant text-lg max-w-2xl mx-auto transition-all duration-1000 ease-out ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(1, 150) }}
          >
            {t('sectionSubtitle')}
          </p>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-1000 ease-out delay-200 ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}>
          <BrainExamCard />
          <BreastExamCard />
        </div>
      </div>
    </section>
  );
}
