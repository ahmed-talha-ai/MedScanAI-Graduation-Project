'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { NotificationPanel } from './NotificationPanel';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export function TopNavBar() {
  const t = useTranslations('nav');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'ar';
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Search logic
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);

  const SEARCHABLE_PAGES = [
    { key: 'dashboard', titleFallback: 'Dashboard', icon: 'dashboard', href: '/dashboard', roles: ['Patient'], searchTerms: ['الرئيسية', 'لوحة التحكم', 'داشبورد', 'home', 'dashboard', 'main'] },
    { key: 'doctorDashboard', titleFallback: 'Doctor Dashboard', icon: 'dashboard', href: '/doctor', roles: ['Doctor'], searchTerms: ['الرئيسية', 'لوحة التحكم', 'طبيب', 'home', 'dashboard', 'doctor'] },
    { key: 'adminDashboard', titleFallback: 'Admin Dashboard', icon: 'dashboard', href: '/admin', roles: ['Admin'], searchTerms: ['الرئيسية', 'لوحة التحكم', 'أدمن', 'home', 'dashboard', 'admin'] },
    { key: 'appointments', titleFallback: 'Appointments', icon: 'calendar_month', href: '/dashboard/appointments', roles: ['Patient'], searchTerms: ['مواعيد', 'حجوزات', 'appointments', 'bookings'] },
    { key: 'doctorAppointments', titleFallback: 'Appointments', icon: 'calendar_month', href: '/doctor/appointments', roles: ['Doctor'], searchTerms: ['مواعيد', 'مرضى', 'appointments', 'patients'] },
    { key: 'medicalRecords', titleFallback: 'Medical Records', icon: 'folder_shared', href: '/dashboard/records', roles: ['Patient'], searchTerms: ['سجلات', 'تقارير', 'records', 'reports'] },
    { key: 'aiTools', titleFallback: 'AI Tools', icon: 'psychology', href: '/dashboard/ai-tools', roles: ['Patient', 'Doctor'], searchTerms: ['ذكاء اصطناعي', 'ادوات', 'تحليل', 'ai', 'tools', 'analysis'] },
    { key: 'neurologicalExam', titleFallback: 'Neurological Exam', icon: 'medical_information', href: '/doctor/examination', roles: ['Doctor'], searchTerms: ['فحص اعصاب', 'فحص', 'neurological exam', 'examination'] },
    { key: 'children', titleFallback: 'Children', icon: 'child_care', href: '/dashboard/children', roles: ['Patient'], searchTerms: ['اطفال', 'نمو', 'تطعيمات', 'children', 'growth', 'vaccines'] },
    { key: 'selfExam', titleFallback: 'Self Examination', icon: 'accessibility_new', href: '/dashboard/self-exam', roles: ['Patient'], searchTerms: ['فحص ذاتي', 'self exam'] },
    { key: 'settings', titleFallback: 'Settings', icon: 'settings', href: '/settings', roles: ['Patient', 'Doctor', 'Admin'], searchTerms: ['اعدادات', 'حساب', 'settings', 'account'] },
    { key: 'ourDoctors', titleFallback: 'Our Doctors', icon: 'groups', href: '/dashboard/our-doctors', roles: ['Patient', 'Admin'], searchTerms: ['اطباؤنا', 'دكاترة', 'our doctors', 'doctors'] },
  ];

  const searchResults = SEARCHABLE_PAGES.filter(p => {
    if (user?.role && !p.roles.includes(user.role)) return false;
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return p.searchTerms.some(term => term.toLowerCase().includes(q)) || p.titleFallback.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
  });

  useEffect(() => {
    setSearchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.relative.z-50')) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchOpen]);

  const handleSearchSelect = (href: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/${locale}${href}`);
  };

  // Sync DOM class when isDark changes
  useEffect(() => {
    const stored = localStorage.getItem('mediscan-theme') === 'dark';
    const t = setTimeout(() => {
      if (stored) setIsDark(true);
      setMounted(true);
    }, 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('mediscan-theme', next ? 'dark' : 'light');
  };

  const handleLocaleSwitch = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const current = window.location.pathname;
    const newPath = current.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <header 
      className="h-16 bg-surface-container-lowest ambient-shadow flex items-center justify-between px-6 gap-4 sticky top-0 z-40 w-full"
      style={{ animation: 'slideDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) both' }}
    >
      {/* Search */}
      <div className="relative z-50">
        <div className="flex items-center bg-surface-container-high rounded-full px-4 py-2 w-72 sm:w-80 gap-2 focus-within:bg-white focus-within:shadow-ambient transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchOpen(false);
                e.currentTarget.blur();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSearchIndex(i => Math.min(i + 1, searchResults.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSearchIndex(i => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && searchIndex >= 0 && searchIndex < searchResults.length) {
                e.preventDefault();
                handleSearchSelect(searchResults[searchIndex].href);
              }
            }}
            className="bg-transparent border-none outline-none w-full text-sm text-on-surface placeholder:text-on-surface-variant"
            aria-label="Search"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="text-on-surface-variant hover:text-on-surface material-symbols-outlined text-sm"
            >
              close
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden animate-fade-in-up">
            {searchResults.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto py-2">
                {searchResults.map((result, idx) => (
                  <li key={result.key}>
                    <button
                      onClick={() => handleSearchSelect(result.href)}
                      className={`w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors ${idx === searchIndex ? 'bg-surface-container-low' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-sm">{result.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{t(result.key as any) || result.titleFallback}</p>
                        <p className="text-xs text-on-surface-variant truncate">{result.href}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <span className="material-symbols-outlined text-outline-variant text-4xl mb-2">search_off</span>
                <p className="text-sm text-on-surface-variant">{t('noResults')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Locale toggle */}
        <button
          onClick={handleLocaleSwitch}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary-fixed hover:bg-primary/10 transition-colors group"
          title={t('switchLanguage')}
        >
          <span className="material-symbols-outlined text-base transition-transform duration-500 group-hover:rotate-180">language</span>
          {t('langToggle')}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          title={!mounted ? t('settings') : (isDark ? t('lightMode') : t('darkMode'))}
          suppressHydrationWarning
        >
          <span className="material-symbols-outlined text-xl" suppressHydrationWarning>
            {!mounted ? 'contrast' : (isDark ? 'light_mode' : 'dark_mode')}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors hover:animate-[wiggle_0.5s_ease-in-out]"
            aria-label={t('openNotifications')}
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {/* Unread badge */}
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-[2px] bg-tertiary rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[9px] text-white font-bold">
              <AnimatedNumber value={3} duration={1200} />
            </span>
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Settings */}
        <Link 
          href={`/${locale}/settings`}
          className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors flex items-center justify-center"
          title={t('settings')}
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </Link>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full signature-gradient flex items-center justify-center text-white font-bold text-sm cursor-pointer flex-shrink-0">
          {user?.userId?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}

