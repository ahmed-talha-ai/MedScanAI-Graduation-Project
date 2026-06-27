'use client';

import { SideNavBar } from '@/components/layout/SideNavBar';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { PageTransition } from '@/components/layout/PageTransition';
import { FloatingChatWidget } from '@/components/ui/FloatingChatWidget';
import { Preloader } from '@/components/ui/Preloader';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // To prevent hydration mismatch, default to the open state (md:ms-72) on server
  const msClass = mounted && !sidebarOpen ? 'md:ms-20' : 'md:ms-72';

  return (
    <div className="flex min-h-screen bg-surface-container-low overflow-x-hidden">
      <Preloader />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:top-4 focus:start-4 focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-full focus:font-semibold">
        Skip to content
      </a>
      {/* Sidebar */}
      <SideNavBar />

      {/* Main area: push content right of the fixed sidebar */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${msClass}`}>
        <TopNavBar />
        <main id="main-content" className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      <FloatingChatWidget />
    </div>
  );
}
