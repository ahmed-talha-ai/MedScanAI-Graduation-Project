'use client';

import { useEffect, useState } from 'react';

const TICKER_ITEMS = [
  'INITIALIZING AI CORE',
  'LOADING MEDICAL MODELS',
  'SECURING CONNECTION',
  'CALIBRATING DIAGNOSTICS',
  'PREPARING WORKSPACE',
  'VERIFYING CREDENTIALS',
  'LOADING NEURAL NETWORKS',
  'SYNCING PATIENT DATA',
];

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const MIN_DISPLAY = 1600; // ms
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 600);
    }, MIN_DISPLAY);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-container-lowest overflow-hidden ${fadeOut ? 'anim-preloader-out' : ''}`}
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-8 px-8 text-center">
        {/* Logo + laser scan container */}
        <div className="relative w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center signature-gradient ambient-shadow">
          {/* Laser scan beam */}
          <div
            className="anim-laser-scan absolute inset-x-0 h-0.5 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              boxShadow: '0 0 8px 2px rgba(255,255,255,0.4)',
            }}
          />
          {/* Scan lines (static decoration) */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 h-px"
              style={{
                top: `${(i + 1) * 14.28}%`,
                background: 'rgba(255,255,255,0.07)',
              }}
            />
          ))}
          {/* Medical cross icon */}
          <span className="material-symbols-outlined text-white text-4xl anim-logo-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
            medical_services
          </span>
        </div>

        {/* Brand */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            <span className="signature-text-gradient">MediScan AI</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 tracking-widest uppercase">
            Clinical Intelligence Platform
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full signature-gradient rounded-full"
            style={{
              animation: 'preloader-progress 1.4s ease-in-out forwards',
            }}
          />
        </div>

        {/* Status text */}
        <p className="text-xs text-on-surface-variant font-mono tracking-wider animate-pulse">
          LOADING SYSTEM...
        </p>
      </div>

      {/* Bottom ticker */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-primary/5 border-t border-primary/10 overflow-hidden flex items-center">
        <div className="flex gap-8 anim-ticker whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="text-[10px] text-primary font-mono tracking-widest opacity-60">
              ◆ {item}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes preloader-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
