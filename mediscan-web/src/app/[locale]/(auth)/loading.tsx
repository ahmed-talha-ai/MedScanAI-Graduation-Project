'use client';
// Covers (auth) route transitions: /login, /register, /forgot-password, etc.

import { Logo } from '@/components/ui/Logo';
import { useTranslations } from 'next-intl';

export default function AuthLoading() {
  const t = useTranslations('loader');
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-container-lowest">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}} />

      {/* Background glowing rings */}
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full border border-primary/10 animate-pulse-ring" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-3xl rounded-full opacity-50 animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with pulse */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="bg-surface-container-lowest p-6 rounded-[2rem] ambient-shadow-md border border-surface-container-high relative animate-float-slow">
            <Logo size={90} />
          </div>
        </div>

        {/* Branding */}
        <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">MediScan AI</h1>
        <div className="flex items-center gap-2 mt-8">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-semibold text-on-surface-variant tracking-widest uppercase">
            {t('securing')}
          </p>
        </div>
      </div>
    </div>
  );
}
