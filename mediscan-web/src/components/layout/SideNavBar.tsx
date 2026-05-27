'use client';

import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useState, useEffect } from 'react';
import type { UserRole } from '@/types/api';

import { RateExperienceModal } from '@/components/patient/RateExperienceModal';

interface NavItem {
  key: string;
  icon: string;
  href: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', icon: 'dashboard', href: '/dashboard', roles: ['Patient'] },
  { key: 'appointments', icon: 'calendar_month', href: '/dashboard/appointments', roles: ['Patient'] },
  { key: 'reports', icon: 'description', href: '/dashboard/reports', roles: ['Patient'] },
  { key: 'ourDoctors', icon: 'groups', href: '/dashboard/our-doctors', roles: ['Patient'] },
  { key: 'aiTools', icon: 'psychology', href: '/dashboard/ai-tools', roles: ['Patient'] },
  { key: 'examinations', icon: 'medical_information', href: '/examinations', roles: ['Patient', 'Doctor'] },
  { key: 'profile',         icon: 'person',        href: '/dashboard/profile',              roles: ['Patient'] },
  { key: 'forbiddenMeds',   icon: 'medication',    href: '/dashboard/forbidden-medicines',  roles: ['Patient'] },
  { key: 'childrenHealth',  icon: 'child_care',    href: '/dashboard/children',             roles: ['Patient'] },
  // Doctor nav
  { key: 'dashboard',    icon: 'dashboard',       href: '/doctor',                roles: ['Doctor'] },
  { key: 'appointments', icon: 'calendar_month',  href: '/doctor/appointments',   roles: ['Doctor'] },
  { key: 'aiTools',      icon: 'psychology',      href: '/dashboard/ai-tools',    roles: ['Doctor'] },
  { key: 'profile',      icon: 'person',          href: '/doctor/profile',        roles: ['Doctor'] },
  // Admin nav
  { key: 'admin',           icon: 'admin_panel_settings', href: '/admin',                  roles: ['Admin'] },
  { key: 'doctors',         icon: 'medical_services',      href: '/admin/doctors',           roles: ['Admin'] },
  { key: 'addDoctor',       icon: 'person_add',            href: '/admin/add-doctor',        roles: ['Admin'] },
  { key: 'addAdmin',        icon: 'manage_accounts',       href: '/admin/add-admin',         roles: ['Admin'] },
  { key: 'bookAppointment', icon: 'calendar_add_on',       href: '/admin/book-appointment',  roles: ['Admin'] },
];

export function SideNavBar() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'ar';
  const { user, logout } = useAuthStore();
  const role = user?.role;
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setIsDark(document.documentElement.classList.contains('dark'));
    }, 0);
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  // Prevent hydration mismatch width on server
  const widthClass = mounted && !sidebarOpen ? 'w-20' : 'w-72';
  const isOpen = !mounted || sidebarOpen;

  return (
    <nav
      className={`hidden md:flex flex-col h-screen overflow-hidden fixed top-0 start-0 z-50 bg-surface-container-lowest ambient-shadow transition-all duration-300 ease-in-out ${widthClass}`}
    >
      {/* Brand & Toggle — flex-shrink-0 */}
      <div className={`flex-shrink-0 py-5 flex items-center ${isOpen ? 'px-6 gap-3' : 'px-0 justify-center flex-col gap-4'}`}>
        <div className={`flex items-center gap-3 ${!isOpen && 'w-full justify-center'}`}>
          {isOpen && <Logo size={40} className="rounded-lg" variant={mounted && isDark ? 'white' : 'default'} />}
          <button 
            onClick={toggleSidebar} 
            className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors text-on-surface-variant focus:outline-none"
            title="Toggle Sidebar"
          >
            <span className="material-symbols-outlined text-2xl">{isOpen ? 'menu_open' : 'menu'}</span>
          </button>
        </div>
        {isOpen && (
          <div>
            <span className="font-bold text-lg text-primary tracking-tight whitespace-nowrap overflow-hidden">MediScan AI</span>
            <p className="text-on-surface-variant text-xs whitespace-nowrap overflow-hidden">
              {role === 'Patient' ? t('patientPortal') : role === 'Doctor' ? t('clinicalPortal') : t('adminPanel')}
            </p>
          </div>
        )}
      </div>

      {/* New Consultation CTA — flex-shrink-0 */}
      <div className={`flex-shrink-0 mb-4 ${isOpen ? 'px-6' : 'px-3'}`}>
        <button 
          className={`w-full signature-gradient text-white rounded-full font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all ambient-shadow active:scale-[0.98] ${isOpen ? 'py-3 px-5' : 'py-3 px-0 h-12 rounded-2xl'}`}
          title={!isOpen ? t('newConsultation') : undefined}
        >
          <span className="material-symbols-outlined text-xl">add</span>
          {isOpen && <span className="whitespace-nowrap overflow-hidden">{t('newConsultation')}</span>}
        </button>
      </div>

      {/* Nav items — flex-1 */}
      <div className={`flex-1 flex flex-col justify-evenly overflow-hidden ${isOpen ? 'px-3' : 'px-2'}`}>
        {visibleItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname === href || (item.href !== '/dashboard' && item.href !== '/doctor' && item.href !== '/admin' && pathname.startsWith(href));
          const isDashboardActive = (item.href === '/dashboard' || item.href === '/doctor' || item.href === '/admin') && pathname === href;
          const active = isActive || isDashboardActive;

          return (
            <Link
              key={`${item.href}-${item.key}`}
              href={href}
              title={!isOpen ? t(item.key as Parameters<typeof t>[0]) : undefined}
              className={`relative flex items-center gap-3 py-3 rounded-full transition-all duration-200 group ${isOpen ? 'px-4' : 'px-0 justify-center w-full'} ${
                active
                  ? 'bg-primary-container/20 text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              {active && (
                <span className={`absolute top-1/2 -translate-y-1/2 w-[4px] h-8 rounded-full bg-primary ${isOpen ? 'end-0' : 'start-0'}`} />
              )}
              <span
                className="material-symbols-outlined text-2xl flex-shrink-0"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {isOpen && (
                <span className="text-base font-medium whitespace-nowrap overflow-hidden transition-all">{t(item.key as Parameters<typeof t>[0])}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer — flex-shrink-0 */}
      <div className={`flex-shrink-0 pb-4 border-t border-surface-container pt-3 flex flex-col gap-1 ${isOpen ? 'px-3' : 'px-2 items-center'}`}>
        {role === 'Patient' && (
          <button 
            onClick={() => setRateModalOpen(true)}
            title={!isOpen ? t('rateUs') : undefined}
            className={`flex items-center gap-3 py-3 rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all ${isOpen ? 'px-4 w-full text-start' : 'px-0 justify-center w-12 h-12'}`}
          >
            <span className="material-symbols-outlined text-2xl">star_rate</span>
            {isOpen && <span className="text-base font-medium whitespace-nowrap">{t('rateUs')}</span>}
          </button>
        )}
        <Link
          href={`/${locale}/settings`}
          title={!isOpen ? t('settings') : undefined}
          className={`flex items-center gap-3 py-3 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all ${isOpen ? 'px-4' : 'px-0 justify-center w-12 h-12'}`}
        >
          <span className="material-symbols-outlined text-2xl">settings</span>
          {isOpen && <span className="text-base font-medium whitespace-nowrap">{t('settings')}</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={!isOpen ? t('logout') : undefined}
          className={`flex items-center gap-3 py-3 rounded-full text-red-500 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${isOpen ? 'px-4 w-full text-start' : 'px-0 justify-center w-12 h-12'}`}
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          {isOpen && <span className="text-base whitespace-nowrap">{t('logout')}</span>}
        </button>
      </div>

      {rateModalOpen && (
        <RateExperienceModal onClose={() => setRateModalOpen(false)} />
      )}
    </nav>
  );
}
