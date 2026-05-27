'use client';


import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Brain,
  Ribbon,
  Microscope,
  ScanText,
  BotMessageSquare,
  ScrollText,
} from 'lucide-react';
import { LandingNav } from '@/components/layout/LandingNav';
import { Logo } from '@/components/ui/Logo';
import { SelfExamSection } from '@/components/home/SelfExamSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { useInView, ANIM_CLASSES, staggerDelay } from '@/lib/animations';


// ─── Custom Lungs icon (not available in lucide-react) ───────────────────────
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

// ─── Model configuration (static — only translatable strings come from i18n) ─
interface ModelConfig {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  titleKey: string;
  descKey: string;
  accuracy: string;
  arch: string;
  classes: string;
  color: string;
  iconColor: string;
  bg: string;
  accent: string;
}

const MODELS: ModelConfig[] = [
  {
    Icon: Brain,
    titleKey: 'brain', descKey: 'brainDesc',
    accuracy: '99.39%', arch: 'Xception · TensorFlow', classes: '4 Classes',
    color: 'text-purple-600', iconColor: '#9333ea', bg: 'bg-purple-50', accent: 'border-purple-200',
  },
  {
    Icon: Ribbon,
    titleKey: 'breast', descKey: 'breastDesc',
    accuracy: '97.15%', arch: 'DenseNet121 · TensorFlow', classes: 'Binary · TTA 15×',
    color: 'text-pink-600', iconColor: '#db2777', bg: 'bg-pink-50', accent: 'border-pink-200',
  },
  {
    Icon: Microscope,
    titleKey: 'skin', descKey: 'skinDesc',
    accuracy: '97.93%', arch: 'ViT-Base-P16 · PyTorch', classes: '16+7 Ensemble',
    color: 'text-emerald-600', iconColor: '#059669', bg: 'bg-emerald-50', accent: 'border-emerald-200',
  },
  {
    Icon: LungsIcon,
    titleKey: 'xray', descKey: 'xrayDesc',
    accuracy: '96.46%', arch: 'EfficientNetV2-L · PyTorch', classes: '4 Pathologies',
    color: 'text-sky-600', iconColor: '#0284c7', bg: 'bg-sky-50', accent: 'border-sky-200',
  },

  {
    Icon: ScanText,
    titleKey: 'lab', descKey: 'labDesc',
    accuracy: 'AI-Powered', arch: 'EasyOCR · PyTorch', classes: 'OCR + NLP',
    color: 'text-amber-600', iconColor: '#d97706', bg: 'bg-amber-50', accent: 'border-amber-200',
  },
  {
    Icon: BotMessageSquare,
    titleKey: 'chat', descKey: 'chatDesc',
    accuracy: 'RAG Engine', arch: 'Qwen 2.5 · Groq', classes: 'Bilingual',
    color: 'text-teal-600', iconColor: '#0d9488', bg: 'bg-teal-50', accent: 'border-teal-200',
  },
  {
    Icon: ScrollText,
    titleKey: 'report', descKey: 'reportDesc',
    accuracy: 'RAG + PDF', arch: 'Qwen 2.5 · ReportLab', classes: 'Role-Aware',
    color: 'text-indigo-600', iconColor: '#4f46e5', bg: 'bg-indigo-50', accent: 'border-indigo-200',
  },
];

const BENTO_CLASSES = [
  'md:col-span-2 lg:col-span-2 row-span-2', // Brain (Hero card)
  'md:col-span-1 lg:col-span-1',           // Breast
  'md:col-span-1 lg:col-span-1',           // Skin
  'md:col-span-2 lg:col-span-1',           // X-Ray
  'md:col-span-1 lg:col-span-1',           // Lab
  'md:col-span-1 lg:col-span-2 row-span-2', // Chat
  'md:col-span-2 lg:col-span-1',           // Report
];

const TRUST_DATA = [
  { value: '99.39%', labelKey: 'accuracy', icon: 'precision_manufacturing' },
  { value: '256-bit', labelKey: 'encryption', icon: 'encrypted' },
  { value: '7', labelKey: 'services', icon: 'psychology' },
  { value: '', labelKey: 'reports', icon: 'description', valueKey: 'realtime' },
];

const FEATURES_DATA = [
  { icon: 'calendar_month', titleKey: 'scheduling', descKey: 'schedulingDesc' },
  { icon: 'description', titleKey: 'aiReports', descKey: 'aiReportsDesc' },
  { icon: 'medication', titleKey: 'medicines', descKey: 'medicinesDesc' },
  { icon: 'child_care', titleKey: 'children', descKey: 'childrenDesc' },
  { icon: 'admin_panel_settings', titleKey: 'admin', descKey: 'adminDesc' },
  { icon: 'security', titleKey: 'roles', descKey: 'rolesDesc' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const hero = useTranslations('landing.hero');
  const trust = useTranslations('landing.trust');
  const card = useTranslations('landing.card');
  const models = useTranslations('landing.models');
  const features = useTranslations('landing.features');
  const about = useTranslations('landing.about');
  const t = useTranslations('landing');

  // Animation hooks
  const [heroRef, heroInView] = useInView<HTMLElement>();
  const [modelsRef, modelsInView] = useInView<HTMLElement>();
    const [featuresRef, featuresInView] = useInView<HTMLElement>();
    const [aboutRef, aboutInView] = useInView<HTMLElement>(0.3);

    return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <LandingNav />

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex-1 flex items-center overflow-hidden pt-16 pb-32 px-6 md:px-12 lg:px-24">
        {/* Advanced Mesh Gradient Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Conic mesh gradient canvas (Spec §3A) */}
          <div 
            className="absolute inset-0 opacity-20 dark:opacity-40 anim-gradient-shift"
            style={{
              background: 'conic-gradient(from 180deg at 50% 50%, #006666, #007BFF, #6366F1, #006666)',
              backgroundSize: '200% 200%',
            }}
          />
          <div className="absolute top-[-10%] start-[-10%] w-[50%] h-[60%] rounded-[100%] bg-primary/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten anim-float" style={{ animationDuration: '15s' }} />
          <div className="absolute top-[20%] end-[-10%] w-[40%] h-[50%] rounded-[100%] bg-secondary/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten anim-float" style={{ animationDuration: '18s', animationDelay: '-5s' }} />
          <div className="absolute bottom-[-20%] start-[20%] w-[60%] h-[60%] rounded-[100%] bg-tertiary/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten anim-float" style={{ animationDuration: '20s', animationDelay: '-10s' }} />
          <div className="absolute inset-0 bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;)] opacity-[0.03] mix-blend-overlay" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16">
          {/* Left — text */}
          <div className="flex-1 flex flex-col gap-8 z-10">
            <div 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold w-fit transition-all duration-700 delay-100 ${heroInView ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {hero('badge')}
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] text-on-surface flex flex-wrap gap-x-3 gap-y-2">
              {hero('headline1').split(' ').map((word: string, i: number) => (
                <span key={i} className={`transition-all duration-700 ${heroInView ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(i, 80) }}>
                  {word}
                </span>
              ))}
              <span className={`signature-text-gradient block w-full transition-all duration-700 ${heroInView ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: '300ms' }}>
                {hero('headline2')}
              </span>
            </h1>

            <p className={`text-lg lg:text-xl text-on-surface-variant leading-relaxed max-w-xl transition-all duration-700 delay-[400ms] ${heroInView ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
              {hero('subtitle')}
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-[600ms] ${heroInView ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}>
              <Link
                href="/register"
                className="h-14 px-8 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 ambient-shadow"
              >
                <span className="material-symbols-outlined">person_add</span>
                {hero('ctaPrimary')}
              </Link>
              <Link
                href="/login"
                className="h-14 px-8 rounded-full bg-surface-container-lowest text-on-surface font-semibold text-base hover:bg-surface-container-low transition-all inline-flex items-center justify-center gap-2 ghost-border"
              >
                <span className="material-symbols-outlined text-primary">login</span>
                {hero('ctaSecondary')}
              </Link>
            </div>

            {/* Trust metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-surface-container-high">
              {TRUST_DATA.map(({ value, labelKey, icon, valueKey }) => (
                <div key={labelKey} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5 flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-xl font-bold text-on-surface">{valueKey ? trust(valueKey as 'realtime') : value}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{trust(labelKey as 'accuracy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual card */}
          <div className={`flex-1 flex justify-center lg:justify-end transition-all duration-700 delay-[200ms] ${heroInView ? ANIM_CLASSES.rightIn : ANIM_CLASSES.right}`}>
            <div className="relative w-full max-w-md pb-14">
              <div className="rounded-3xl bg-surface-container-lowest ambient-shadow ghost-border p-8 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <Logo size={40} className="rounded-lg" />
                  <div>
                    <p className="font-bold text-on-surface text-sm">{card('title')}</p>
                    <p className="text-xs text-on-surface-variant">{card('subtitle')}</p>
                  </div>
                  <div className="ms-auto flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {card('live')}
                  </div>
                </div>

                {[
                  { label: 'Brain Tumor · Xception', pct: 99.39, color: 'bg-purple-500' },
                  { label: 'Skin Disease · ViT-Base', pct: 97.93, color: 'bg-emerald-500' },
                  { label: 'Breast Cancer · DenseNet', pct: 97.15, color: 'bg-pink-500' },
                  { label: 'Chest X-Ray · EffNetV2', pct: 96.46, color: 'bg-sky-500' },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-on-surface-variant font-medium">{label}</span>
                      <span className="font-bold text-on-surface">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} 
                        style={{ width: heroInView ? `${pct}%` : '0%' }} 
                      />
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-surface-container-high flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base">vital_signs</span>
                  {card('status')}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-2 start-4 bg-surface-container-lowest rounded-2xl px-5 py-3 ambient-shadow ghost-border hidden md:flex items-center gap-3 z-10">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{card('complete')}</p>
                  <p className="text-[10px] text-on-surface-variant">{card('confidence')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI Models Grid ────────────────────────────────────────────────── */}
      <section ref={modelsRef} id="models" className="py-24 px-6 md:px-12 lg:px-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 transition-all duration-1000 ease-out ${modelsInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(0, 150) }}
            >
              <span className="material-symbols-outlined text-sm">psychology</span>
              {models('badge')}
            </div>
            <h2 
              className={`text-4xl font-bold text-on-surface mb-4 transition-all duration-1000 ease-out ${modelsInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(1, 150) }}
            >
              {models('title')}
            </h2>
            <p 
              className={`text-on-surface-variant text-lg max-w-2xl mx-auto transition-all duration-1000 ease-out ${modelsInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(2, 150) }}
            >
              {models('subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {MODELS.map((m, idx) => (
              <div
                key={m.titleKey}
                className={`group relative bg-surface-container-lowest rounded-3xl p-8 border border-surface-container-high hover:border-transparent overflow-hidden neon-card transition-all duration-700 ease-out flex flex-col ${BENTO_CLASSES[idx] || ''} ${modelsInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
                style={{ transitionDelay: staggerDelay(idx, 100) }}
              >
                {/* Glowing orb on hover */}
                <div className="absolute -top-16 -end-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: m.iconColor }} />
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl ${m.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`} style={{ boxShadow: `0 8px 24px ${m.iconColor}20` }}>
                    <m.Icon size={32} color={m.iconColor} strokeWidth={1.8} />
                  </div>
                  <span className={`text-xs font-bold ${m.color} ${m.bg} px-3 py-1.5 rounded-full`}>
                    {m.accuracy}
                  </span>
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-on-surface mb-2 group-hover:translate-x-1 transition-transform">{models(m.titleKey as 'brain')}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">{models(m.descKey as 'brainDesc')}</p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-surface-container-high/50">
                    <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container">{m.arch}</span>
                    <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container">{m.classes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Self Examination Guides ────────────────────────────────────────── */}
      <SelfExamSection />

      {/* ─── Platform Features ─────────────────────────────────────────────── */}
      <section ref={featuresRef} id="features" className="py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className={`text-4xl font-bold text-on-surface mb-4 transition-all duration-1000 ease-out ${featuresInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(0, 150) }}
            >
              {features('title')}
            </h2>
            <p 
              className={`text-on-surface-variant text-lg max-w-2xl mx-auto transition-all duration-1000 ease-out ${featuresInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(1, 150) }}
            >
              {features('subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES_DATA.map(({ icon, titleKey, descKey }, idx) => (
              <div
                key={titleKey}
                className={`bg-surface-container-lowest rounded-2xl p-6 ghost-border hover:-translate-y-0.5 transition-all duration-1000 ease-out ${featuresInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
                style={{ transitionDelay: staggerDelay(idx, 100) }}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                </div>
                <h3 className="font-bold text-on-surface mb-2">{features(titleKey as 'scheduling')}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{features(descKey as 'schedulingDesc')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ─── About / CTA ───────────────────────────────────────────────────── */}
      <section ref={aboutRef} id="about" className="py-20 px-6 md:px-12 lg:px-24 bg-surface-container-low">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 
            className={`text-4xl font-bold text-on-surface transition-all duration-1000 ease-out ${aboutInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(0, 150) }}
          >
            {about('title')}
          </h2>
          <p 
            className={`text-on-surface-variant text-lg leading-relaxed transition-all duration-1000 ease-out ${aboutInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(1, 150) }}
          >
            {about('desc')}
          </p>
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center pt-2 transition-all duration-1000 ease-out ${aboutInView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(2, 150) }}
          >
            <Link
              href="/register"
              className="h-14 px-10 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 ambient-shadow"
            >
              {about('ctaPrimary')}
            </Link>
            <Link
              href="/login"
              className="h-14 px-10 rounded-full text-primary font-semibold text-base border border-primary/30 hover:bg-primary/5 transition-all inline-flex items-center justify-center"
            >
              {about('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-container-high py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Logo size={24} className="rounded" />
            <span className="font-semibold text-on-surface">MediScan AI</span>
          </div>
          <p>© 2025 MediScan AI. {t('footer')}</p>
        </div>
      </footer>
    </div>
  );
}
