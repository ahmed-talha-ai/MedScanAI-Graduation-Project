'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { staggerDelay } from '@/lib/animations';
import { DashboardHero } from '@/components/ui/DashboardHero';

// ── localStorage hook ─────────────────────────────────────────────────────────
function useLS<T>(key: string, init: T): [T, (v: T) => void] {
  // Lazy initializer reads localStorage once on mount — no useEffect needed
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

// ── shared styles ─────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all';
const labelCls = 'block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide';
const btnPrimary = 'px-6 py-3 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all ambient-shadow disabled:opacity-50';

// ══════════════════════════════════════════════════════════════════════════════
// Helper Components — reusable across all 8 tools
// ══════════════════════════════════════════════════════════════════════════════

/** MiniHero — accent-colored header bar per tool */
function MiniHero({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 shadow-xl mb-6"
      style={{ background: 'linear-gradient(135deg, var(--child-accent), var(--color-primary))' }}
    >
      <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 start-0 w-20 h-20 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/25 shadow-lg">
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

/** IconInput — input field with leading icon */
function IconInput({ icon, label, ...props }: { icon: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute start-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >{icon}</span>
        <input {...props} className={`${inputCls} ps-11`} />
      </div>
    </div>
  );
}

/** ShimmerBtn — gradient button with shimmer animation */
function ShimmerBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button className={`${btnPrimary} relative overflow-hidden active:scale-95`} {...props}>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <span className="shimmer-overlay absolute inset-0 pointer-events-none" />
    </button>
  );
}

/** ResultCard — result display card with accent top-border */
function ResultCard({ children, delay = '0ms' }: { children: React.ReactNode; delay?: string }) {
  return (
    <div
      className="relative bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border overflow-hidden anim-scale-in"
      style={{ transitionDelay: delay }}
    >
      <div
        className="absolute top-0 inset-x-0 h-1 rounded-t-xl"
        style={{ background: 'linear-gradient(90deg, var(--child-accent), var(--color-primary))' }}
      />
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Interactive Growth Chart — pure SVG + React state
// ══════════════════════════════════════════════════════════════════════════════
interface ChartProps {
  sorted: GrowthEntry[];
  locale: string;
  tHeight: string;
  tWeight: string;
  tTitle: string;
}

function InteractiveGrowthChart({ sorted, locale, tHeight, tWeight, tTitle }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);

  const W = 500, H = 200, PAD = 40;
  const hMin = Math.min(...sorted.map(e => e.height)) - 5;
  const hMax = Math.max(...sorted.map(e => e.height)) + 5;
  const wMin = Math.min(...sorted.map(e => e.weight)) - 2;
  const wMax = Math.max(...sorted.map(e => e.weight)) + 2;

  const toX = (i: number) => PAD + (i / Math.max(sorted.length - 1, 1)) * (W - PAD * 2);
  const toYH = (h: number) => H - PAD - ((h - hMin) / (hMax - hMin || 1)) * (H - PAD * 2);
  const toYW = (w: number) => H - PAD - ((w - wMin) / (wMax - wMin || 1)) * (H - PAD * 2);

  const heightPts = sorted.map((e, i) => `${toX(i)},${toYH(e.height)}`).join(' ');
  const weightPts = sorted.map((e, i) => `${toX(i)},${toYW(e.weight)}`).join(' ');

  const handleMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || sorted.length < 2) return;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pxX = clientX - rect.left;
    const ratio = pxX / rect.width;
    const svgX = ratio * W;
    // find nearest data point
    let nearest = 0;
    let minDist = Infinity;
    sorted.forEach((_, i) => {
      const dist = Math.abs(toX(i) - svgX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    setHover({ idx: nearest, x: toX(nearest), y: 0 });
  };

  const hEntry = hover ? sorted[hover.idx] : null;

  // Date axis labels — show max 6 to avoid crowding
  const step = Math.max(1, Math.floor(sorted.length / 6));
  const axisLabels = sorted.filter((_, i) => i % step === 0 || i === sorted.length - 1);
  const axisIndices = sorted.map((_, i) => i).filter(i => i % step === 0 || i === sorted.length - 1);

  return (
    <ResultCard delay="200ms">
      <h3 className="font-bold text-on-surface text-sm mb-1">{tTitle}</h3>

      {/* Legend */}
      <div className="flex gap-5 text-xs mb-4">
        <span className="flex items-center gap-2">
          <span className="w-4 h-[3px] rounded-full inline-block" style={{ background: 'var(--child-accent)' }} />
          {tHeight}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-[3px] rounded-full bg-primary inline-block" style={{ opacity: 0.7 }} />
          {tWeight}
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          style={{ height: 220 }}
          onMouseMove={handleMove}
          onTouchMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onTouchEnd={() => setHover(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <line
              key={f}
              x1={PAD} y1={PAD + f * (H - PAD * 2)}
              x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
              stroke="currentColor" strokeWidth="0.5" opacity="0.06"
            />
          ))}

          {/* Height area fill */}
          <polygon
            points={`${toX(0)},${H - PAD} ${heightPts} ${toX(sorted.length - 1)},${H - PAD}`}
            fill="var(--child-accent)"
            opacity="0.08"
          />

          {/* Height line — solid */}
          <polyline
            points={heightPts}
            fill="none"
            stroke="var(--child-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1000"
            strokeDasharray="1000"
            style={{ animation: 'draw-line 1.4s ease-out forwards', strokeDashoffset: 1000 }}
          />

          {/* Weight line — dashed */}
          <polyline
            points={weightPts}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
            pathLength="1000"
            style={{ animation: 'draw-line 1.4s 0.3s ease-out forwards', strokeDashoffset: 1000 }}
          />

          {/* Dot markers — height */}
          {sorted.map((e, i) => (
            <circle
              key={`h-${i}`}
              cx={toX(i)} cy={toYH(e.height)} r="4.5"
              fill="white"
              stroke="var(--child-accent)"
              strokeWidth="2"
              style={{ animation: `bounceIn 0.4s ${0.2 + i * 0.08}s both` }}
            />
          ))}

          {/* Dot markers — weight */}
          {sorted.map((e, i) => (
            <circle
              key={`w-${i}`}
              cx={toX(i)} cy={toYW(e.weight)} r="3.5"
              fill="white"
              stroke="var(--color-primary)"
              strokeWidth="2"
              style={{ animation: `bounceIn 0.4s ${0.5 + i * 0.08}s both` }}
            />
          ))}

          {/* Date axis labels */}
          {axisLabels.map((e, j) => {
            const i = axisIndices[j];
            const d = new Date(e.date);
            const label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
            return (
              <text
                key={i}
                x={toX(i)}
                y={H - 6}
                textAnchor="middle"
                fill="currentColor"
                opacity="0.4"
                fontSize="9"
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}

          {/* Hover tracking line + enlarged dots */}
          {hover && hEntry && (
            <>
              <line
                x1={hover.x} y1={PAD - 4}
                x2={hover.x} y2={H - PAD}
                stroke="var(--child-accent)"
                strokeWidth="1"
                strokeDasharray="4 2"
                opacity="0.5"
              />
              <circle cx={hover.x} cy={toYH(hEntry.height)} r="6" fill="var(--child-accent)" opacity="0.9" />
              <circle cx={hover.x} cy={toYW(hEntry.weight)} r="5" fill="var(--color-primary)" opacity="0.9" />
            </>
          )}
        </svg>

        {/* Floating tooltip */}
        {hover && hEntry && (
          <div
            className="absolute pointer-events-none z-20 bg-surface-container-lowest/95 backdrop-blur-lg rounded-xl px-4 py-3 shadow-xl border border-outline-variant/20 text-xs"
            style={{
              left: `${(hover.x / W) * 100}%`,
              top: 8,
              transform: hover.x > W * 0.65 ? 'translateX(-100%)' : 'translateX(0%)',
              minWidth: 140,
            }}
          >
            <p className="font-bold text-on-surface mb-2">
              {new Date(hEntry.date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--child-accent)' }} />
              <span className="text-on-surface-variant">{tHeight}:</span>
              <span className="font-bold ms-auto" style={{ color: 'var(--child-accent)' }}>{hEntry.height}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              <span className="text-on-surface-variant">{tWeight}:</span>
              <span className="font-bold text-primary ms-auto">{hEntry.weight}</span>
            </div>
          </div>
        )}
      </div>
    </ResultCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 1 — Growth Tracker
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
    setChartKey(k => k + 1); // remount to retrigger anim-draw
  };

  // Build SVG polyline points from entries
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

  const lastEntry = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  return (
    <div className="space-y-6">
      <MiniHero icon="trending_up">
        <h2 className="text-xl font-extrabold text-white">{t('growth.addEntry')}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.growth-tracker.desc' as never)}</p>
      </MiniHero>

      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <IconInput icon="calendar_today" label={t('growth.date')} type="date" value={form.date} onChange={set('date')} />
          <IconInput icon="straighten" label={t('growth.heightCm')} type="number" value={form.height} onChange={set('height')} placeholder="e.g. 95" />
          <IconInput icon="monitor_weight" label={t('growth.weightKg')} type="number" value={form.weight} onChange={set('weight')} placeholder="e.g. 14" />
        </div>
        <ShimmerBtn onClick={add}>
          <span className="material-symbols-outlined text-sm">add_circle</span>
          {t('growth.addRecord')}
        </ShimmerBtn>
      </div>

      {/* Last measurement summary */}
      {lastEntry && (
        <ResultCard delay="100ms">
          <h3 className="font-bold text-on-surface text-sm mb-3">{t('growth.lastMeasurement')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-on-surface-variant">{t('growth.date')}</p>
              <p className="font-bold text-on-surface text-sm mt-1">{new Date(lastEntry.date).toLocaleDateString(locale)}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{t('growth.height')}</p>
              <p className="font-bold text-sm mt-1" style={{ color: 'var(--child-accent)' }}>{lastEntry.height} {t('units.cm')}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{t('growth.weight')}</p>
              <p className="font-bold text-primary text-sm mt-1">{lastEntry.weight} {t('units.kg')}</p>
            </div>
          </div>
        </ResultCard>
      )}

      {/* ─── Interactive Growth Chart ─── */}
      {sorted.length < 2 ? (
        entries.length > 0 && (
          <ResultCard delay="200ms">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/40" style={{ fontVariationSettings: "'FILL' 1" }}>show_chart</span>
              <p className="text-sm text-on-surface-variant">{t('growth.chartMinEntries')}</p>
            </div>
          </ResultCard>
        )
      ) : (
        <InteractiveGrowthChart
          key={chartKey}
          sorted={sorted}
          locale={locale}
          tHeight={t('growth.height')}
          tWeight={t('growth.weight')}
          tTitle={t('growth.growthChart')}
        />
      )}

      {entries.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border">
          <h2 className="font-bold text-on-surface mb-4">{t('growth.history', { count: entries.length })}</h2>
          <div className="space-y-2">
            {[...entries].reverse().map((e, i) => (
              <div key={i} className={`flex items-center justify-between p-3 bg-surface-container-low rounded-lg text-sm gap-3 flex-wrap transition-all duration-500 anim-fade-up-in`}
                style={{ transitionDelay: staggerDelay(i, 60) }}>
                <span className="text-on-surface-variant">{new Date(e.date).toLocaleDateString(locale)}</span>
                <span className="font-semibold text-secondary">{e.height} {t('units.cm')}</span>
                <span className="font-semibold text-primary">{e.weight} {t('units.kg')}</span>
                <button
                  onClick={() => setEntries(entries.filter((_, j) => entries.length - 1 - j !== i))}
                  className="text-error hover:opacity-70 transition-opacity active:scale-90"
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
// TOOL 2 — BMI Calculator
// ══════════════════════════════════════════════════════════════════════════════

// Maps BMI to a 0–180° rotation on a semicircular gauge (10–40 range)
function bmiToDeg(bmi: number) {
  const clamped = Math.max(10, Math.min(40, bmi));
  return ((clamped - 10) / 30) * 180;
}

function BmiGauge({ bmi, color }: { bmi: number; color: string }) {
  const deg = bmiToDeg(bmi);
  // Gauge arc colours: underweight → healthy → overweight → obese
  return (
    <div className="relative w-56 h-28 mx-auto mb-2">
      {/* Arc background */}
      <svg viewBox="0 0 200 100" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-secondary)" />
            <stop offset="28%" stopColor="var(--color-secondary)" />
            <stop offset="29%" stopColor="var(--color-primary)" />
            <stop offset="50%" stopColor="var(--color-primary)" />
            <stop offset="51%" stopColor="var(--color-secondary)" />
            <stop offset="66%" stopColor="var(--color-secondary)" />
            <stop offset="67%" stopColor="var(--color-error)" />
            <stop offset="100%" stopColor="var(--color-error)" />
          </linearGradient>
        </defs>
        <path
          d="M 10 95 A 90 90 0 0 1 190 95"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 10 95 A 90 90 0 0 1 190 95"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          className="anim-draw"
        />
      </svg>
      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{
          width: '3px',
          height: '80px',
          marginLeft: '-1.5px',
          transform: `rotate(${deg - 90}deg)`,
          transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className={`w-full h-full rounded-full ${color.replace('text-', 'bg-')}`} />
      </div>
      {/* Center dot */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-outline-variant" />
    </div>
  );
}

function BmiCalculator() {
  const t = useTranslations('children');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<{ bmi: number; cat: string; color: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

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
    // Trigger bounce-in on next frame
    requestAnimationFrame(() => setShowResult(true));
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <MiniHero icon="monitor_weight">
        <h2 className="text-xl font-extrabold text-white">{t('bmi.calculateBmi')}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.bmi-calculator.desc' as never)}</p>
      </MiniHero>

      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-4">
        <IconInput icon="monitor_weight" label={t('bmi.weightKg')} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 20" />
        <IconInput icon="straighten" label={t('bmi.heightCm')} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 110" />
        <ShimmerBtn onClick={calc}>{t('bmi.calculateBmi')}</ShimmerBtn>
      </div>
      {result && (
        <ResultCard>
          <div className={`text-center space-y-2 transition-all duration-500 ${showResult ? 'anim-bounce-in' : 'opacity-0 scale-75'}`}>
            <BmiGauge bmi={result.bmi} color={result.color} />
            <AnimatedNumber value={result.bmi} decimals={1} className={`text-6xl font-extrabold ${result.color}`} duration={1400} />
            <p className="text-sm text-on-surface-variant">{t('bmi.kgm2')}</p>
            <p className={`text-lg font-bold ${result.color}`}>{result.cat}</p>
            {/* WHO category badge */}
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mt-1"
              style={{ backgroundColor: 'var(--child-accent-soft)', color: 'var(--child-accent)' }}
            >{result.cat}</span>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 3 — Symptom Checker
// ══════════════════════════════════════════════════════════════════════════════
const SYMPTOMS = [
  { id: 'fever',    label: 'Fever > 38.5°C',               urgent: true  },
  { id: 'rash',     label: 'Widespread rash',               urgent: true  },
  { id: 'breath',   label: 'Difficulty breathing',          urgent: true  },
  { id: 'lethargy', label: 'Extreme lethargy/unresponsive', urgent: true  },
  { id: 'cough',    label: 'Cough / cold',                  urgent: false },
  { id: 'vomit',    label: 'Vomiting (< 3×)',               urgent: false },
  { id: 'diarrhea', label: 'Diarrhoea (< 5×)',              urgent: false },
  { id: 'runny',    label: 'Runny nose',                    urgent: false },
];

function SymptomChecker() {
  const t = useTranslations('children');
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const urgentHit = SYMPTOMS.filter(s => s.urgent && checked.includes(s.id));
  const triage = urgentHit.length > 0 ? 'urgent' : checked.length > 2 ? 'watch' : 'home';
  const severityPct = Math.round((checked.length / SYMPTOMS.length) * 100);

  const triageCfg = {
    urgent: { label: t('symptoms.triageUrgent'), icon: 'emergency',  cls: 'bg-error-container',  color: 'text-error'     },
    watch:  { label: t('symptoms.triageWatch'),  icon: 'warning',    cls: 'bg-secondary/10',     color: 'text-secondary' },
    home:   { label: t('symptoms.triageHome'),   icon: 'home',       cls: 'bg-primary/10',       color: 'text-primary'   },
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <MiniHero icon="thermometer">
        <h2 className="text-xl font-extrabold text-white">{t('symptoms.selectTitle')}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.symptom-checker.desc' as never)}</p>
      </MiniHero>

      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border">
        {/* Severity progress bar */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-on-surface-variant font-medium">{t('symptoms.severityLevel')}</span>
          <span className="font-bold" style={{ color: checked.length > 0 ? 'var(--child-accent)' : undefined }}>{severityPct}%</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full mb-5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${severityPct}%`, backgroundColor: 'var(--child-accent)' }}
          />
        </div>

        <h2 className="font-bold text-on-surface mb-4">{t('symptoms.selectTitle')}</h2>
        <div className="space-y-3">
          {SYMPTOMS.map((s, idx) => (
            <label
              key={s.id}
              className="flex items-center gap-3 cursor-pointer anim-fade-up-in"
              style={{ transitionDelay: staggerDelay(idx, 50) }}
            >
              <input
                type="checkbox"
                checked={checked.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="w-4 h-4 accent-primary transition-transform active:scale-90"
              />
              <span className={`text-sm font-medium transition-colors duration-300 ${checked.includes(s.id) ? (s.urgent ? 'text-error' : 'text-primary') : (s.urgent ? 'text-error' : 'text-on-surface')}`}>
                {t(`symptoms.${s.id}` as never)}
                {s.urgent && <span className="ms-2 text-xs bg-error-container text-error px-2 py-0.5 rounded-full">{t('symptoms.urgentBadge')}</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {checked.length > 0 && (
        <ResultCard>
          <div
            key={triage}
            className={`rounded-xl p-6 text-center transition-colors duration-500 ${triageCfg[triage].cls}`}
          >
            <span className={`material-symbols-outlined text-4xl ${triageCfg[triage].color} transition-colors duration-500`}>{triageCfg[triage].icon}</span>
            <h3 className={`font-bold text-lg mt-2 ${triageCfg[triage].color} transition-colors duration-500`}>{triageCfg[triage].label}</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              {triage === 'urgent' ? t('symptoms.descUrgent') :
               triage === 'watch'  ? t('symptoms.descWatch') :
                                     t('symptoms.descHome')}
            </p>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 4 — Developmental Milestones
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
  const locale = useLocale();
  const [done, setDone] = useLS<string[]>('ch_milestones', []);
  const toggle = (id: string) =>
    setDone(done.includes(id) ? done.filter(x => x !== id) : [...done, id]);

  const pct = Math.round(done.length / MS_LIST.length * 100);

  // Progress ring params
  const R = 36, CX = 44, CY = 44, CIRC = 2 * Math.PI * R;
  const dashoffset = CIRC - (pct / 100) * CIRC;

  return (
    <div className="space-y-3">
      <MiniHero icon="psychology">
        <h2 className="text-xl font-extrabold text-white">{t('tools.milestones.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.milestones.desc' as never)}</p>
      </MiniHero>

      {/* Progress ring + counter */}
      <div className="flex items-center gap-6 bg-surface-container-lowest rounded-xl p-5 ambient-shadow ghost-border mb-2">
        <svg width="88" height="88" className="flex-shrink-0">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-surface-container-high)" strokeWidth="7" />
          <circle
            cx={CX} cy={CY} r={R} fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashoffset}
            style={{
              stroke: 'var(--child-accent)',
              transform: 'rotate(-90deg)',
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--child-accent)">{pct}%</text>
        </svg>
        <div>
          <p className="text-on-surface-variant text-sm">{t('milestones.achievedCount', { count: done.length, total: MS_LIST.length })}</p>
        </div>
      </div>

      {/* Linear progress bar */}
      <div className="w-full h-2 bg-surface-container-high rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: 'var(--child-accent)' }}
        />
      </div>
      {MS_LIST.map((m, idx) => {
        const isDone = done.includes(m.id);
        return (
          <div
            key={m.id}
            onClick={() => toggle(m.id)}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 anim-fade-up-in ${
              isDone
                ? 'bg-primary/10 border border-primary/30'
                : 'bg-surface-container-lowest ambient-shadow ghost-border hover:bg-surface-container-low'
            }`}
            style={{ transitionDelay: staggerDelay(idx, 40, 500) }}
          >
            {/* SVG draw-on checkmark */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isDone ? 'signature-gradient' : 'bg-surface-container-high border-2 border-outline-variant'}`}>
              {isDone ? (
                <svg key={`${m.id}-done`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <polyline
                    points="3,8 6.5,12 13,4"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="100"
                    strokeDasharray="100"
                    style={{ animation: 'draw-line 0.4s ease-out forwards', strokeDashoffset: 100 }}
                  />
                </svg>
              ) : (
                <span className="text-xs text-on-surface-variant font-bold">{m.months}{t('units.months')}</span>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm transition-colors duration-300 ${isDone ? 'text-primary' : 'text-on-surface'}`}>{t(`milestones.${m.id}` as never)}</p>
              <p className="text-xs text-on-surface-variant">{t('milestones.expectedMonths', { months: m.months })}</p>
            </div>
            {isDone && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full anim-bounce-in">
                {t('milestones.achievedBadge')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 5 — Dosage Calculator
// ══════════════════════════════════════════════════════════════════════════════
function DosageCalc() {
  const t = useTranslations('children');
  const locale = useLocale();
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

  // Comparison table data — computed for current weight
  const w = +weight;
  const paraForWeight = w > 0 ? { mg: +(w * 15).toFixed(0), vol: +((w * 15) / 24).toFixed(1) } : null;
  const ibuForWeight  = w > 0 ? { mg: +(w * 10).toFixed(0), vol: +((w * 10) / 20).toFixed(1) } : null;
  const weightOutOfRange = w > 0 && (w < 3 || w > 50);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <MiniHero icon="vaccines">
        <h2 className="text-xl font-extrabold text-white">{t('dosage.calculateDose')}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.dosage-calculator.desc' as never)}</p>
      </MiniHero>

      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-4">
        <IconInput icon="monitor_weight" label={t('dosage.weightKg')} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 15" />
        <div>
          <label className={labelCls}>{t('dosage.medication')}</label>
          <div className="flex gap-3 flex-wrap">
            {(['para', 'ibu'] as const).map(m => (
              <button key={m} onClick={() => setMed(m)}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold border transition-all active:scale-95 ${med === m ? 'signature-gradient text-white border-transparent' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
                {m === 'para' ? t('dosage.para') : t('dosage.ibu')}
              </button>
            ))}
          </div>
        </div>
        <ShimmerBtn onClick={calc}>{t('dosage.calculateDose')}</ShimmerBtn>
      </div>

      {/* Weight warning */}
      {weightOutOfRange && (
        <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm flex items-center gap-3 anim-scale-in">
          <span className="material-symbols-outlined text-error">warning</span>
          <p className="font-medium">{t('dosage.weightWarning')}</p>
        </div>
      )}

      {result && (
        <div key={resultKey} className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-4 anim-scale-in">
          <div className="text-center bg-primary/10 rounded-xl p-6 anim-fade-up-in" style={{ transitionDelay: '100ms' }}>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">{t('dosage.singleDose')}</p>
            <p className="text-5xl font-extrabold text-primary anim-bounce-in">{result.vol}</p>
            <p className="text-sm text-on-surface-variant mt-1">{t('dosage.perDose', { mg: result.mg })}</p>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-lg anim-fade-up-in" style={{ transitionDelay: '200ms' }}>
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <div>
              <p className="font-semibold text-on-surface text-sm">{t('dosage.frequency')}</p>
              <p className="text-sm text-on-surface-variant">{result.freq}</p>
            </div>
          </div>
          <div className="bg-error-container text-on-error-container rounded-lg p-4 text-sm anim-fade-up-in" style={{ transitionDelay: '300ms' }}>
            <span className="font-bold">{t('dosage.warningLabel')}</span>{t('dosage.warningText')}
          </div>
        </div>
      )}

      {/* Dual drug comparison table */}
      {paraForWeight && ibuForWeight && (
        <ResultCard delay="400ms">
          <h3 className="font-bold text-on-surface text-sm mb-4">{t('dosage.comparison')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--child-accent-soft)' }}>
              <p className="text-xs text-on-surface-variant mb-2 font-semibold">{t('dosage.para')}</p>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--child-accent)' }}>{paraForWeight.vol} {t('units.ml')}</p>
              <p className="text-xs text-on-surface-variant mt-1">{paraForWeight.mg} {t('units.mg')}</p>
              <p className="text-xs text-on-surface-variant mt-2">{t('dosage.paraFreq')}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <p className="text-xs text-on-surface-variant mb-2 font-semibold">{t('dosage.ibu')}</p>
              <p className="text-2xl font-extrabold text-primary">{ibuForWeight.vol} {t('units.ml')}</p>
              <p className="text-xs text-on-surface-variant mt-1">{ibuForWeight.mg} {t('units.mg')}</p>
              <p className="text-xs text-on-surface-variant mt-2">{t('dosage.ibuFreq')}</p>
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 6 — Vaccination Tracker
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

  // Circular progress ring params
  const R = 40, CX = 52, CY = 52, CIRC = 2 * Math.PI * R;
  const dashoffset = CIRC - (pct / 100) * CIRC;

  const dueKeyMap: Record<string, string> = {
    'Birth': 'birth',
    '2 months': 'm2',
    '4 months': 'm4',
    '6 months': 'm6',
    '12 months': 'm12',
    '18 months': 'm18'
  };

  // Find first vaccine not done yet
  const nextVacc = VACC_SCHEDULE.find(v => !done.includes(v.name));

  return (
    <div className="space-y-3">
      <MiniHero icon="medical_services">
        <h2 className="text-xl font-extrabold text-white">{t('tools.vaccination-tracker.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.vaccination-tracker.desc' as never)}</p>
      </MiniHero>

      {/* Circular progress + count */}
      <div className="flex items-center gap-6 bg-surface-container-lowest rounded-xl p-5 ambient-shadow ghost-border mb-2">
        <svg width="104" height="104" className="flex-shrink-0">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-surface-container-high)" strokeWidth="8" />
          <circle
            cx={CX} cy={CY} r={R} fill="none"
            stroke="var(--color-primary)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashoffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
          <text x={CX} y={CY + 6} textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--color-primary)">{pct}%</text>
        </svg>
        <div>
          <p className="font-bold text-on-surface text-lg">{done.length} / {VACC_SCHEDULE.length}</p>
          <p className="text-sm text-on-surface-variant">{t('vaccines.completedCount')}</p>
          {pct === 100 && (
            <span className="inline-flex items-center gap-1 mt-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full anim-bounce-in">
              <span className="material-symbols-outlined text-sm">verified</span> {t('vaccines.allDone')}
            </span>
          )}
          {/* Next due badge */}
          {nextVacc && pct < 100 && (
            <span
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--child-accent-soft)', color: 'var(--child-accent)' }}
            >
              <span className="material-symbols-outlined text-sm">schedule</span>
              {t('vaccines.nextDue')}: {nextVacc.name}
            </span>
          )}
        </div>
      </div>

      {VACC_SCHEDULE.map((v, idx) => (
        <div
          key={v.name}
          onClick={() => toggle(v.name)}
          className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 anim-left-in ${
            done.includes(v.name)
              ? 'bg-primary/10 border border-primary/30'
              : 'bg-surface-container-lowest ambient-shadow ghost-border hover:bg-surface-container-low'
          }`}
          style={{ transitionDelay: staggerDelay(idx, 40, 600) }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${done.includes(v.name) ? 'signature-gradient' : 'bg-surface-container-high'}`}>
            {done.includes(v.name)
              ? <span className="material-symbols-outlined text-white text-sm anim-rotate-in">check</span>
              : <span className="material-symbols-outlined text-on-surface-variant text-sm">vaccines</span>
            }
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm transition-colors duration-300 ${done.includes(v.name) ? 'text-primary line-through opacity-70' : 'text-on-surface'}`}>{v.name}</p>
            <p className="text-xs text-on-surface-variant">{t('vaccines.due', { due: t(`vaccines.${dueKeyMap[v.due]}` as never) })}</p>
          </div>
          {done.includes(v.name) && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full anim-rotate-in">{t('vaccines.done')}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 7 — Food Guide
// ══════════════════════════════════════════════════════════════════════════════
const FOODS = [
  { age: '0–6 months',  safe: ['Breast milk', 'Formula'],                         avoid: ['Solids', 'Honey', "Cow's milk"],           intro: [] },
  { age: '6–8 months',  safe: ['Pureed vegetables', 'Rice cereal', 'Pureed fruits'], avoid: ['Honey', 'Whole nuts', 'Shellfish'],        intro: ['Soft mashed foods'] },
  { age: '9–12 months', safe: ['Soft cooked veg', 'Mashed legumes', 'Soft fruits'],  avoid: ['Honey', 'Salt', 'Added sugar'],           intro: ['Finger foods', 'Egg yolk'] },
  { age: '1–2 years',   safe: ['Soft family foods', "Cow's milk", 'Eggs'],           avoid: ['Honey', 'Hard candy'],                    intro: ['Peanut butter (thin)', 'Fish'] },
  { age: '2–5 years',   safe: ['All family foods', 'Whole grains', 'Dairy'],         avoid: ['Hard candy', 'Large nuts', 'Popcorn'],    intro: ['Most foods with supervision'] },
];

const FOOD_KEY_MAP: Record<string, string> = {
  'Breast milk': 'breastMilk',
  'Formula': 'formula',
  'Solids': 'solids',
  'Honey': 'honey',
  "Cow's milk": 'cowsMilk',
  'Pureed vegetables': 'pureedVeg',
  'Rice cereal': 'riceCereal',
  'Pureed fruits': 'pureedFruits',
  'Whole nuts': 'wholeNuts',
  'Shellfish': 'shellfish',
  'Soft mashed foods': 'softMashed',
  'Soft cooked veg': 'softCookedVeg',
  'Mashed legumes': 'mashedLegumes',
  'Soft fruits': 'softFruits',
  'Salt': 'salt',
  'Added sugar': 'addedSugar',
  'Finger foods': 'fingerFoods',
  'Egg yolk': 'eggYolk',
  'Soft family foods': 'softFamily',
  'Eggs': 'eggs',
  'Hard candy': 'hardCandy',
  'Peanut butter (thin)': 'peanutButterThin',
  'Fish': 'fish',
  'All family foods': 'allFamily',
  'Whole grains': 'wholeGrains',
  'Dairy': 'dairy',
  'Large nuts': 'largeNuts',
  'Popcorn': 'popcorn',
  'Most foods with supervision': 'mostFoodsSupervision'
};

const FOOD_AGE_MAP: Record<string, string> = {
  '0–6 months': 'age0_6',
  '6–8 months': 'age6_8',
  '9–12 months': 'age9_12',
  '1–2 years': 'age1_2',
  '2–5 years': 'age2_5'
};

function FoodGuide() {
  const t = useTranslations('children');
  const [age, setAge] = useState(0);
  const f = FOODS[age];

  return (
    <div className="space-y-6">
      <MiniHero icon="restaurant">
        <h2 className="text-xl font-extrabold text-white">{t('tools.food-guide.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.food-guide.desc' as never)}</p>
      </MiniHero>

      {/* Sliding pill tabs */}
      <div className="relative flex gap-2 bg-surface-container-high p-1 rounded-2xl overflow-x-auto">
        {FOODS.map((item, i) => (
          <button
            key={i}
            onClick={() => setAge(i)}
            className={`relative px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 z-10 ${
              age === i ? 'signature-gradient text-white ambient-shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t(`food.${FOOD_AGE_MAP[item.age]}` as never)}
          </button>
        ))}
      </div>
      {/* key forces re-mount → crossfade entrance */}
      <div key={age} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { title: t('food.safe'),       items: f.safe,  pillCls: 'food-pill-safe',    border: 'border-primary/20',   delay: '0ms'   },
          { title: t('food.avoid'),      items: f.avoid, pillCls: 'food-pill-avoid',   border: 'border-error/20',     delay: '80ms'  },
          { title: t('food.introduce'),  items: f.intro, pillCls: 'food-pill-intro',   border: 'border-secondary/20', delay: '160ms' },
        ] as const).map(({ title, items, pillCls, border, delay }) => (
          <div
            key={title}
            className={`rounded-xl p-5 border ${border} bg-surface-container-lowest ambient-shadow anim-scale-in`}
            style={{ transitionDelay: delay }}
          >
            <h3 className="font-bold text-on-surface text-sm mb-3">{title}</h3>
            {items.length === 0
              ? <p className="text-xs text-on-surface-variant italic">{t('food.none')}</p>
              : <div className="flex flex-wrap gap-1">{items.map((item, ii) => (
                  <span
                    key={item}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full anim-bounce-in ${
                      pillCls === 'food-pill-safe' ? 'bg-primary/10 text-primary' :
                      pillCls === 'food-pill-avoid' ? 'bg-error-container text-error' :
                      'bg-secondary/10 text-secondary'
                    }`}
                    style={{ animationDelay: `${ii * 40}ms` }}
                  >{t(`food.${FOOD_KEY_MAP[item]}` as never)}</span>
                ))}</div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 8 — First Aid Hub
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
  'Fever': 'fever',
  'Choking': 'choking',
  'Burns': 'burns',
  'Allergic Reaction': 'allergic',
  'Cuts & Wounds': 'cuts',
  'Head Injury': 'head'
};

function FirstAidHub() {
  const t = useTranslations('children');
  const [open, setOpen] = useState<number | null>(null);
  const [readSteps, setReadSteps] = useState<Record<number, number>>({});

  const markStepRead = (accordionIdx: number, stepIdx: number) => {
    setReadSteps(prev => ({
      ...prev,
      [accordionIdx]: Math.max(prev[accordionIdx] ?? 0, stepIdx + 1)
    }));
  };

  return (
    <div className="space-y-3">
      <MiniHero icon="emergency">
        <h2 className="text-xl font-extrabold text-white">{t('tools.first-aid.title' as never)}</h2>
        <p className="text-white/70 text-xs mt-0.5">{t('tools.first-aid.desc' as never)}</p>
      </MiniHero>

      {FIRST_AID.map((fa, i) => {
        const titleKey = FA_TITLE_MAP[fa.title];
        const isOpen = open === i;
        const stepsRead = readSteps[i] ?? 0;
        const progressPct = Math.round((stepsRead / fa.steps.length) * 100);

        return (
          <div
            key={i}
            className={`bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden transition-all duration-300 anim-fade-up-in`}
            style={{ transitionDelay: staggerDelay(i, 60, 400) }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center gap-4 p-5 text-start hover:bg-surface-container-low transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${isOpen ? 'bg-error text-white' : 'bg-error-container'}`}>
                <span className={`material-symbols-outlined transition-colors duration-300 ${isOpen ? 'text-white' : 'text-error'}`}>{fa.icon}</span>
              </div>
              <span className="font-bold text-on-surface flex-1">{t(`firstaid.${titleKey}` as never)}</span>
              {/* Step counter */}
              {stepsRead > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--child-accent-soft)', color: 'var(--child-accent)' }}>
                  {stepsRead}/{fa.steps.length}
                </span>
              )}
              <span
                className="material-symbols-outlined text-on-surface-variant"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >expand_more</span>
            </button>
            {/* CSS max-height transition — no layout jump */}
            <div
              style={{
                maxHeight: isOpen ? '500px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <div className="px-5 pb-5 space-y-3 border-t border-surface-container-high pt-4">
                {/* Step counter label */}
                <p className="text-xs font-semibold" style={{ color: 'var(--child-accent)' }}>
                  {t('firstaid.stepOf', { step: Math.min(stepsRead + 1, fa.steps.length), total: fa.steps.length })}
                </p>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%`, backgroundColor: 'var(--child-accent)' }}
                  />
                </div>
                {fa.steps.map((_, j) => (
                  <div
                    key={j}
                    className="flex gap-3 items-start anim-fade-up-in"
                    style={{ transitionDelay: `${j * 60}ms` }}
                    onMouseEnter={() => markStepRead(i, j)}
                    onClick={() => markStepRead(i, j)}
                  >
                    <div className="w-6 h-6 rounded-full signature-gradient text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{t(`firstaid.${titleKey}Step${j + 1}` as never)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Router — maps slug → tool component
// ══════════════════════════════════════════════════════════════════════════════
const TOOLS: Record<string, { title: string; icon: string; subIcon: string; color: string; component: React.FC }> = {
  'growth-tracker':     { title: 'Growth Tracker',          icon: 'trending_up',       subIcon: 'query_stats',     color: 'text-emerald-500', component: GrowthTracker  },
  'bmi-calculator':     { title: 'BMI Calculator',          icon: 'monitor_weight',    subIcon: 'speed',           color: 'text-blue-500',    component: BmiCalculator  },
  'symptom-checker':    { title: 'Symptom Checker',         icon: 'thermometer',       subIcon: 'fact_check',      color: 'text-rose-500',    component: SymptomChecker },
  'milestones':         { title: 'Developmental Milestones',icon: 'psychology',        subIcon: 'verified',        color: 'text-amber-500',   component: Milestones     },
  'dosage-calculator':  { title: 'Dosage Calculator',       icon: 'vaccines',          subIcon: 'science',         color: 'text-indigo-400',  component: DosageCalc     },
  'vaccination-tracker':{ title: 'Vaccination Tracker',     icon: 'medical_services',  subIcon: 'shield',          color: 'text-teal-500',    component: VaccTracker    },
  'food-guide':         { title: 'Food Guide',              icon: 'restaurant',        subIcon: 'local_dining',    color: 'text-orange-400',  component: FoodGuide      },
  'first-aid':          { title: 'First Aid Hub',           icon: 'emergency',         subIcon: 'healing',         color: 'text-red-500',     component: FirstAidHub    },
};

// ══════════════════════════════════════════════════════════════════════════════
// Default export
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
    <div data-theme="children" data-child-tool={slug} className="space-y-6 animate-fade-in-up">
      {/* ─── Scoped keyframes ─── */}
      <style jsx>{`
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%);  }
        }
        .shimmer-overlay {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
          animation: shimmerSlide 2.5s ease-in-out infinite;
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes heroGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-18px) scale(1.1); opacity: 0.6; }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-12px) rotate(15deg); opacity: 0.5; }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translateY(0px); opacity: 0.15; }
          50% { transform: translateY(-20px); opacity: 0.4; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 var(--child-accent); }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
        .hero-gradient { background-size: 200% 200%; animation: heroGradient 8s ease infinite; }
        .particle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.15); pointer-events: none; animation-duration: 4s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .pulse-glow { animation: pulseGlow 2.5s ease-in-out infinite; }
      `}</style>

      {/* Back + title */}
      <DashboardHero
        title={t(`tools.${slug}.title` as never)}
        subtitle={
          <span className="flex items-center gap-1.5 mt-1">
            <span className="material-symbols-outlined text-[16px]">{cfg.subIcon}</span>
            {t('offlineDataNote')}
          </span>
        }
        icon={cfg.icon}
        backButton={
          <Link
            href={`/${locale}/dashboard/children`}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-colors border border-white/20 text-white shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
          </Link>
        }
      />

      {/* Tool */}
      <Component />

      {/* Premium Disclaimer */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-container via-surface-container-lowest to-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-md mt-8">
        <div className="absolute -top-4 -end-4 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface">{t('medicalDisclaimer')} </span>
            {t('disclaimerText')}
          </p>
        </div>
      </div>
    </div>
  );
}
