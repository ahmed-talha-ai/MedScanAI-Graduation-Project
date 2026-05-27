/* eslint-disable */
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { staggerDelay } from '@/lib/animations';
import { useTranslations } from 'next-intl';
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
}

const AI_TOOLS: AiTool[] = [
  {
    slug: 'lab-ocr',
    title: 'Lab Analysis',
    subtitle: 'Clinical OCR Extraction',
    Icon: ScanText,
    accuracy: 'OCR',
    accentClass: 'text-amber-600',
    iconBgClass: 'bg-amber-50',
    translationKey: 'labOcr',
    iconColor: '#d97706',
  },
  {
    slug: 'chatbot',
    title: 'Health Assistant',
    subtitle: 'Medical Chatbot',
    Icon: BotMessageSquare,
    accuracy: 'AI Chat',
    accentClass: 'text-teal-600',
    iconBgClass: 'bg-teal-50',
    translationKey: 'chatbot',
    iconColor: '#0d9488',
  },
  {
    slug: 'brain-tumor',
    title: 'Brain Tumor',
    subtitle: 'Neurological Oncology',
    Icon: Brain,
    accuracy: '99.39%',
    accentClass: 'text-purple-600',
    iconBgClass: 'bg-purple-50',
    translationKey: 'brainTumor',
    iconColor: '#9333ea',
  },
  {
    slug: 'xray',
    title: 'Chest X-Ray',
    subtitle: 'Pulmonary Radiography',
    Icon: LungsIcon,
    accuracy: '96.46%',
    accentClass: 'text-sky-600',
    iconBgClass: 'bg-sky-50',
    translationKey: 'xray',
    iconColor: '#0284c7',
  },
  {
    slug: 'skin',
    title: 'Skin Lesion',
    subtitle: 'Dermatological Screening',
    Icon: Microscope,
    accuracy: '97.93%',
    accentClass: 'text-emerald-600',
    iconBgClass: 'bg-emerald-50',
    translationKey: 'skin',
    iconColor: '#059669',
  },
  {
    slug: 'breast-cancer',
    title: 'Breast Cancer',
    subtitle: 'Mammography Analysis',
    Icon: Ribbon,
    accuracy: '97.15%',
    accentClass: 'text-pink-600',
    iconBgClass: 'bg-pink-50',
    translationKey: 'breastCancer',
    iconColor: '#db2777',
  },
];

export default function AiToolsHubPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const tTools = useTranslations('aiTools');
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { 
    const t = setTimeout(() => setMounted(true), 10); 
    return () => clearTimeout(t); 
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    const fetchHistory = async () => {
      try {
        const res = await getDiagnosisHistory(user.userId);
        if (res?.data) {
          setHistory(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };
    fetchHistory();
  }, [user?.userId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-primary tracking-tight">{tTools('hubTitle')}</h1>
        <p className="text-on-surface-variant mt-2">
          {tTools('hubSubtitle')}
        </p>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {AI_TOOLS.map((tool, idx) => (
          <Link
            key={tool.slug}
            href={`/${locale}/dashboard/ai-tools/${tool.slug}`}
            className={`group relative bg-surface-container-lowest dark:glass-panel rounded-2xl p-6 ambient-shadow hover:-translate-y-2 hover:scale-[1.02] dark:hover:shadow-[0_0_30px_rgba(0,242,254,0.15)] transition-all duration-500 flex flex-col border border-surface-container-high dark:border-white/10 overflow-hidden neon-card ${mounted ? 'anim-fade-up-in' : 'anim-fade-up'}`}
            style={{
              transitionDelay: staggerDelay(idx, 80),
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
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
              <div className="text-end">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${tool.accentClass} ${tool.iconBgClass}`}>
                  {tool.accuracy}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative z-10">
              <h3 className="text-lg font-bold text-on-surface mb-0.5">{tTools(`tools.${tool.translationKey}.title`)}</h3>
              <p className={`text-xs font-semibold ${tool.accentClass} mb-3`}>{tTools(`tools.${tool.translationKey}.subtitle`)}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{tTools(`tools.${tool.translationKey}.desc`)}</p>
            </div>

            {/* Footer CTA */}
            <div className={`mt-5 pt-4 border-t border-surface-container-high flex items-center justify-between ${tool.accentClass} relative z-10`}>
              <span className="text-sm font-semibold">{tTools('launchAnalysis')}</span>
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-300">
                arrow_forward
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Diagnoses */}
      {history.length > 0 && (
        <RevealOnScroll direction="up" delay={400}>
          <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border">
            <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              {tTools('recentDiagnoses') || 'Recent Diagnoses'}
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {history.map((h: any, i: number) => (
                <div key={i} className="bg-surface-container rounded-lg p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{h.modelType} - {h.resultLabel}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(h.createdAt).toLocaleDateString()} • {(h.confidenceScore).toFixed(1)}% Confidence
                    </p>
                  </div>
                  <Link 
                    href={`/${locale}/dashboard/ai-tools/${h.modelType.toLowerCase()}`}
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      )}

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
