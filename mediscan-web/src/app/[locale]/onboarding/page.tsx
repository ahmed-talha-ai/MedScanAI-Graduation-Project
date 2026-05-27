'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className={`w-full max-w-lg text-center transition-all duration-700 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}>
        {/* Logo */}
        <div className={`flex justify-center mb-8 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
          <div className="w-24 h-24 rounded-xl overflow-hidden ambient-shadow">
            <Logo size={96} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-2xl font-bold text-primary mb-2">MediScan AI</h1>

        {/* Welcome message */}
        <div className={`mb-10 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(1, 60) }}>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-on-surface-variant">{t('subtitle')}</p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 gap-4 mb-10 text-start">
          {[
            { icon: 'psychology', title: '6 AI Diagnostic Tools', desc: 'Brain tumor, X-ray, skin disease analysis and more' },
            { icon: 'calendar_month', title: 'Smart Appointments', desc: 'Book with the right specialist instantly' },
            { icon: 'description', title: 'AI Medical Reports', desc: 'Personalized health insights in your language' },
            { icon: 'chat', title: 'Medical Chatbot', desc: 'Ask any health question, get expert answers' },
          ].map(({ icon, title, desc }, idx) => (
            <div 
              key={title} 
              className={`flex items-start gap-4 bg-surface-container-lowest rounded-lg p-4 ambient-shadow transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}
              style={{ transitionDelay: staggerDelay(2 + idx, 60) }}
            >
              <div className="w-10 h-10 rounded-DEFAULT bg-primary-fixed text-on-primary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface text-sm">{title}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={`flex flex-col gap-3 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(6, 60) }}>
          <Link href={`/${locale}/dashboard`} className="btn-primary inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
            {t('start')}
          </Link>
          <Link href={`/${locale}/dashboard`} className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            {t('skip')}
          </Link>
        </div>
      </div>
    </main>
  );
}
