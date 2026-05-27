'use client';

import { Logo } from '@/components/ui/Logo';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('editorial');
  const tApp = useTranslations('app');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-background p-4 md:p-8 lg:p-12">
      <div className={`w-full max-w-6xl flex bg-surface-container-low rounded-xl overflow-hidden ambient-shadow ghost-border relative min-h-[600px]`}>
        {/* Left: Editorial panel */}
        <div className={`hidden lg:flex w-[45%] relative bg-surface-container-highest overflow-hidden flex-shrink-0 ${mounted ? 'anim-blur-in' : 'anim-blur'}`}>
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 signature-gradient opacity-90 anim-gradient-shift" />
            {/* Abstract medical pattern overlay */}
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              viewBox="0 0 400 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="200" cy="300" r="180" stroke="white" strokeWidth="1" />
              <circle cx="200" cy="300" r="120" stroke="white" strokeWidth="1" />
              <circle cx="200" cy="300" r="60" stroke="white" strokeWidth="1" />
              <line x1="200" y1="120" x2="200" y2="480" stroke="white" strokeWidth="1" />
              <line x1="20" y1="300" x2="380" y2="300" stroke="white" strokeWidth="1" />
              <line x1="73" y1="173" x2="327" y2="427" stroke="white" strokeWidth="0.5" />
              <line x1="327" y1="173" x2="73" y2="427" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Brand content */}
          <div className="relative z-10 flex flex-col justify-between p-12 h-full text-white w-full">
            <div className="flex items-center gap-3">
              <Logo
                size={48}
                variant="white"
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{tApp('name')}</h1>
                <p className="text-white/70 text-sm">{t('tagline')}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div dir="ltr" className="text-right">
                <h2 className="text-4xl font-bold leading-tight tracking-tight">
                  {t('headline1')}
                  <br />
                  <span className="text-primary-fixed">{t('headline2')}</span>
                </h2>
                <p className="mt-4 text-white/75 text-base leading-relaxed max-w-xs ms-auto">
                  {t('heroDesc')}
                </p>
              </div>

              <div className="space-y-5" dir="ltr">
                {[
                  { icon: 'verified_user', title: t('securePlatform'), desc: t('secureDesc') },
                  { icon: 'psychology', title: t('aiDiagnostics'), desc: t('aiDiagDesc') },
                  { icon: 'diversity_3', title: t('multiRole'), desc: t('multiRoleDesc') },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start justify-end gap-4 text-right">
                    <div>
                      <h3 className="font-semibold text-base text-white">{title}</h3>
                      <p className="text-sm text-white/65 mt-0.5">{desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-primary-fixed text-2xl mt-0.5 flex-shrink-0">
                      {icon}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form area */}
        <div className="w-full lg:w-[55%] bg-surface-container-lowest overflow-y-auto flex flex-col">
          {children}
        </div>
      </div>
    </main>
  );
}
