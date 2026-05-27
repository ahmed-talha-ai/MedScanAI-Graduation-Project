/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { reportService, streamMedicalReport } from '@/services/reportService';
import { saveReport, getReportHistory } from '@/services/persistenceService';
import type { MedicalReportResponse } from '@/types/api';
import { staggerDelay } from '@/lib/animations';
import { Typewriter } from '@/components/ui/Typewriter';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useTranslations } from 'next-intl';

// ─── Main page ─────────────────────────────────────────────────────────────────
type PageState = 'idle' | 'loading' | 'result' | 'error';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const tReports = useTranslations('reports');

  const [state, setState]   = useState<PageState>('idle');
  const [report, setReport] = useState<MedicalReportResponse | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<1 | 2>(1);
  const [streaming, setStreaming] = useState(false);
  const [reportText, setReportText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Check for existing report on mount
  useEffect(() => {
    if (!user?.userId) return;
    const checkExisting = async () => {
      try {
        const result = await reportService.fetchReportText(user.userId, 'patient', false);
        if (result && result.status === 'success' && result.report) {
          setReport(result);
          setState('result');
        }
      } catch {
        // No saved report exists, stay in idle state
        console.log('No existing report found.');
      }
    };
    const fetchHistory = async () => {
      try {
        const res = await getReportHistory(user.userId);
        if (res?.data) {
          setHistory(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };
    checkExisting();
    fetchHistory();
  }, [user?.userId]);

  const handleGenerate = async () => {
    if (!user?.userId) return;
    setState('loading');
    setError(null);
    setLoadingStep(1);
    setReportText('');

    try {
      // Step 1 — .NET backend sync (triggers RAG data sync)
      const trigger = await reportService.triggerReportGeneration(user.userId);
      if (!trigger.succeeded) {
        throw new Error(trigger.message || 'Failed to sync data with the report service');
      }

      // Step 2 — Stream report from Python RAG
      setLoadingStep(2);
      abortRef.current = new AbortController();
      setStreaming(true);
      setState('result');

      let accumulatedText = '';
      for await (const chunk of streamMedicalReport(
        user.userId, 'patient', true, abortRef.current.signal
      )) {
        if (chunk.type === 'text') {
          const txt = chunk.text ?? '';
          accumulatedText += txt;
          setReportText(accumulatedText);
        } else if (chunk.type === 'done') {
          setStreaming(false);
          const finalReport = {
            status: 'success',
            report: accumulatedText,
            generated_at: new Date().toISOString(),
          } as any;
          setReport(finalReport);

          // Fire-and-forget save
          saveReport({
            patientId: user.userId,
            report: accumulatedText,
          }).catch(console.error);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setState('error');
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!user?.userId || downloading) return;
    setDownloading(true);
    try {
      await reportService.downloadReportPdf(user.userId, 'patient');
    } catch {
      setError('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ─── Idle state ─────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold text-primary">{tReports('title')}</h1>
          <p className="text-on-surface-variant mt-1">{tReports('subtitle')}</p>
        </section>

        {/* Generate CTA */}
        <div className="bg-surface-container-lowest rounded-xl p-10 ambient-shadow ghost-border text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full signature-gradient flex items-center justify-center mx-auto ambient-shadow">
              <span className="material-symbols-outlined text-white text-4xl">description</span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-surface mb-2">{tReports('customReportTitle')}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {tReports('customReportDesc')}
              </p>
            </div>

            <button
              onClick={() => void (async () => { await handleGenerate(); })()}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all ambient-shadow anim-glow"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {tReports('generateBtn')}
            </button>

            <p className="text-xs text-on-surface-variant">
              {tReports('disclaimer')}
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'health_and_safety', title: tReports('feature1Title'), desc: tReports('feature1Desc') },
            { icon: 'translate', title: tReports('feature2Title'), desc: tReports('feature2Desc') },
            { icon: 'picture_as_pdf', title: tReports('feature3Title'), desc: tReports('feature3Desc') },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface-container-lowest rounded-lg p-5 ambient-shadow ghost-border text-center">
              <span className="material-symbols-outlined text-3xl text-primary mb-2">{icon}</span>
              <h3 className="font-bold text-on-surface text-sm mb-1">{title}</h3>
              <p className="text-xs text-on-surface-variant">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in-up">
        {/* Spinner */}
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold text-on-surface">
            <Typewriter text={tReports('generatingReport')} speed={30} />
          </h3>
          <div className="flex items-center gap-3 justify-center">
            {([1, 2] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  loadingStep >= s ? 'signature-gradient text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {loadingStep > s ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    s
                  )}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 rounded ${loadingStep > 1 ? 'bg-primary' : 'bg-surface-container-high'}`} />}
              </div>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
            {loadingStep === 1
              ? tReports('loadingStep1')
              : tReports('loadingStep2')
            }
          </p>
        </div>

        {/* Pulse dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <section>
          <h1 className="text-3xl font-bold text-primary">{tReports('title')}</h1>
        </section>

        <div className="bg-surface-container-lowest rounded-xl p-10 ambient-shadow ghost-border text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-error text-3xl">error_outline</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface mb-2">{tReports('errorTitle')}</h2>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">{error}</p>
          </div>
          <button
            onClick={() => void (async () => { await handleGenerate(); })()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined">refresh</span>
            {tReports('retryBtn') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Result state ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <section className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{tReports('title')}</h1>
          {report?.generated_at && (
            <p className="text-on-surface-variant mt-1 text-sm">
              {tReports('generatedAt')}: {new Date(report.generated_at).toLocaleString('ar-EG')}
            </p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setState('idle'); setReport(null); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {tReports('newReportBtn')}
          </button>

          {/* PDF download — always visible alongside report text */}
          <button
            onClick={() => void (async () => { await handleDownloadPdf(); })()}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 ambient-shadow"
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            )}
            {tReports('downloadPdfBtn')}
          </button>
        </div>
      </section>

      {/* Report card with RTL Arabic content */}
      {(report || reportText) && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden">
          {/* Card header */}
          <div className="px-8 py-5 border-b border-surface-container-high flex items-center gap-3 bg-primary-container/10">
            <div className="w-10 h-10 rounded-full signature-gradient flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-lg">description</span>
            </div>
            <div>
              <p className="font-bold text-on-surface" dir="rtl">{tReports('reportHeader')}</p>
              <p className="text-xs text-on-surface-variant">{tReports('reportSubtitle')}</p>
            </div>
            <span className="ms-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
              {tReports('aiBadge')}
            </span>
          </div>

          {/* Report body */}
          <div className="p-8">
            <MarkdownRenderer text={reportText || report?.report || ''} dir="rtl" lang="ar" streaming={streaming} />
          </div>

          {/* Disclaimer */}
          <div className="px-8 py-4 border-t border-surface-container-high bg-surface-container-low">
            <p className="text-xs text-on-surface-variant text-center" dir="rtl">
              {tReports('footerDisclaimer')}
            </p>
          </div>
        </div>
      )}

      {/* PDF download card — always visible in result state */}
      <RevealOnScroll direction="right" delay={500}>
        <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">picture_as_pdf</span>
            <div>
              <p className="font-bold text-on-surface text-sm">{tReports('downloadPdfTitle')}</p>
              <p className="text-xs text-on-surface-variant">{tReports('downloadPdfDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => void (async () => { await handleDownloadPdf(); })()}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-3 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 ambient-shadow"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tReports('downloading')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">download</span>
                {tReports('downloadPdfBtn')}
              </>
            )}
          </button>
        </div>
      </RevealOnScroll>
      {/* Report History Collapsible Section */}
      {history.length > 0 && (
        <RevealOnScroll direction="up" delay={600}>
          <div className="bg-surface-container-lowest rounded-lg ambient-shadow ghost-border overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-6 py-4 flex items-center justify-between bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                <span className="font-bold text-on-surface">{tReports('pastReports')} ({history.length})</span>
              </div>
              <span className={`material-symbols-outlined transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {showHistory && (
              <div className="p-6 border-t border-surface-container-high space-y-4">
                {history.map((h: any, i: number) => (
                  <div key={i} className="bg-surface-container rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{tReports('reportFrom')} {new Date(h.createdAt).toLocaleDateString('en-GB')}</p>
                      <p className="text-xs text-on-surface-variant">{tReports('savedAt')} {new Date(h.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        setReportText(h.report);
                        setReport({ ...report, report: h.report, generated_at: h.createdAt } as any);
                        setState('result');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 bg-primary/10 text-primary font-medium text-xs rounded-full hover:bg-primary/20 transition-colors"
                    >
                      {tReports('viewBtn')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RevealOnScroll>
      )}
    </div>
  );
}
