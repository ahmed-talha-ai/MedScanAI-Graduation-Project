/* eslint-disable */
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { staggerDelay } from '@/lib/animations';
import { useTranslations } from 'next-intl';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { useAuthStore } from '@/stores/authStore';
import { getDiagnosisHistory } from '@/services/persistenceService';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import {
  Brain,
  Ribbon,
  Microscope,
  ScanText,
  BotMessageSquare,
} from 'lucide-react';

function LungsIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v10" />
      <path d="M12 10c-1-2-3-3-5-3C4 7 2 10 2 13c0 3 1 6 4 6 1.5 0 3-.5 4-1.5" />
      <path d="M12 10c1-2 3-3 5-3 3 0 5 3 5 6 0 3-1 6-4 6-1.5 0-3-.5-4-1.5" />
      <path d="M6 17c0 1.5.5 2 2 2" />
      <path d="M18 17c0 1.5-.5 2-2 2" />
    </svg>
  );
}

interface AiTool {
  slug: string;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  accuracy: string;
  accentClass: string;
  iconBgClass: string;
  translationKey: 'brainTumor' | 'xray' | 'skin' | 'breastCancer' | 'labOcr' | 'chatbot';
  iconColor: string;
  image: string;
}

const AI_TOOLS: AiTool[] = [
  {
    slug: 'lab-ocr',
    title: 'Lab Analysis',
    subtitle: 'Clinical OCR Extraction',
    Icon: ScanText,
    accuracy: 'OCR',
    accentClass: 'text-amber-600',
    iconBgClass: 'bg-amber-50 dark:bg-amber-900/20',
    translationKey: 'labOcr',
    iconColor: '#d97706',
    image: '/images/AI-tools/Lab-Report-Analysis.jpg',
  },
  {
    slug: 'chatbot',
    title: 'Health Assistant',
    subtitle: 'Medical Chatbot',
    Icon: BotMessageSquare,
    accuracy: 'AI Chat',
    accentClass: 'text-teal-600',
    iconBgClass: 'bg-teal-50 dark:bg-teal-900/20',
    translationKey: 'chatbot',
    iconColor: '#0d9488',
    image: '/images/AI-tools/Chatbot.jpg',
  },
  {
    slug: 'brain-tumor',
    title: 'Brain Tumor',
    subtitle: 'Neurological Oncology',
    Icon: Brain,
    accuracy: '',
    accentClass: 'text-purple-600',
    iconBgClass: 'bg-purple-50 dark:bg-purple-900/20',
    translationKey: 'brainTumor',
    iconColor: '#9333ea',
    image: '/images/AI-tools/Brain-Tumer.jpg',
  },
  {
    slug: 'xray',
    title: 'Chest X-Ray',
    subtitle: 'Pulmonary Radiography',
    Icon: LungsIcon,
    accuracy: '',
    accentClass: 'text-sky-600',
    iconBgClass: 'bg-sky-50 dark:bg-sky-900/20',
    translationKey: 'xray',
    iconColor: '#0284c7',
    image: '/images/AI-tools/Chest-X-Ray.jpg',
  },
  {
    slug: 'skin',
    title: 'Skin Lesion',
    subtitle: 'Dermatological Screening',
    Icon: Microscope,
    accuracy: '',
    accentClass: 'text-emerald-600',
    iconBgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    translationKey: 'skin',
    iconColor: '#059669',
    image: '/images/AI-tools/Skin-Disease.jpg',
  },
  {
    slug: 'breast-cancer',
    title: 'Breast Cancer',
    subtitle: 'Mammography Analysis',
    Icon: Ribbon,
    accuracy: '',
    accentClass: 'text-pink-600',
    iconBgClass: 'bg-pink-50 dark:bg-pink-900/20',
    translationKey: 'breastCancer',
    iconColor: '#db2777',
    image: '/images/AI-tools/Breast-Cancer.jpg',
  },
];

export default function AiToolsHubPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const tTools = useTranslations('aiTools');
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { 
    const t = setTimeout(() => setMounted(true), 10); 
    return () => clearTimeout(t); 
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHero
        icon="psychology"
        title={tTools('hubTitle')}
        subtitle={tTools('hubSubtitle')}
      />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {AI_TOOLS.map((tool, idx) => (
          <Link
            key={tool.slug}
            href={`/${locale}/dashboard/ai-tools/${tool.slug}`}
            className={`group relative bg-surface-container-lowest dark:bg-[#0d1526] dark:border-[rgba(107,216,203,0.08)] rounded-2xl p-6 ambient-shadow hover:-translate-y-2 hover:scale-[1.02] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] transition-all duration-500 flex flex-col border border-surface-container-high overflow-hidden neon-card transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02] active:scale-[0.99] ${mounted ? 'anim-fade-up-in' : 'anim-fade-up'}`}
            style={{
              transitionDelay: staggerDelay(idx, 80),
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Background image — zooms on hover */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
              style={{ backgroundImage: `url('${tool.image}')` }}
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10 transition-opacity duration-300 group-hover:from-black/75" />
            {/* Subtle color tint overlay */}
            <div className="absolute inset-0 mix-blend-multiply opacity-20 pointer-events-none" style={{ backgroundColor: tool.iconColor }} />

            <div className="relative z-10 flex flex-col h-full">
              {/* Gradient orb background — accent color */}
              <div
                className="absolute -top-10 -end-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                style={{ background: tool.iconColor }}
              />

              {/* Top row */}
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div
                  className={`w-14 h-14 rounded-2xl ${tool.iconBgClass} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                  style={{ boxShadow: `0 4px 16px ${tool.iconColor}30` }}
                >
                  <tool.Icon size={28} color={tool.iconColor} strokeWidth={1.8} />
                </div>
              </div>

              {/* Content & Footer in Glass Container */}
              <div className="flex-1 relative z-10 flex flex-col justify-end mt-4 items-start">
                <h3 className="text-lg font-bold text-white mb-0.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md w-fit">{tTools(`tools.${tool.translationKey}.title`)}</h3>
                <p className={`text-xs font-semibold ${tool.accentClass} mb-2 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md w-fit`}>{tTools(`tools.${tool.translationKey}.subtitle`)}</p>
                <p className="text-sm text-white/90 leading-relaxed mb-4 flex-1 bg-black/30 backdrop-blur-sm px-2 py-1.5 rounded-lg w-fit">{tTools(`tools.${tool.translationKey}.desc`)}</p>
                
                {/* Footer CTA */}
                <div className="pt-3 flex items-center justify-between text-white w-full">
                  <span className="text-sm font-semibold bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">{tTools('launchAnalysis')}</span>
                  <span className={`material-symbols-outlined text-xl group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-300 ${tool.accentClass} bg-black/30 backdrop-blur-sm p-1.5 rounded-full`}>
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>



      {/* Disclaimer */}
      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 flex gap-3">
        <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 mt-0.5">info</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {tTools('disclaimer')}
        </p>
      </div>
    </div>
  );
}
