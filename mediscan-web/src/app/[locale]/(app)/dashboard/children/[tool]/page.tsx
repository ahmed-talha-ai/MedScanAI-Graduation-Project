'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { staggerDelay } from '@/lib/animations';

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

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border">
        <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">add_circle</span>{t('growth.addEntry')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {([['date', t('growth.date'), 'date'], ['height', t('growth.heightCm'), 'number'], ['weight', t('growth.weightKg'), 'number']] as const).map(([k, l, typ]) => (
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input type={typ} value={form[k]} onChange={set(k)} className={inputCls} />
            </div>
          ))}
        </div>
        <button onClick={add} className={`${btnPrimary} active:scale-95`}>{t('growth.addRecord')}</button>
      </div>

      {sorted.length >= 2 && (
        <div key={chartKey} className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border anim-scale-in">
          <h2 className="font-bold text-on-surface mb-1">{t('growth.growthChart')}</h2>
          <div className="flex gap-4 text-xs mb-3">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-secondary inline-block" />{t('growth.height')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block" />{t('growth.weight')}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <line key={f} x1={PAD} y1={PAD + f * (H - PAD * 2)} x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
                stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
            ))}
            {/* Height line */}
            <polyline
              points={heightPts}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1000"
              strokeDasharray="1000"
              style={{ animation: 'draw-line 1.4s ease-out forwards', strokeDashoffset: 1000 }}
            />
            {/* Weight line */}
            <polyline
              points={weightPts}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1000"
              strokeDasharray="1000"
              style={{ animation: 'draw-line 1.4s 0.3s ease-out forwards', strokeDashoffset: 1000 }}
            />
            {/* Dots */}
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
      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-4">
        <div>
          <label className={labelCls}>{t('bmi.weightKg')}</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className={inputCls} placeholder="e.g. 20" />
        </div>
        <div>
          <label className={labelCls}>{t('bmi.heightCm')}</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} className={inputCls} placeholder="e.g. 110" />
        </div>
        <button onClick={calc} className={`${btnPrimary} active:scale-95`}>{t('bmi.calculateBmi')}</button>
      </div>
      {result && (
        <div className={`bg-surface-container-lowest rounded-xl p-8 ambient-shadow ghost-border text-center space-y-2 transition-all duration-500 ${showResult ? 'anim-bounce-in' : 'opacity-0 scale-75'}`}>
          <BmiGauge bmi={result.bmi} color={result.color} />
          <AnimatedNumber value={result.bmi} decimals={1} className={`text-6xl font-extrabold ${result.color}`} duration={1400} />
          <p className="text-sm text-on-surface-variant">{t('bmi.kgm2')}</p>
          <p className={`text-lg font-bold ${result.color}`}>{result.cat}</p>
        </div>
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

  const triageCfg = {
    urgent: { label: t('symptoms.triageUrgent'), icon: 'emergency',  cls: 'bg-error-container',  color: 'text-error'     },
    watch:  { label: t('symptoms.triageWatch'),  icon: 'warning',    cls: 'bg-secondary/10',     color: 'text-secondary' },
    home:   { label: t('symptoms.triageHome'),   icon: 'home',       cls: 'bg-primary/10',       color: 'text-primary'   },
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border">
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
        <div
          key={triage}
          className={`rounded-xl p-6 text-center transition-colors duration-500 anim-bounce-in ${triageCfg[triage].cls}`}
        >
          <span className={`material-symbols-outlined text-4xl ${triageCfg[triage].color} transition-colors duration-500`}>{triageCfg[triage].icon}</span>
          <h3 className={`font-bold text-lg mt-2 ${triageCfg[triage].color} transition-colors duration-500`}>{triageCfg[triage].label}</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {triage === 'urgent' ? t('symptoms.descUrgent') :
             triage === 'watch'  ? t('symptoms.descWatch') :
                                   t('symptoms.descHome')}
          </p>
        </div>
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

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm mb-2 px-1">
        <span className="text-on-surface-variant">{t('milestones.achievedCount', { count: done.length, total: MS_LIST.length })}</span>
        <span className="text-primary font-bold">{pct}%</span>
      </div>
      {/* Animated progress bar */}
      <div className="w-full h-2 bg-surface-container-high rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ghost-border space-y-4">
        <div>
          <label className={labelCls}>{t('dosage.weightKg')}</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className={inputCls} placeholder="e.g. 15" />
        </div>
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
        <button onClick={calc} className={`${btnPrimary} active:scale-95`}>{t('dosage.calculateDose')}</button>
      </div>

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

  return (
    <div className="space-y-3">
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
          { title: t('food.safe'),       items: f.safe,  cls: 'bg-primary/10 text-primary',      border: 'border-primary/20',   delay: '0ms'   },
          { title: t('food.avoid'),      items: f.avoid, cls: 'bg-error-container text-error',   border: 'border-error/20',     delay: '80ms'  },
          { title: t('food.introduce'),  items: f.intro, cls: 'bg-secondary/10 text-secondary',  border: 'border-secondary/20', delay: '160ms' },
        ]).map(({ title, items, cls, border, delay }) => (
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
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls} anim-bounce-in`}
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

  return (
    <div className="space-y-3">
      {FIRST_AID.map((fa, i) => {
        const titleKey = FA_TITLE_MAP[fa.title];
        return (
          <div
            key={i}
            className={`bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden transition-all duration-300 anim-fade-up-in`}
            style={{ transitionDelay: staggerDelay(i, 60, 400) }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-4 p-5 text-start hover:bg-surface-container-low transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${open === i ? 'bg-error text-white' : 'bg-error-container'}`}>
                <span className={`material-symbols-outlined transition-colors duration-300 ${open === i ? 'text-white' : 'text-error'}`}>{fa.icon}</span>
              </div>
              <span className="font-bold text-on-surface flex-1">{t(`firstaid.${titleKey}` as never)}</span>
              <span
                className="material-symbols-outlined text-on-surface-variant"
                style={{
                  transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >expand_more</span>
            </button>
            {/* CSS max-height transition — no layout jump */}
            <div
              style={{
                maxHeight: open === i ? '400px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <div className="px-5 pb-5 space-y-3 border-t border-surface-container-high pt-4">
                {fa.steps.map((_, j) => (
                  <div
                    key={j}
                    className="flex gap-3 items-start anim-fade-up-in"
                    style={{ transitionDelay: `${j * 60}ms` }}
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
const TOOLS: Record<string, { title: string; icon: string; component: React.FC }> = {
  'growth-tracker':     { title: 'Growth Tracker',          icon: 'trending_up',       component: GrowthTracker  },
  'bmi-calculator':     { title: 'BMI Calculator',          icon: 'monitor_weight',    component: BmiCalculator  },
  'symptom-checker':    { title: 'Symptom Checker',         icon: 'thermometer',       component: SymptomChecker },
  'milestones':         { title: 'Developmental Milestones',icon: 'psychology',        component: Milestones     },
  'dosage-calculator':  { title: 'Dosage Calculator',       icon: 'vaccines',          component: DosageCalc     },
  'vaccination-tracker':{ title: 'Vaccination Tracker',     icon: 'medical_services',  component: VaccTracker    },
  'food-guide':         { title: 'Food Guide',              icon: 'restaurant',        component: FoodGuide      },
  'first-aid':          { title: 'First Aid Hub',           icon: 'emergency',         component: FirstAidHub    },
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/children`}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{cfg.icon}</span>
            {t(`tools.${slug}.title` as never)}
          </h1>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-xs">wifi_off</span>
            {t('offlineDataNote')}
          </p>
        </div>
      </div>

      {/* Tool */}
      <Component />

      {/* Disclaimer */}
      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 mt-8">
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">{t('medicalDisclaimer')} </span>
          {t('disclaimerText')}
        </p>
      </div>
    </div>
  );
}

