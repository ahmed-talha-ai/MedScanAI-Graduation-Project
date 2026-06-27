'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { staggerDelay } from '@/lib/animations';

// ── localStorage hook ─────────────────────────────────────────────────────────
function useLS<T>(key: string, init: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === 'undefined') return init;
    try { const s = localStorage.getItem(key); if (s) return JSON.parse(s) as T; } catch {}
    return init;
  });
  const save = (v: T) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  };
  return [val, save];
}

// ── Premium shared styles ─────────────────────────────────────────────────────
const glassCard = 'relative bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/40 dark:border-white/10 overflow-hidden';
const inputCls = 'w-full bg-white/60 dark:bg-white/10 border border-white/30 dark:border-white/15 rounded-xl px-4 py-3.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all backdrop-blur-sm placeholder:text-on-surface-variant/40';
const labelCls = 'block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider';
const btnPrimary = 'relative overflow-hidden px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 disabled:opacity-50';

// ── Mini Hero Banner Component ────────────────────────────────────────────────
function MiniHero({ icon, gradientFrom, gradientTo, children }: {
  icon: string; gradientFrom: string; gradientTo: string; children: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-xl mb-6`}>
      <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -start-6 w-24 h-24 rounded-full bg-white/8 blur-xl pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/25 shadow-lg">
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

// ── Input with icon ───────────────────────────────────────────────────────────
function IconInput({ icon, label, ...props }: {
  icon: string; label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute start-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <input {...props} className={`${inputCls} ps-11`} />
      </div>
    </div>
  );
}

// ── Shimmer Button ────────────────────────────────────────────────────────────
function ShimmerBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} className={btnPrimary} {...props}>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
    </button>
  );
}

// ── Premium Result Card ───────────────────────────────────────────────────────
function ResultCard({ children, delay = '0ms' }: { children: React.ReactNode; delay?: string }) {
  return (
    <div
      className={`${glassCard} anim-scale-in`}
      style={{ transitionDelay: delay }}
    >
      {/* Gradient top accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-t-2xl" />
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 1 — Growth Tracker (Premium)
// ══════════════════════════════════════════════════════════════════════════════
interface GrowthEntry { date: string; height: number; weight: number; }

function GrowthTracker() {
  const t = useTranslations('children');
  const locale = useLocale();
  const [entries, setEntries] = useLS<GrowthEntry[]>('ch_growth', []);
  const [form, setForm] = useState({ date: '', height: '', weight: '' });
  const [chartKey, setChartKey] = useState(0);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.date || !form.height || !form.weight) return;
    setEntries([...entries, { date: form.date, height: +form.height, weight: +form.weight }]);
    setForm({ date: '', height: '', weight: '' });
    setChartKey(k => k + 1);
  };

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const W = 400, H = 120, PAD = 16;
  const hMin = sorted.length > 0 ? Math.min(...sorted.map(e => e.height)) - 5 : 0;
  const hMax = sorted.length > 0 ? Math.max(...sorted.map(e => e.height)) + 5 : 100;
  const wMin = sorted.length > 0 ? Math.min(...sorted.map(e => e.weight)) - 2 : 0;
  const wMax = sorted.length > 0 ? Math.max(...sorted.map(e => e.weight)) + 2 : 50;
  const toX = (i: number) => PAD + (i / Math.max(sorted.length - 1, 1)) * (W - PAD * 2);
  const toYH = (h: number) => H - PAD - ((h - hMin) / (hMax - hMin || 1)) * (H - PAD * 2);
  const toYW = (w: number) => H - PAD - ((w - wMin) / (wMax - wMin || 1)) * (H - PAD * 2);
  const heightPts = sorted.map((e, i) => `${toX(i)},${toYH(e.height)}`).join(' ');
  const weightPts = sorted.map((e, i) => `${toX(i)},${toYW(e.weight)}`).join(' ');

  return (
    <div className="space-y-6">
      <MiniHero icon="trending_up" gradientFrom="from-emerald-500 via-teal-500" gradientTo="to-cyan-600">
        <h2 className="text-xl font-extrabold text-white">{t('growth.addEntry')}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.growth-tracker.desc' as never)}</p>
      </MiniHero>

      <div className={glassCard}>
        <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {([['date', t('growth.date'), 'date', 'calendar_today'], ['height', t('growth.heightCm'), 'number', 'straighten'], ['weight', t('growth.weightKg'), 'number', 'monitor_weight']] as const).map(([k, l, typ, ico]) => (
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{ico}</span>
                <input type={typ} value={form[k]} onChange={set(k)} className={`${inputCls} ps-11`} />
              </div>
            </div>
          ))}
        </div>
        <ShimmerBtn onClick={add}>
          <span className="material-symbols-outlined text-sm">add_circle</span>
          {t('growth.addRecord')}
        </ShimmerBtn>
      </div>

      {sorted.length >= 2 && (
        <div key={chartKey} className={`${glassCard} anim-scale-in`}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-secondary to-primary rounded-t-2xl" />
          <h2 className="font-extrabold text-on-surface mb-1">{t('growth.growthChart')}</h2>
          <div className="flex gap-4 text-xs mb-3">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-secondary inline-block rounded-full" />{t('growth.height')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block rounded-full" />{t('growth.weight')}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
            {[0.25, 0.5, 0.75, 1].map(f => (
              <line key={f} x1={PAD} y1={PAD + f * (H - PAD * 2)} x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
                stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
            ))}
            <polyline points={heightPts} fill="none" stroke="var(--color-secondary)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" pathLength="1000" strokeDasharray="1000"
              style={{ animation: 'draw-line 1.4s ease-out forwards', strokeDashoffset: 1000 }} />
            <polyline points={weightPts} fill="none" stroke="var(--color-primary)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" pathLength="1000" strokeDasharray="1000"
              style={{ animation: 'draw-line 1.4s 0.3s ease-out forwards', strokeDashoffset: 1000 }} />
            {sorted.map((e, i) => (
              <g key={i}>
                <circle cx={toX(i)} cy={toYH(e.height)} r="4" fill="var(--color-secondary)" style={{ animation: `bounceIn 0.4s ${0.2 + i * 0.08}s both` }} />
                <circle cx={toX(i)} cy={toYW(e.weight)} r="4" fill="var(--color-primary)" style={{ animation: `bounceIn 0.4s ${0.5 + i * 0.08}s both` }} />
              </g>
            ))}
          </svg>
        </div>
      )}

      {entries.length > 0 && (
        <div className={glassCard}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-t-2xl" />
          <h2 className="font-extrabold text-on-surface mb-4">{t('growth.history', { count: entries.length })}</h2>
          <div className="space-y-2">
            {[...entries].reverse().map((e, i) => (
              <div key={i} className={`flex items-center justify-between p-3.5 bg-white/50 dark:bg-white/5 rounded-xl text-sm gap-3 flex-wrap backdrop-blur-sm transition-all duration-500 anim-fade-up-in`}
                style={{ transitionDelay: staggerDelay(i, 60) }}>
                <span className="text-on-surface-variant font-medium">{new Date(e.date).toLocaleDateString(locale)}</span>
                <span className="font-bold text-secondary">{e.height} {t('units.cm')}</span>
                <span className="font-bold text-primary">{e.weight} {t('units.kg')}</span>
                <button
                  onClick={() => setEntries(entries.filter((_, j) => entries.length - 1 - j !== i))}
                  className="text-error hover:opacity-70 transition-opacity active:scale-90 w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 2 — BMI Calculator (Premium + Stepper + Comparison + Animations)
// ══════════════════════════════════════════════════════════════════════════════

function bmiToDeg(bmi: number) {
  const clamped = Math.max(10, Math.min(40, bmi));
  return ((clamped - 10) / 30) * 180;
}

// BMI percentiles for children (simplified WHO-based reference)
const BMI_PERCENTILES: Record<string, { p5: number; p50: number; p85: number; p95: number }> = {
  // Age in years → { 5th percentile, 50th, 85th, 95th }
  '2':  { p5: 14.0, p50: 16.0, p85: 17.5, p95: 18.5 },
  '3':  { p5: 13.5, p50: 15.5, p85: 17.0, p95: 18.0 },
  '4':  { p5: 13.0, p50: 15.0, p85: 16.5, p95: 17.5 },
  '5':  { p5: 12.8, p50: 15.0, p85: 16.8, p95: 18.0 },
  '6':  { p5: 12.5, p50: 15.2, p85: 17.2, p95: 18.5 },
  '7':  { p5: 12.8, p50: 15.5, p85: 17.8, p95: 19.2 },
  '8':  { p5: 13.0, p50: 16.0, p85: 18.5, p95: 20.0 },
  '9':  { p5: 13.2, p50: 16.5, p85: 19.2, p95: 21.0 },
  '10': { p5: 13.5, p50: 17.0, p85: 20.0, p95: 22.0 },
  '11': { p5: 13.8, p50: 17.5, p85: 20.8, p95: 23.0 },
  '12': { p5: 14.2, p50: 18.2, p85: 21.8, p95: 24.2 },
  '13': { p5: 14.8, p50: 19.0, p85: 22.8, p95: 25.5 },
  '14': { p5: 15.3, p50: 19.8, p85: 23.8, p95: 26.5 },
  '15': { p5: 15.8, p50: 20.5, p85: 24.5, p95: 27.2 },
  '16': { p5: 16.2, p50: 21.0, p85: 25.0, p95: 27.8 },
  '17': { p5: 16.5, p50: 21.5, p85: 25.5, p95: 28.2 },
  '18': { p5: 16.8, p50: 22.0, p85: 26.0, p95: 28.8 },
};

function BmiGauge({ bmi, color }: { bmi: number; color: string }) {
  const deg = bmiToDeg(bmi);
  return (
    <div className="relative w-64 h-32 mx-auto mb-4">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="28%" stopColor="#14b8a6" />
            <stop offset="35%" stopColor="#22c55e" />
            <stop offset="55%" stopColor="#22c55e" />
            <stop offset="60%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M 10 95 A 90 90 0 0 1 190 95" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" opacity="0.25" />
        <path d="M 10 95 A 90 90 0 0 1 190 95" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" className="anim-draw" />
        {/* Labels */}
        <text x="14" y="92" fontSize="7" fill="currentColor" opacity="0.4">10</text>
        <text x="88" y="18" fontSize="7" fill="currentColor" opacity="0.4">25</text>
        <text x="180" y="92" fontSize="7" fill="currentColor" opacity="0.4">40</text>
      </svg>
      <div
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{
          width: '3px', height: '80px', marginLeft: '-1.5px',
          transform: `rotate(${deg - 90}deg)`,
          transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className={`w-full h-full rounded-full ${color.replace('text-', 'bg-')} shadow-lg`} />
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-surface-container shadow-lg border-2 border-outline-variant" />
    </div>
  );
}

function ComparisonBar({ bmi, ageYears }: { bmi: number; ageYears: number }) {
  const t = useTranslations('children');
  const ageKey = String(Math.min(Math.max(Math.round(ageYears), 2), 18));
  const ref = BMI_PERCENTILES[ageKey] || BMI_PERCENTILES['10'];
  const minBmi = Math.max(ref.p5 - 3, 8);
  const maxBmi = Math.min(ref.p95 + 5, 40);
  const range = maxBmi - minBmi;
  const posPct = ((bmi - minBmi) / range) * 100;
  const p5Pct = ((ref.p5 - minBmi) / range) * 100;
  const p50Pct = ((ref.p50 - minBmi) / range) * 100;
  const p85Pct = ((ref.p85 - minBmi) / range) * 100;
  const p95Pct = ((ref.p95 - minBmi) / range) * 100;

  const status = bmi < ref.p5 ? 'below' : bmi <= ref.p85 ? 'normal' : bmi <= ref.p95 ? 'above' : 'high';
  const statusCfg: Record<string, { color: string; icon: string }> = {
    below:  { color: 'text-amber-600',  icon: 'trending_down' },
    normal: { color: 'text-emerald-600', icon: 'check_circle' },
    above:  { color: 'text-orange-600',  icon: 'trending_up' },
    high:   { color: 'text-red-600',     icon: 'warning' },
  };
  const cfg = statusCfg[status];

  return (
    <div className="mt-4 anim-fade-up-in" style={{ transitionDelay: '200ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined text-lg ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
        <span className={`font-bold text-sm ${cfg.color}`}>
          {status === 'below' ? t('bmi.comparisonBelow') :
           status === 'normal' ? t('bmi.comparisonNormal') :
           status === 'above' ? t('bmi.comparisonAbove') :
           t('bmi.comparisonHigh')}
        </span>
      </div>
      {/* Visual bar */}
      <div className="relative h-8 rounded-full overflow-hidden bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/30">
        {/* Zones */}
        <div className="absolute inset-y-0 bg-amber-200/40" style={{ left: '0%', width: `${p5Pct}%` }} />
        <div className="absolute inset-y-0 bg-emerald-200/40" style={{ left: `${p5Pct}%`, width: `${p85Pct - p5Pct}%` }} />
        <div className="absolute inset-y-0 bg-orange-200/40" style={{ left: `${p85Pct}%`, width: `${p95Pct - p85Pct}%` }} />
        <div className="absolute inset-y-0 bg-red-200/40" style={{ left: `${p95Pct}%`, width: `${100 - p95Pct}%` }} />
        {/* Percentile markers */}
        <div className="absolute inset-y-0 w-0.5 bg-amber-500/60" style={{ left: `${p5Pct}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-emerald-500/60" style={{ left: `${p50Pct}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-orange-500/60" style={{ left: `${p85Pct}%` }} />
        {/* Child position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 border-primary z-10 transition-all duration-1000"
          style={{ left: `calc(${Math.min(Math.max(posPct, 2), 98)}% - 10px)` }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-[9px] text-on-surface-variant/60 mt-1 px-0.5">
        <span>P5</span>
        <span>P50</span>
        <span>P85</span>
        <span>P95</span>
      </div>
    </div>
  );
}

function BmiCalculator() {
  const t = useTranslations('children');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [step, setStep] = useState(0); // 0=height, 1=weight+age, 2=result
  const [result, setResult] = useState<{ bmi: number; cat: string; color: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const steps = [
    { label: t('bmi.heightCm'), icon: 'straighten' },
    { label: t('bmi.weightKg') + ' & ' + t('bmi.ageYears'), icon: 'monitor_weight' },
    { label: t('bmi.calculateBmi'), icon: 'analytics' },
  ];

  const calc = () => {
    const w = +weight, h = +height / 100;
    if (!w || !h) return;
    const bmi = +(w / (h * h)).toFixed(1);
    const [cat, color] =
      bmi < 14   ? [t('bmi.catUnderweightSevere'), 'text-error'] :
      bmi < 18.5 ? [t('bmi.catUnderweight'), 'text-secondary'] :
      bmi < 25   ? [t('bmi.catHealthy'), 'text-primary'] :
      bmi < 30   ? [t('bmi.catOverweight'), 'text-secondary'] :
                   [t('bmi.catObese'), 'text-error'];
    setShowResult(false);
    setResult({ bmi, cat, color });
    setStep(2);
    requestAnimationFrame(() => setShowResult(true));
  };

  const recalc = () => {
    setResult(null);
    setShowResult(false);
    setStep(0);
    setWeight('');
    setHeight('');
    setAge('');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <MiniHero icon="monitor_weight" gradientFrom="from-green-500 via-lime-500" gradientTo="to-emerald-600">
        <h2 className="text-xl font-extrabold text-white">{t('tools.bmi-calculator.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.bmi-calculator.desc' as never)}</p>
      </MiniHero>

      {/* Stepper indicator */}
      <div className="flex items-center gap-2 justify-center mb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
              i < step ? 'bg-primary text-white shadow-lg' :
              i === step ? 'bg-primary/20 text-primary ring-2 ring-primary/40 shadow-md' :
              'bg-surface-container-high text-on-surface-variant'
            }`}>
              {i < step ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${i < step ? 'bg-primary' : 'bg-surface-container-high'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Height */}
      {step === 0 && (
        <div className={`${glassCard} anim-scale-in`}>
          <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-green-400/10 blur-xl pointer-events-none" />
          <div className="text-center mb-6">
            <span className="material-symbols-outlined text-5xl text-primary/30 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
            <h3 className="font-extrabold text-on-surface text-lg">{t('bmi.heightCm')}</h3>
          </div>
          <IconInput icon="straighten" label={t('bmi.heightCm')} type="number" value={height}
            onChange={e => setHeight(e.target.value)} placeholder="e.g. 110" />
          <div className="mt-5 flex justify-end">
            <ShimmerBtn onClick={() => height && setStep(1)} disabled={!height}>
              {t('bmi.nextStep')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </ShimmerBtn>
          </div>
        </div>
      )}

      {/* Step 1: Weight + Age */}
      {step === 1 && (
        <div className={`${glassCard} anim-scale-in`}>
          <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-lime-400/10 blur-xl pointer-events-none" />
          <div className="text-center mb-6">
            <span className="material-symbols-outlined text-5xl text-primary/30 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_weight</span>
            <h3 className="font-extrabold text-on-surface text-lg">{t('bmi.weightKg')}</h3>
          </div>
          <div className="space-y-4">
            <IconInput icon="monitor_weight" label={t('bmi.weightKg')} type="number" value={weight}
              onChange={e => setWeight(e.target.value)} placeholder="e.g. 20" />
            <IconInput icon="child_care" label={t('bmi.ageYears')} type="number" value={age}
              onChange={e => setAge(e.target.value)} placeholder="e.g. 5" />
          </div>
          <div className="mt-5 flex justify-between">
            <button onClick={() => setStep(0)} className="px-5 py-3 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all active:scale-95">
              <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_back</span>
            </button>
            <ShimmerBtn onClick={calc} disabled={!weight}>
              <span className="material-symbols-outlined text-sm">analytics</span>
              {t('bmi.calculateBmi')}
            </ShimmerBtn>
          </div>
        </div>
      )}

      {/* Step 2: Result */}
      {result && step === 2 && (
        <div className="space-y-5">
          <ResultCard>
            <div className={`text-center space-y-3 transition-all duration-500 ${showResult ? 'anim-bounce-in' : 'opacity-0 scale-75'}`}>
              <BmiGauge bmi={result.bmi} color={result.color} />
              <AnimatedNumber value={result.bmi} decimals={1} className={`text-6xl font-extrabold ${result.color}`} duration={1400} />
              <p className="text-sm text-on-surface-variant font-medium">{t('bmi.kgm2')}</p>
              <p className={`text-xl font-extrabold ${result.color}`}>{result.cat}</p>
            </div>
          </ResultCard>

          {/* Comparison with normal range */}
          {age && +age >= 2 && +age <= 18 && (
            <ResultCard delay="150ms">
              <h3 className="font-bold text-on-surface text-sm mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
                {t('bmi.comparisonTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant mb-3">{t('bmi.comparisonDesc', { age })}</p>
              <ComparisonBar bmi={result.bmi} ageYears={+age} />
            </ResultCard>
          )}

          {/* Health tips */}
          <ResultCard delay="300ms">
            <h3 className="font-bold text-on-surface text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
              {t('bmi.healthTips')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: 'restaurant', tip: t('bmi.tipNutrition'), color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
                { icon: 'directions_run', tip: t('bmi.tipActivity'), color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
                { icon: 'bedtime', tip: t('bmi.tipSleep'), color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
              ].map(({ icon, tip, color }, i) => (
                <div key={i} className={`${color} rounded-xl p-3.5 text-center anim-fade-up-in`} style={{ transitionDelay: `${300 + i * 80}ms` }}>
                  <span className="material-symbols-outlined text-2xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <p className="text-xs font-semibold leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </ResultCard>

          <div className="flex justify-center">
            <ShimmerBtn onClick={recalc}>
              <span className="material-symbols-outlined text-sm">refresh</span>
              {t('bmi.recalculate')}
            </ShimmerBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 3 — Symptom Checker (Premium)
// ══════════════════════════════════════════════════════════════════════════════
const SYMPTOMS = [
  { id: 'fever',    label: 'Fever > 38.5°C',               urgent: true  },
  { id: 'rash',     label: 'Widespread rash',               urgent: true  },
  { id: 'breath',   label: 'Difficulty breathing',          urgent: true  },
  { id: 'lethargy', label: 'Extreme lethargy/unresponsive', urgent: true  },
  { id: 'cough',    label: 'Cough / cold',                  urgent: false },
  { id: 'vomit',    label: 'Vomiting (< 3x)',               urgent: false },
  { id: 'diarrhea', label: 'Diarrhoea (< 5x)',              urgent: false },
  { id: 'runny',    label: 'Runny nose',                    urgent: false },
];

function SymptomChecker() {
  const t = useTranslations('children');
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const urgentHit = SYMPTOMS.filter(s => s.urgent && checked.includes(s.id));
  const triage = urgentHit.length > 0 ? 'urgent' : checked.length > 2 ? 'watch' : 'home';

  const triageCfg = {
    urgent: { label: t('symptoms.triageUrgent'), icon: 'emergency',  bg: 'bg-gradient-to-br from-red-500 to-rose-600', color: 'text-white', desc: t('symptoms.descUrgent') },
    watch:  { label: t('symptoms.triageWatch'),  icon: 'warning',    bg: 'bg-gradient-to-br from-amber-400 to-orange-500', color: 'text-white', desc: t('symptoms.descWatch') },
    home:   { label: t('symptoms.triageHome'),   icon: 'home',       bg: 'bg-gradient-to-br from-emerald-500 to-green-600', color: 'text-white', desc: t('symptoms.descHome') },
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <MiniHero icon="thermometer" gradientFrom="from-rose-500 via-pink-500" gradientTo="to-fuchsia-600">
        <h2 className="text-xl font-extrabold text-white">{t('symptoms.selectTitle')}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.symptom-checker.desc' as never)}</p>
      </MiniHero>

      <div className={glassCard}>
        <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-rose-400/10 blur-xl pointer-events-none" />
        <div className="space-y-2">
          {SYMPTOMS.map((s, idx) => {
            const isChecked = checked.includes(s.id);
            return (
              <label
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-300 anim-fade-up-in ${
                  isChecked
                    ? s.urgent ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-primary/5 dark:bg-primary/10 border border-primary/20'
                    : 'bg-white/40 dark:bg-white/5 border border-transparent hover:bg-white/60 dark:hover:bg-white/10'
                }`}
                style={{ transitionDelay: staggerDelay(idx, 50) }}
              >
                {/* Custom checkbox */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isChecked
                    ? s.urgent ? 'bg-red-500 shadow-md' : 'bg-primary shadow-md'
                    : 'border-2 border-outline-variant'
                }`}>
                  {isChecked && <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                </div>
                <span className={`text-sm font-semibold transition-colors duration-300 ${isChecked ? (s.urgent ? 'text-red-700 dark:text-red-400' : 'text-primary') : 'text-on-surface'}`}>
                  {t(`symptoms.${s.id}` as never)}
                </span>
                {s.urgent && <span className="ms-auto text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">{t('symptoms.urgentBadge')}</span>}
              </label>
            );
          })}
        </div>
      </div>

      {checked.length > 0 && (
        <div key={triage} className={`rounded-2xl p-6 text-center text-white shadow-xl anim-scale-in ${triageCfg[triage].bg}`}>
          <span className="material-symbols-outlined text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>{triageCfg[triage].icon}</span>
          <h3 className="font-extrabold text-xl">{triageCfg[triage].label}</h3>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">{triageCfg[triage].desc}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 4 — Developmental Milestones (Premium)
// ══════════════════════════════════════════════════════════════════════════════
const MS_LIST = [
  { id: 'smile',  label: 'Social smile',           months: 2  },
  { id: 'hold',   label: 'Holds head steady',       months: 3  },
  { id: 'roll',   label: 'Rolls over',              months: 4  },
  { id: 'sit',    label: 'Sits with support',       months: 6  },
  { id: 'wave',   label: 'Waves bye-bye',           months: 9  },
  { id: 'stand',  label: 'Pulls to stand',          months: 10 },
  { id: 'walk1',  label: 'First steps',             months: 12 },
  { id: 'words',  label: 'Says 5+ words',           months: 15 },
  { id: 'run',    label: 'Runs',                    months: 18 },
  { id: 'jump',   label: 'Jumps with both feet',    months: 24 },
];

function Milestones() {
  const t = useTranslations('children');
  const [done, setDone] = useLS<string[]>('ch_milestones', []);
  const toggle = (id: string) =>
    setDone(done.includes(id) ? done.filter(x => x !== id) : [...done, id]);
  const pct = Math.round(done.length / MS_LIST.length * 100);

  return (
    <div className="space-y-6">
      <MiniHero icon="psychology" gradientFrom="from-blue-500 via-indigo-500" gradientTo="to-violet-600">
        <h2 className="text-xl font-extrabold text-white">{t('tools.milestones.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.milestones.desc' as never)}</p>
      </MiniHero>

      {/* Progress section */}
      <div className={glassCard}>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 rounded-t-2xl" />
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.1" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-primary)" strokeWidth="5"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - pct / 100)}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-extrabold text-primary text-sm">{pct}%</span>
          </div>
          <div>
            <p className="font-extrabold text-on-surface text-lg">{done.length} / {MS_LIST.length}</p>
            <p className="text-sm text-on-surface-variant">{t('milestones.achievedCount', { count: done.length, total: MS_LIST.length })}</p>
          </div>
        </div>
      </div>

      {/* Milestone cards */}
      <div className="space-y-2.5">
        {MS_LIST.map((m, idx) => {
          const isDone = done.includes(m.id);
          return (
            <div
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 anim-fade-up-in ${
                isDone
                  ? 'bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/20 shadow-md'
                  : `${glassCard} hover:shadow-lg`
              }`}
              style={{ transitionDelay: staggerDelay(idx, 40, 500) }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${
                isDone ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-surface-container-high'
              }`}>
                {isDone ? (
                  <svg key={`${m.id}-done`} width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <polyline points="3,8 6.5,12 13,4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      pathLength="100" strokeDasharray="100" style={{ animation: 'draw-line 0.4s ease-out forwards', strokeDashoffset: 100 }} />
                  </svg>
                ) : (
                  <span className="text-xs text-on-surface-variant font-bold">{m.months}{t('units.months')}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm transition-colors duration-300 ${isDone ? 'text-primary' : 'text-on-surface'}`}>{t(`milestones.${m.id}` as never)}</p>
                <p className="text-xs text-on-surface-variant/70">{t('milestones.expectedMonths', { months: m.months })}</p>
              </div>
              {isDone && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg anim-bounce-in">{t('milestones.achievedBadge')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 5 — Dosage Calculator (Premium)
// ══════════════════════════════════════════════════════════════════════════════
function DosageCalc() {
  const t = useTranslations('children');
  const [weight, setWeight] = useState('');
  const [med, setMed] = useState<'para' | 'ibu'>('para');
  const [result, setResult] = useState<{ vol: string; mg: string; freq: string } | null>(null);
  const [resultKey, setResultKey] = useState(0);

  const calc = () => {
    const w = +weight;
    if (!w) return;
    if (med === 'para') {
      const mg = +(w * 15).toFixed(0);
      setResult({ vol: `${+(mg / 24).toFixed(1)} ${t('units.ml')}`, mg: `${mg} ${t('units.mg')}`, freq: t('dosage.paraFreq') });
    } else {
      const mg = +(w * 10).toFixed(0);
      setResult({ vol: `${+(mg / 20).toFixed(1)} ${t('units.ml')}`, mg: `${mg} ${t('units.mg')}`, freq: t('dosage.ibuFreq') });
    }
    setResultKey(k => k + 1);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <MiniHero icon="vaccines" gradientFrom="from-orange-500 via-amber-500" gradientTo="to-yellow-500">
        <h2 className="text-xl font-extrabold text-white">{t('tools.dosage-calculator.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.dosage-calculator.desc' as never)}</p>
      </MiniHero>

      <div className={`${glassCard} space-y-4`}>
        <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-orange-400/10 blur-xl pointer-events-none" />
        <IconInput icon="monitor_weight" label={t('dosage.weightKg')} type="number" value={weight}
          onChange={e => setWeight(e.target.value)} placeholder="e.g. 15" />
        <div>
          <label className={labelCls}>{t('dosage.medication')}</label>
          <div className="flex gap-3">
            {(['para', 'ibu'] as const).map(m => (
              <button key={m} onClick={() => setMed(m)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  med === m
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                    : 'bg-white/40 dark:bg-white/5 border border-white/30 text-on-surface hover:bg-white/60 dark:hover:bg-white/10'
                }`}>
                {m === 'para' ? t('dosage.para') : t('dosage.ibu')}
              </button>
            ))}
          </div>
        </div>
        <ShimmerBtn onClick={calc}>
          <span className="material-symbols-outlined text-sm">calculate</span>
          {t('dosage.calculateDose')}
        </ShimmerBtn>
      </div>

      {result && (
        <div key={resultKey} className="space-y-4">
          <ResultCard>
            <div className="text-center py-4 anim-scale-in">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-2 font-bold">{t('dosage.singleDose')}</p>
              <p className="text-5xl font-extrabold text-primary anim-bounce-in">{result.vol}</p>
              <p className="text-sm text-on-surface-variant mt-2 font-medium">{t('dosage.perDose', { mg: result.mg })}</p>
            </div>
          </ResultCard>
          <ResultCard delay="100ms">
            <div className="flex items-start gap-3 p-1 anim-fade-up-in" style={{ transitionDelay: '200ms' }}>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{t('dosage.frequency')}</p>
                <p className="text-sm text-on-surface-variant">{result.freq}</p>
              </div>
            </div>
          </ResultCard>
          <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-on-error-container rounded-2xl p-4 border border-red-200/30 dark:border-red-800/30 anim-fade-up-in" style={{ transitionDelay: '300ms' }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <p className="text-sm leading-relaxed"><span className="font-bold">{t('dosage.warningLabel')}</span>{t('dosage.warningText')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 6 — Vaccination Tracker (Premium)
// ══════════════════════════════════════════════════════════════════════════════
const VACC_SCHEDULE = [
  { name: 'BCG',              due: 'Birth'     },
  { name: 'Hepatitis B (1st)',due: 'Birth'     },
  { name: 'OPV (1st)',        due: '2 months'  },
  { name: 'DTP (1st)',        due: '2 months'  },
  { name: 'OPV (2nd)',        due: '4 months'  },
  { name: 'DTP (2nd)',        due: '4 months'  },
  { name: 'OPV (3rd)',        due: '6 months'  },
  { name: 'Hepatitis B (3rd)',due: '6 months'  },
  { name: 'MMR (1st)',        due: '12 months' },
  { name: 'Varicella (1st)', due: '12 months' },
  { name: 'DTP Booster',     due: '18 months' },
  { name: 'MMR (2nd)',        due: '18 months' },
];

function VaccTracker() {
  const t = useTranslations('children');
  const [done, setDone] = useLS<string[]>('ch_vaccines', []);
  const toggle = (n: string) =>
    setDone(done.includes(n) ? done.filter(x => x !== n) : [...done, n]);
  const pct = Math.round(done.length / VACC_SCHEDULE.length * 100);
  const R = 44, CX = 56, CY = 56, CIRC = 2 * Math.PI * R;
  const dashoffset = CIRC - (pct / 100) * CIRC;

  const dueKeyMap: Record<string, string> = {
    'Birth': 'birth', '2 months': 'm2', '4 months': 'm4',
    '6 months': 'm6', '12 months': 'm12', '18 months': 'm18'
  };

  return (
    <div className="space-y-6">
      <MiniHero icon="medical_services" gradientFrom="from-emerald-500 via-teal-500" gradientTo="to-green-600">
        <h2 className="text-xl font-extrabold text-white">{t('tools.vaccination-tracker.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.vaccination-tracker.desc' as never)}</p>
      </MiniHero>

      {/* Progress ring card */}
      <div className={glassCard}>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 rounded-t-2xl" />
        <div className="flex items-center gap-6">
          <svg width="112" height="112" className="flex-shrink-0">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-surface-container-high)" strokeWidth="9" />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#vaccGrad)" strokeWidth="9"
              strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashoffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }} />
            <defs>
              <linearGradient id="vaccGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <text x={CX} y={CY + 7} textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--color-primary)">{pct}%</text>
          </svg>
          <div>
            <p className="font-extrabold text-on-surface text-2xl">{done.length} / {VACC_SCHEDULE.length}</p>
            <p className="text-sm text-on-surface-variant">{t('vaccines.completedCount')}</p>
            {pct === 100 && (
              <span className="inline-flex items-center gap-1 mt-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full anim-bounce-in shadow-md">
                <span className="material-symbols-outlined text-sm">verified</span> {t('vaccines.allDone')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vaccine list */}
      <div className="space-y-2.5">
        {VACC_SCHEDULE.map((v, idx) => {
          const isDone = done.includes(v.name);
          return (
            <div
              key={v.name}
              onClick={() => toggle(v.name)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 anim-fade-up-in ${
                isDone
                  ? 'bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/20 shadow-sm'
                  : `${glassCard} hover:shadow-lg`
              }`}
              style={{ transitionDelay: staggerDelay(idx, 40, 600) }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDone ? 'bg-gradient-to-br from-primary to-secondary shadow-md' : 'bg-surface-container-high'
              }`}>
                {isDone
                  ? <span className="material-symbols-outlined text-white text-sm anim-rotate-in">check</span>
                  : <span className="material-symbols-outlined text-on-surface-variant text-sm">vaccines</span>
                }
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm transition-colors duration-300 ${isDone ? 'text-primary line-through opacity-60' : 'text-on-surface'}`}>{v.name}</p>
                <p className="text-xs text-on-surface-variant/70">{t('vaccines.due', { due: t(`vaccines.${dueKeyMap[v.due]}` as never) })}</p>
              </div>
              {isDone && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg anim-rotate-in">{t('vaccines.done')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 7 — Food Guide (Premium)
// ══════════════════════════════════════════════════════════════════════════════
const FOODS = [
  { age: '0-6 months',  safe: ['Breast milk', 'Formula'],                         avoid: ['Solids', 'Honey', "Cow's milk"],           intro: [] },
  { age: '6-8 months',  safe: ['Pureed vegetables', 'Rice cereal', 'Pureed fruits'], avoid: ['Honey', 'Whole nuts', 'Shellfish'],        intro: ['Soft mashed foods'] },
  { age: '9-12 months', safe: ['Soft cooked veg', 'Mashed legumes', 'Soft fruits'],  avoid: ['Honey', 'Salt', 'Added sugar'],           intro: ['Finger foods', 'Egg yolk'] },
  { age: '1-2 years',   safe: ['Soft family foods', "Cow's milk", 'Eggs'],           avoid: ['Honey', 'Hard candy'],                    intro: ['Peanut butter (thin)', 'Fish'] },
  { age: '2-5 years',   safe: ['All family foods', 'Whole grains', 'Dairy'],         avoid: ['Hard candy', 'Large nuts', 'Popcorn'],    intro: ['Most foods with supervision'] },
];

const FOOD_KEY_MAP: Record<string, string> = {
  'Breast milk': 'breastMilk', 'Formula': 'formula', 'Solids': 'solids', 'Honey': 'honey',
  "Cow's milk": 'cowsMilk', 'Pureed vegetables': 'pureedVeg', 'Rice cereal': 'riceCereal',
  'Pureed fruits': 'pureedFruits', 'Whole nuts': 'wholeNuts', 'Shellfish': 'shellfish',
  'Soft mashed foods': 'softMashed', 'Soft cooked veg': 'softCookedVeg', 'Mashed legumes': 'mashedLegumes',
  'Soft fruits': 'softFruits', 'Salt': 'salt', 'Added sugar': 'addedSugar', 'Finger foods': 'fingerFoods',
  'Egg yolk': 'eggYolk', 'Soft family foods': 'softFamily', 'Eggs': 'eggs', 'Hard candy': 'hardCandy',
  'Peanut butter (thin)': 'peanutButterThin', 'Fish': 'fish', 'All family foods': 'allFamily',
  'Whole grains': 'wholeGrains', 'Dairy': 'dairy', 'Large nuts': 'largeNuts', 'Popcorn': 'popcorn',
  'Most foods with supervision': 'mostFoodsSupervision'
};
const FOOD_AGE_MAP: Record<string, string> = {
  '0-6 months': 'age0_6', '6-8 months': 'age6_8', '9-12 months': 'age9_12',
  '1-2 years': 'age1_2', '2-5 years': 'age2_5'
};

function FoodGuide() {
  const t = useTranslations('children');
  const [age, setAge] = useState(0);
  const f = FOODS[age];

  return (
    <div className="space-y-6">
      <MiniHero icon="restaurant" gradientFrom="from-yellow-500 via-amber-500" gradientTo="to-orange-500">
        <h2 className="text-xl font-extrabold text-white">{t('tools.food-guide.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.food-guide.desc' as never)}</p>
      </MiniHero>

      {/* Premium pill tabs */}
      <div className="relative flex gap-2 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl overflow-x-auto border border-white/30 dark:border-white/10 shadow-lg">
        {FOODS.map((item, i) => (
          <button key={i} onClick={() => setAge(i)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 z-10 ${
              age === i ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/30 dark:hover:bg-white/10'
            }`}>
            {t(`food.${FOOD_AGE_MAP[item.age]}` as never)}
          </button>
        ))}
      </div>

      <div key={age} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { title: t('food.safe'), items: f.safe, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/30', delay: '0ms' },
          { title: t('food.avoid'), items: f.avoid, cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400', border: 'border-red-200/50 dark:border-red-800/30', delay: '80ms' },
          { title: t('food.introduce'), items: f.intro, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/30', delay: '160ms' },
        ]).map(({ title, items, cls, border, delay }) => (
          <div key={title} className={`${glassCard} ${border} border anim-scale-in`} style={{ transitionDelay: delay }}>
            <h3 className="font-extrabold text-on-surface text-sm mb-3">{title}</h3>
            {items.length === 0
              ? <p className="text-xs text-on-surface-variant/50 italic">{t('food.none')}</p>
              : <div className="flex flex-wrap gap-1.5">{items.map((item, ii) => (
                  <span key={item} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${cls} anim-bounce-in`}
                    style={{ animationDelay: `${ii * 40}ms` }}>{t(`food.${FOOD_KEY_MAP[item]}` as never)}</span>
                ))}</div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 8 — First Aid Hub (Premium)
// ══════════════════════════════════════════════════════════════════════════════
const FIRST_AID = [
  { title: 'Fever',            icon: 'thermometer',        steps: ['Undress child to a single layer', 'Give age-appropriate paracetamol or ibuprofen', 'Apply cool (not cold) damp cloth to forehead', 'Ensure adequate hydration', 'Seek emergency care if fever > 40°C or lasts > 3 days'] },
  { title: 'Choking',          icon: 'emergency',          steps: ['Call for help immediately', 'Infant: 5 back blows + 5 chest thrusts', 'Child: Abdominal thrusts (Heimlich)', 'Do not perform blind finger sweeps', 'Call emergency if object not removed in seconds'] },
  { title: 'Burns',            icon: 'local_fire_department', steps: ['Cool under running water for 20 min', 'Do NOT use ice, butter, or toothpaste', 'Cover loosely with clean cling wrap', 'Seek care for burns > 1 palm size', 'Call emergency for chemical or electrical burns'] },
  { title: 'Allergic Reaction',icon: 'warning',            steps: ['Use epinephrine auto-injector if available', 'Call emergency services immediately', 'Lay child flat with legs elevated', 'Recovery position if unconscious and breathing', 'Be ready to perform CPR'] },
  { title: 'Cuts & Wounds',    icon: 'healing',            steps: ['Apply firm pressure for 10 minutes', 'Clean gently with clean water', 'Apply antibiotic ointment if available', 'Cover with sterile bandage', 'Seek care if wound is deep, gaping, or bleeding persists'] },
  { title: 'Head Injury',      icon: 'medical_information',steps: ['Keep child still and calm', 'Apply ice pack wrapped in cloth for 20 min', 'Monitor closely for 24 hours', 'Seek emergency if unconscious, vomiting, or seizure', 'Avoid painkillers that mask symptoms'] },
];
const FA_TITLE_MAP: Record<string, string> = {
  'Fever': 'fever', 'Choking': 'choking', 'Burns': 'burns',
  'Allergic Reaction': 'allergic', 'Cuts & Wounds': 'cuts', 'Head Injury': 'head'
};

function FirstAidHub() {
  const t = useTranslations('children');
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <MiniHero icon="emergency" gradientFrom="from-red-500 via-rose-500" gradientTo="to-pink-600">
        <h2 className="text-xl font-extrabold text-white">{t('tools.first-aid.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.first-aid.desc' as never)}</p>
      </MiniHero>

      <div className="space-y-3">
        {FIRST_AID.map((fa, i) => {
          const titleKey = FA_TITLE_MAP[fa.title];
          const isOpen = open === i;
          return (
            <div key={i} className={`${glassCard} transition-all duration-300 anim-fade-up-in`} style={{ transitionDelay: staggerDelay(i, 60, 400) }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-4 p-1 text-start hover:bg-white/20 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${
                  isOpen ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <span className={`material-symbols-outlined transition-colors duration-300 ${isOpen ? 'text-white' : 'text-red-500'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{fa.icon}</span>
                </div>
                <span className="font-extrabold text-on-surface flex-1">{t(`firstaid.${titleKey}` as never)}</span>
                <span className="material-symbols-outlined text-on-surface-variant"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>expand_more</span>
              </button>
              <div style={{ maxHeight: isOpen ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                <div className="px-2 pb-2 pt-3 space-y-3 border-t border-white/20 dark:border-white/10 mt-2">
                  {fa.steps.map((_, j) => (
                    <div key={j} className="flex gap-3 items-start anim-fade-up-in" style={{ transitionDelay: `${j * 60}ms` }}>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">{j + 1}</div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{t(`firstaid.${titleKey}Step${j + 1}` as never)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Router — maps slug → tool component
// ══════════════════════════════════════════════════════════════════════════════
const TOOLS: Record<string, { title: string; icon: string; gradient: string; component: React.FC }> = {
  'growth-tracker':     { title: 'Growth Tracker',          icon: 'trending_up',       gradient: 'from-emerald-500 via-teal-500 to-cyan-600',   component: GrowthTracker  },
  'bmi-calculator':     { title: 'BMI Calculator',          icon: 'monitor_weight',    gradient: 'from-green-500 via-lime-500 to-emerald-600',  component: BmiCalculator  },
  'symptom-checker':    { title: 'Symptom Checker',         icon: 'thermometer',       gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',   component: SymptomChecker },
  'milestones':         { title: 'Developmental Milestones',icon: 'psychology',        gradient: 'from-blue-500 via-indigo-500 to-violet-600',  component: Milestones     },
  'dosage-calculator':  { title: 'Dosage Calculator',       icon: 'vaccines',          gradient: 'from-orange-500 via-amber-500 to-yellow-500', component: DosageCalc     },
  'vaccination-tracker':{ title: 'Vaccination Tracker',     icon: 'medical_services',  gradient: 'from-emerald-500 via-teal-500 to-green-600',  component: VaccTracker    },
  'food-guide':         { title: 'Food Guide',              icon: 'restaurant',        gradient: 'from-yellow-500 via-amber-500 to-orange-500', component: FoodGuide      },
  'first-aid':          { title: 'First Aid Hub',           icon: 'emergency',         gradient: 'from-red-500 via-rose-500 to-pink-600',       component: FirstAidHub    },
};

// ══════════════════════════════════════════════════════════════════════════════
// Default export — Premium wrapper
// ══════════════════════════════════════════════════════════════════════════════
export default function ChildToolPage() {
  const t       = useTranslations('children');
  const params  = useParams();
  const router  = useRouter();
  const locale  = (params?.locale as string) ?? 'ar';
  const slug    = (params?.tool   as string) ?? '';
  const cfg     = TOOLS[slug];

  if (!cfg) {
    router.replace(`/${locale}/dashboard/children`);
    return null;
  }

  const Component = cfg.component;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Premium back + title header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/children`}
          className="w-11 h-11 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition-all flex-shrink-0 border border-white/40 dark:border-white/10 shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-on-surface flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
            {t(`tools.${slug}.title` as never)}
          </h1>
        </div>
      </div>

      {/* Tool component */}
      <Component />

      {/* Premium disclaimer */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-container via-surface-container-lowest to-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-md mt-8">
        <div className="absolute -top-4 -end-4 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface">{t('medicalDisclaimer')}</span>{' '}
            {t('disclaimerText')}
          </p>
        </div>
      </div>
    </div>
  );
}
