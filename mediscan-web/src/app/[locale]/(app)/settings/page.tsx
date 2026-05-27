'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/lib/settings';
import { AnimatedProgressBar } from '@/components/ui/AnimatedProgressBar';
import { ANIM_CLASSES } from '@/lib/animations';
import { EmptyState } from '@/components/ui/EmptyState';
import { patientPreferencesService, PatientPreferences } from '@/services/patientPreferencesService';

type TabKey = 'general' | 'security' | 'integrations' | 'notifications';

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [settings, saveSettings] = useSettings();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'ar';
  
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  const isPatient = user?.role === 'Patient';

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [patientPreferences, setPatientPreferences] = useState<PatientPreferences>({
    isAppointmentNotificationEnabled: true,
    isCampaignNotificationEnabled: true,
    preferredLanguage: 'ar'
  });

  // Dynamic tabs list depending on user role
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'general' as TabKey, label: t('general'), icon: 'tune' },
    ...(isAdmin ? [
      { key: 'security' as TabKey, label: t('security'), icon: 'security' },
      { key: 'integrations' as TabKey, label: t('integrations'), icon: 'cable' },
    ] : []),
    { key: 'notifications' as TabKey, label: t('notifications'), icon: 'notifications' },
  ];

  // Health checks for integrations tab
  const [apiStatus, setApiStatus] = useState<'checking' | 'reachable' | 'unreachable'>('checking');
  const [ragStatus, setRagStatus] = useState<'checking' | 'reachable' | 'unreachable'>('checking');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPatient) {
      patientPreferencesService.getPreferences()
        .then(data => setPatientPreferences(data))
        .catch(console.error);
    }
  }, [isPatient]);

  // Safeguard: Reset non-admin users if they are somehow on security/integrations tabs
  useEffect(() => {
    if (mounted && !isAdmin && (activeTab === 'security' || activeTab === 'integrations')) {
      setActiveTab('general');
    }
  }, [isAdmin, activeTab, mounted]);

  const checkHealth = async () => {
    setApiStatus('checking');
    setRagStatus('checking');
    
    // Check .NET API
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7196/api';
      const res = await fetch(apiBaseUrl, { method: 'HEAD' }).catch(() => null);
      if (res) setApiStatus('reachable');
      else setApiStatus('unreachable');
    } catch {
      setApiStatus('unreachable');
    }

    // Check Python RAG
    try {
      const ragBaseUrl = process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:8005';
      const res = await fetch(`${ragBaseUrl}/health`).catch(() => null);
      if (res) setRagStatus('reachable');
      else setRagStatus('unreachable');
    } catch {
      setRagStatus('unreachable');
    }
  };

  useEffect(() => {
    if (activeTab === 'integrations' && isAdmin) {
      const initialTimer = setTimeout(() => { void checkHealth(); }, 10);
      const interval = setInterval(() => { void checkHealth(); }, 30_000);
      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [activeTab, isAdmin]);

  const handleSaveToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggle = (key: keyof typeof settings) => {
    saveSettings({ [key]: !settings[key] });
  };

  const handleNotificationToggle = (key: string) => {
    saveSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
    handleSaveToast();
  };

  const handlePatientNotificationToggle = async (key: keyof PatientPreferences) => {
    const newPrefs = { ...patientPreferences, [key]: !patientPreferences[key] as boolean };
    setPatientPreferences(newPrefs);
    try {
      await patientPreferencesService.updatePreferences(newPrefs);
      handleSaveToast();
    } catch (error) {
      console.error(error);
      setPatientPreferences(patientPreferences); // Revert
    }
  };

  const handleLanguageChange = async (lang: 'ar' | 'en') => {
    saveSettings({ defaultLanguage: lang });
    
    if (isPatient) {
      const newPrefs = { ...patientPreferences, preferredLanguage: lang };
      setPatientPreferences(newPrefs);
      await patientPreferencesService.updatePreferences(newPrefs).catch(console.error);
    }

    if (lang !== locale) {
      const current = window.location.pathname;
      const newPath = current.replace(`/${locale}`, `/${lang}`);
      router.push(newPath);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    saveSettings({ defaultTheme: theme });
    let isDark = false;
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.removeItem('mediscan-theme');
    } else {
      isDark = theme === 'dark';
      localStorage.setItem('mediscan-theme', theme);
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Render content based on tab
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className={`space-y-8 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-on-surface-variant">{t('workspaceName')}</label>
              <input 
                type="text" 
                value="MediScan AI" 
                readOnly 
                className="w-full bg-surface-container rounded-lg px-4 py-3 text-on-surface focus:outline-none cursor-not-allowed opacity-70"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-on-surface-variant">{t('defaultLanguage')}</label>
              <div className="flex gap-4">
                {['ar', 'en'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang as 'ar' | 'en')}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-colors ${
                      locale === lang ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-on-surface-variant">{t('defaultTheme')}</label>
              <div className="flex gap-4 flex-wrap">
                {['light', 'dark', 'system'].map(theme => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'system')}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-colors capitalize ${
                      settings.defaultTheme === theme ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {t(theme as 'light' | 'dark' | 'system')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-on-surface-variant">{t('aiSensitivity')}</label>
                <span className="text-primary font-bold">{settings.aiSensitivity}%</span>
              </div>
              <p className="text-xs text-on-surface-variant">{t('aiSensitivityDesc')}</p>
              <input 
                type="range" 
                min={0} 
                max={100} 
                step={1}
                value={settings.aiSensitivity}
                onChange={(e) => saveSettings({ aiSensitivity: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none bg-surface-container-highest outline-none cursor-pointer accent-primary"
              />
            </div>

            <div className="pt-6 border-t border-surface-container">
              <button 
                onClick={handleSaveToast}
                className="signature-gradient text-white rounded-full py-3 px-8 font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        );

      case 'security':
        if (!isAdmin) return null;
        return (
          <div className={`space-y-8 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}>
            <div className="space-y-6">
              {[
                { key: 'requireEmailVerification', label: t('requireEmailVerification') },
                { key: 'enableTwoFactor', label: t('enableTwoFactor') },
                { key: 'strictPasswordPolicy', label: t('strictPassword') },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-on-surface">{item.label}</span>
                  <Switch 
                    checked={settings[item.key as keyof typeof settings] as boolean} 
                    onChange={() => handleToggle(item.key as keyof typeof settings)} 
                  />
                </div>
              ))}

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-surface-container">
                <span className="font-semibold text-on-surface">{t('autoLogout')}</span>
                <select
                  value={settings.autoLogoutMinutes}
                  onChange={(e) => saveSettings({ autoLogoutMinutes: parseInt(e.target.value) as 5 | 15 | 30 | 60 })}
                  className="bg-surface-container rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[5, 15, 30, 60].map(m => (
                    <option key={m} value={m}>{m} {t('minutes')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-8">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="text-lg font-bold text-on-surface mb-6">{t('auditLog')}</h3>
                <EmptyState icon="history" title={t('noAuditEvents')} />
              </div>
            </div>
          </div>
        );

      case 'integrations':
        if (!isAdmin) return null;
        return (
          <div className={`space-y-6 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}>
            <h3 className="text-lg font-bold text-on-surface mb-4">{t('connectedServices')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* .NET Backend */}
              <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-on-surface">.NET Backend</span>
                  <span className="text-xs text-on-surface-variant font-mono break-all">{process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7196/api'}</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${apiStatus === 'reachable' ? 'bg-green-500 anim-ring-pulse' : apiStatus === 'unreachable' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                    <span className="text-sm font-semibold text-on-surface-variant">{t(apiStatus as Parameters<typeof t>[0])}</span>
                  </div>
                  {apiStatus === 'unreachable' && (
                    <button onClick={() => { void checkHealth(); }} className="text-xs text-primary hover:underline font-semibold">{t('retry')}</button>
                  )}
                </div>
              </div>

              {/* Python RAG */}
              <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-on-surface">Python RAG</span>
                  <span className="text-xs text-on-surface-variant font-mono break-all">{process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:8005'}</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${ragStatus === 'reachable' ? 'bg-green-500 anim-ring-pulse' : ragStatus === 'unreachable' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                    <span className="text-sm font-semibold text-on-surface-variant">{t(ragStatus as Parameters<typeof t>[0])}</span>
                  </div>
                  {ragStatus === 'unreachable' && (
                    <button onClick={() => { void checkHealth(); }} className="text-xs text-primary hover:underline font-semibold">{t('retry')}</button>
                  )}
                </div>
              </div>

              {/* Email Provider */}
              <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-on-surface">Email Provider</span>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="w-3 h-3 rounded-full bg-surface-container-highest" />
                  <span className="text-sm font-semibold text-on-surface-variant">{t('notConfigured')}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className={`space-y-10 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}>
            {/* Language Usage */}
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-2">{t('languageUsage')}</h3>
              <p className="text-sm text-on-surface-variant mb-6">{t('sampleDataNote')}</p>
              <div className="space-y-4 max-w-md">
                <AnimatedProgressBar progress={72} label="Arabic" colorClass="bg-primary" />
                <AnimatedProgressBar progress={28} label="English" colorClass="bg-tertiary" delay={100} />
              </div>
            </div>

            {/* Event Notifications */}
            <div className="pt-6 border-t border-surface-container">
              <h3 className="text-lg font-bold text-on-surface mb-6">{t('eventNotifications')}</h3>
              <div className="space-y-6">
                {isPatient ? [
                  { key: 'isAppointmentNotificationEnabled', label: t('appointmentUpdate') || 'Appointment Reminders' },
                  { key: 'isCampaignNotificationEnabled', label: t('campaignOffer') || 'Campaign Offers' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-on-surface">{item.label}</span>
                    <Switch 
                      checked={(patientPreferences as any)[item.key] ?? true} 
                      onChange={() => handlePatientNotificationToggle(item.key as keyof PatientPreferences)} 
                    />
                  </div>
                )) : [
                  { key: 'newPatient', label: t('newPatient') },
                  { key: 'doctorDeactivated', label: t('doctorDeactivated') },
                  { key: 'appointmentUpdate', label: t('appointmentUpdate') },
                  { key: 'aiDiagnosis', label: t('aiDiagnosis') },
                  { key: 'reportGenerated', label: t('reportGenerated') },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-on-surface">{item.label}</span>
                    <Switch 
                      checked={settings.notifications[item.key] ?? false} 
                      onChange={() => handleNotificationToggle(item.key)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
        <div className={`mb-8 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}>
          <h1 className="text-3xl font-bold text-on-surface mb-2">{t('title')}</h1>
          <p className="text-on-surface-variant">{t('subtitle')}</p>
        </div>

        {/* Tab bar */}
        <div className={`flex gap-1 bg-surface-container-high p-1 rounded-full w-fit overflow-x-auto ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`} style={{ transitionDelay: '100ms' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors z-10 ${
                  isActive ? 'text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-primary -z-10" style={{ transition: 'transform 300ms' }} />
                )}
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content area */}
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow ghost-border min-h-[400px]">
          {renderContent()}
        </div>

        {/* Bottom Section — Role Governance */}
        {isAdmin && (
          <div className={`pt-8 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`} style={{ transitionDelay: '200ms' }}>
            <h3 className="text-xl font-bold text-on-surface mb-6">{t('roleGovernance')}</h3>
            
            <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border">
              <div className="relative max-w-md mb-6">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  type="text" 
                  placeholder={t('searchUsers')}
                  className="w-full bg-surface-container-low rounded-full ps-12 pe-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                />
              </div>

              <div className="space-y-4">
                {/* Sample Row 1 */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low">
                  <div>
                    <p className="font-bold text-on-surface">Ahmed Salem</p>
                    <p className="text-sm text-on-surface-variant">ahmed@example.com</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold">Admin</span>
                    <button onClick={() => alert(t('featureNotAvailable'))} className="text-sm font-semibold text-primary hover:underline">{t('changeRole')}</button>
                  </div>
                </div>
                
                {/* Sample Row 2 */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low">
                  <div>
                    <p className="font-bold text-on-surface">Dr. Sarah Connor</p>
                    <p className="text-sm text-on-surface-variant">sarah@clinic.com</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">Doctor</span>
                    <button onClick={() => alert(t('featureNotAvailable'))} className="text-sm font-semibold text-primary hover:underline">{t('changeRole')}</button>
                  </div>
                </div>

                {/* Sample Row 3 */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low">
                  <div>
                    <p className="font-bold text-on-surface">John Doe</p>
                    <p className="text-sm text-on-surface-variant">john.doe@email.com</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold">Patient</span>
                    <button onClick={() => alert(t('featureNotAvailable'))} className="text-sm font-semibold text-primary hover:underline">{t('changeRole')}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 bg-surface text-on-surface px-6 py-3 rounded-full ambient-shadow ghost-border flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-green-500">check_circle</span>
          <span className="font-semibold text-sm">{t('saved')}</span>
        </div>
      )}
    </>
  );
}
