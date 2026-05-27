'use client';

import Link from 'next/link';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui/Logo';
import { useState, useEffect } from 'react';

export function LandingNav() {
  const t = useTranslations('landing.nav');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'ar';

  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount: read stored theme, apply DOM class, then mark mounted
  useEffect(() => {
    const stored = localStorage.getItem('mediscan-theme') === 'dark';
    if (stored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const t = setTimeout(() => {
      setIsDark(stored);
      setMounted(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('mediscan-theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLocaleSwitch = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const current = window.location.pathname;
    const newPath = current.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 flex-shrink-0">
          <Logo
            size={36}
            className="rounded-lg"
            variant={!mounted ? 'default' : (isDark ? 'white' : 'default')}
          />
          <span className="text-lg font-bold text-on-surface tracking-tight">
            MediScan <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Center nav links — desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#models" className="text-on-surface-variant hover:text-primary transition-colors">{t('models')}</a>
          <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors">{t('features')}</a>
          <a href="#about" className="text-on-surface-variant hover:text-primary transition-colors">{t('about')}</a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={handleLocaleSwitch}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 transition-colors"
            title="Switch language"
          >
            <span className="material-symbols-outlined text-base">language</span>
            {t('langToggle')}
          </button>

          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            title={!mounted ? 'Theme' : (isDark ? 'Light mode' : 'Dark mode')}
            suppressHydrationWarning
          >
            <span className="material-symbols-outlined text-xl" suppressHydrationWarning>
              {!mounted ? 'contrast' : (isDark ? 'light_mode' : 'dark_mode')}
            </span>
          </button>

          {/* Notification bell */}
          <button
            className="relative p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-tertiary rounded-full border-2 border-surface-container-lowest" />
          </button>

          {/* Auth CTAs */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center h-9 px-5 rounded-full text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-all"
          >
            {t('signIn')}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-9 px-5 rounded-full text-sm font-bold text-white signature-gradient hover:opacity-90 transition-all gap-1.5"
          >
            {t('getStarted')}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
