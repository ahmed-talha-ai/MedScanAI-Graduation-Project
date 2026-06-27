'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { reportService } from '@/services/reportService';
import type { MedicalReportResponse } from '@/types/api';
import { useTranslations, useLocale } from 'next-intl';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
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

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — now a centered modal */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('patientLabel', { name: patientName ?? '' })}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-5xl h-[90vh] bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
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
              <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 md:p-8 ambient-shadow mb-6">
                <div className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-secondary" dir="ltr" lang="en">
                  <MarkdownRenderer text={report.report} dir="ltr" lang="en" />
                </div>
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
              <div>
                <p className="font-semibold text-on-surface">{t('noReportTitle')}</p>
                <p className="text-sm font-medium mt-1">
                  {patientName}
                </p>
              </div>
              <p className="text-sm text-on-surface-variant max-w-xs">
                {t('noReportDesc')}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
