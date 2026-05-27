'use client';

import { useState, useEffect, useRef } from 'react';
import { reportService } from '@/services/reportService';
import type { MedicalReportResponse } from '@/types/api';
import { useTranslations, useLocale } from 'next-intl';

// ─── Simple markdown-lite renderer (English, LTR) ─────────────────────────────
function ReportText({ text }: { text: string }) {
  const cleanText = text.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();
  const lines = cleanText.split('\n');

  const elements = [];
  let i = 0;

  const parseBold = (str: string) => {
    const parts = str.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="text-on-surface font-semibold">{p}</strong> : p
    );
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }
      
      if (tableRows.length >= 2) {
        const headers = tableRows[0].split('|').slice(1, -1).map(s => s.trim());
        const bodyRows = tableRows.slice(2);
        
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-6 border border-surface-container-high rounded-lg ambient-shadow">
            <table className="w-full text-sm text-start">
              <thead className="bg-surface-container-low border-b border-surface-container-high">
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-3 font-bold text-on-surface text-start border-e last:border-e-0 border-surface-container-high">
                      {parseBold(h.replace(/<br\s*\/?>/gi, ' '))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high bg-surface-container-lowest">
                {bodyRows.map((row, rIdx) => {
                  const cells = row.split('|').slice(1, -1).map(s => s.trim());
                  return (
                    <tr key={rIdx} className="hover:bg-surface-container/30 transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 text-on-surface-variant align-top border-e last:border-e-0 border-surface-container-high">
                          {cell.split(/<br\s*\/?>/i).map((part, pIdx) => (
                            <span key={pIdx} className="block mb-1 last:mb-0">
                              {parseBold(part)}
                            </span>
                          ))}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (line.startsWith('---') || line.startsWith('***')) {
      elements.push(<hr key={i} className="my-5 border-t border-surface-container-high" />);
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-s-4 border-primary/50 bg-primary/5 p-3 rounded-e my-2 text-on-surface-variant italic">
          {parseBold(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-primary mt-5 mb-1 first:mt-0">
          {parseBold(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-on-surface mt-3 mb-0.5">
          {parseBold(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <li key={i} className="list-none flex gap-2 text-on-surface-variant anim-fade-up-in" style={{ animationFillMode: 'both', animationDelay: `${(i % 15) * 40}ms` }}>
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span>{parseBold(line.slice(2))}</span>
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      const number = line.match(/^\d+/)?.[0];
      elements.push(
        <li key={i} className="list-none flex gap-2 text-on-surface-variant anim-fade-up-in" style={{ animationFillMode: 'both', animationDelay: `${(i % 15) * 40}ms` }}>
          <span className="text-primary mt-0.5 flex-shrink-0 font-bold">{number}.</span>
          <span>{parseBold(content)}</span>
        </li>
      );
    } else if (line === '') {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-on-surface-variant">
          {parseBold(line)}
        </p>
      );
    }
    i++;
  }

  return (
    <div className="space-y-1.5 text-on-surface leading-relaxed text-sm" dir="ltr" lang="en">
      {elements}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function DrawerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-4 bg-surface-container-high rounded-full w-3/4" />
      <div className="h-4 bg-surface-container-high rounded-full w-full" />
      <div className="h-4 bg-surface-container-high rounded-full w-5/6" />
      <div className="h-8 bg-surface-container-high rounded-full w-1/2 mt-6" />
      <div className="h-4 bg-surface-container-high rounded-full w-full" />
      <div className="h-4 bg-surface-container-high rounded-full w-4/5" />
      <div className="h-4 bg-surface-container-high rounded-full w-full" />
      <div className="h-8 bg-surface-container-high rounded-full w-1/2 mt-4" />
      <div className="h-4 bg-surface-container-high rounded-full w-2/3" />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ReportDrawerProps {
  /** patientId for the RAG call. null = drawer closed */
  patientId: string | null;
  patientName?: string;
  onClose: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ReportDrawer({ patientId, patientName, onClose }: ReportDrawerProps) {
  const t = useTranslations('reportDrawer');
  const locale = useLocale();
  const isOpen = patientId !== null;

  const [report, setReport]       = useState<MedicalReportResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Track which patientId we last fetched to avoid duplicate calls
  const lastFetchedId = useRef<string | null>(null);

  // Single effect: handles both open (fetch) and close (reset)
  // No synchronous setState — all state updates happen inside the async callback
  useEffect(() => {
    if (!patientId) {
      // Drawer closing — schedule reset via a microtask to avoid sync setState
      const id = setTimeout(() => {
        lastFetchedId.current = null;
        setReport(null);
        setError(null);
        setLoading(false);
      }, 0);
      return () => clearTimeout(id);
    }

    if (lastFetchedId.current === patientId) return; // already fetched

    let cancelled = false;
    lastFetchedId.current = patientId;

    const run = async () => {
      try {
        setLoading(true);
        setReport(null);
        setError(null);
        const data = await reportService.fetchReportText(patientId, 'doctor');
        if (cancelled) return;
        if (data.status !== 'success') throw new Error('Report service returned an error');
        setReport(data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch report. Is the AI service running?');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [patientId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    if (!patientId || downloading) return;
    setDownloading(true);
    try {
      await reportService.downloadReportPdf(patientId, 'doctor');
    } catch {
      setError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRetry = () => {
    lastFetchedId.current = null; // allow re-fetch
    setError(null);
    // Re-trigger the effect by resetting and running again
    if (patientId) {
      setLoading(true);
      setError(null);
      reportService.fetchReportText(patientId, 'doctor')
        .then((data) => {
          if (data.status !== 'success') throw new Error('Report service returned an error');
          setReport(data);
          lastFetchedId.current = patientId;
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch report');
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from the dynamic side */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('patientLabel', { name: patientName ?? '' })}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className={`fixed top-0 end-0 z-50 h-full w-full max-w-lg bg-surface-container-lowest shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="px-6 py-5 border-b border-surface-container-high flex items-center gap-3 flex-shrink-0 bg-surface-container-low">
          <div className="w-10 h-10 rounded-full signature-gradient flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg">description</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface text-sm">{t('title')}</p>
            {patientName && (
              <p className="text-xs text-on-surface-variant truncate">{t('patientLabel', { name: patientName })}</p>
            )}
          </div>
          {/* Download PDF button — shown when report is ready */}
          {report && !loading && (
            <button
              onClick={() => void (async () => { await handleDownload(); })()}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full signature-gradient text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {downloading
                ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              }
              {t('downloadPdf')}
            </button>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors flex-shrink-0"
            aria-label={t('close')}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading skeleton */}
          {loading && <DrawerSkeleton />}

          {/* Error state */}
          {!loading && error && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px] space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-2xl">error_outline</span>
              </div>
              <div>
                <p className="font-bold text-on-surface mb-1">{t('couldNotLoad')}</p>
                <p className="text-sm text-on-surface-variant max-w-xs">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                {t('retry')}
              </button>
            </div>
          )}

          {/* Report content */}
          {!loading && !error && report && (
            <div className="p-6 space-y-6">
              {/* Timestamp */}
              {report.generated_at && (
                <p className="text-xs text-on-surface-variant">
                  {t('generatedAt', { date: new Date(report.generated_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB') })}
                </p>
              )}

              {/* Report text */}
              <div className="bg-surface-container-low rounded-xl p-5">
                <ReportText text={report.report} />
              </div>

              {/* Standalone PDF download card at bottom of scrollable area */}
              <div className="bg-surface-container rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{t('downloadCardTitle')}</p>
                    <p className="text-xs text-on-surface-variant">{t('downloadCardDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => void (async () => { await handleDownload(); })()}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full signature-gradient text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {downloading
                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-sm">download</span>
                  }
                  {downloading ? t('downloading') : t('download')}
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-on-surface-variant text-center pb-2">
                {t('disclaimer')}
              </p>
            </div>
          )}

          {/* Empty state (no report available) */}
          {!loading && !error && !report && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px] space-y-3 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">description</span>
              <p className="font-semibold text-on-surface">{t('noReportTitle')}</p>
              <p className="text-sm text-on-surface-variant max-w-xs">
                {t('noReportDesc')}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
