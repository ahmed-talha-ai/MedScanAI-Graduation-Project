'use client';
// Covers all (app) route transitions: /dashboard, /doctor, /admin

import { Logo } from '@/components/ui/Logo';
import { useTranslations } from 'next-intl';

export default function AppLoading() {
  const t = useTranslations('loader');
  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden bg-surface-container-lowest rounded-3xl ambient-shadow border border-surface-container-high/50">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes progress-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 40%; transform: translateX(50%); }
          100% { width: 100%; transform: translateX(200%); }
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .animate-progress {
          animation: progress-bar 2s ease-in-out infinite;
        }
        .animate-marquee {
          animation: marquee-scroll 25s linear infinite;
        }
      `}} />

      {/* Background glowing rings */}
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full border-2 border-primary/10 animate-pulse-ring" />
      <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full border border-primary/20 animate-pulse-ring" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-3xl rounded-full opacity-50 animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with pulse */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="bg-surface-container-lowest p-5 rounded-[2rem] ambient-shadow-md border border-surface-container-high relative animate-float-slow">
            <Logo size={80} />
          </div>
        </div>

        {/* Branding */}
        <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">MediScan AI</h1>
        <p className="text-[10px] font-bold text-on-surface-variant tracking-[0.2em] uppercase mb-12">
          {t('tagline')}
        </p>

        {/* Loading Bar */}
        <div className="w-64 space-y-4">
          <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-primary rounded-full animate-progress" />
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant tracking-[0.15em] text-center animate-pulse">
            {t('system')}
          </p>
        </div>
      </div>

      {/* Ticker tape at the bottom */}
      <div className="absolute bottom-0 left-0 w-full bg-primary/[0.03] border-t border-primary/10 py-2.5 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-12 w-[200%]">
          {[
            t('models'),
            t('connection'),
            t('diagnostics'),
            t('workspace'),
            t('credentials'),
            t('neural'),
            t('patientData'),
            t('aiCore')
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-6">
              <span className="text-[9px] font-mono text-primary/70 font-bold tracking-[0.2em]">{text}</span>
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/30" />
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {[
            t('models'),
            t('connection'),
            t('diagnostics'),
            t('workspace'),
            t('credentials'),
            t('neural'),
            t('patientData'),
            t('aiCore')
          ].map((text, i) => (
            <div key={`dup-${i}`} className="flex items-center gap-6">
              <span className="text-[9px] font-mono text-primary/70 font-bold tracking-[0.2em]">{text}</span>
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
