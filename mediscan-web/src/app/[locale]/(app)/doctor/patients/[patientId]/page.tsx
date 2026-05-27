'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { doctorService } from '@/services/doctorService';
import { reportService } from '@/services/reportService';
import type { DoctorPatientEntry, PatientWarning } from '@/types/api';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { ReportDrawer } from '@/components/doctor/ReportDrawer';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { streamMedicalReport } from '@/services/reportService';
import type { MedicalReportResponse } from '@/types/api';

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-secondary/10 text-secondary',
  'bg-tertiary/10 text-tertiary',
  'bg-secondary-container text-on-secondary-container',
];

export default function DoctorPatientDetail() {
  const t = useTranslations('doctor');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const patientId = params?.patientId as string;
  const { user } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [patient, setPatient] = useState<DoctorPatientEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  
  // Warnings
  const [warnings, setWarnings] = useState<PatientWarning[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [warningsOffline, setWarningsOffline] = useState(false);

  // Inline Report State
  const [reportText, setReportText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [report, setReport] = useState<MedicalReportResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const loadPatient = async () => {
    if (!user?.userId || !patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await doctorService.getDashboard(user.userId);
      if (res.succeeded && res.data) {
        const found = res.data.patients.find(p => p.patientId === patientId);
        if (found) setPatient(found);
        else setError('patientNotFound');
      } else {
        setError('patientNotFound');
      }
    } catch {
      setError('patientNotFound');
    } finally {
      setLoading(false);
    }
  };

  const loadWarnings = async () => {
    if (!patientId) return;
    setWarningsLoading(true);
    setWarningsOffline(false);
    try {
      const res = await reportService.fetchWarnings(patientId);
      if (res.status === 'success' && res.warnings) {
        setWarnings(res.warnings);
      }
    } catch {
      setWarningsOffline(true);
    } finally {
      setWarningsLoading(false);
    }
  };

  const loadReport = async () => {
    if (!patientId) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const result = await reportService.fetchReportText(patientId, 'doctor', false);
      if (result && result.status === 'success' && result.report) {
        setReport(result);
        setReportText(result.report);
      }
    } catch {
      setReportError('No previous report found.');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await loadPatient();
      await loadWarnings();
      await loadReport();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, patientId]);

  const handleComplete = async () => {
    if (!patient?.appointmentId) return;
    setCompleting(true);
    try {
      const res = await doctorService.completeAppointment({ appointmentId: patient.appointmentId });
      if (res.succeeded) {
        router.push(`/${locale}/doctor/appointments`);
      }
    } catch {
      // Error ignored for now
    } finally {
      setCompleting(false);
    }
  };

  const handleSendMessage = () => {
    alert(t('comingSoon'));
  };

  const handleGenerateReport = async () => {
    if (!patientId) return;
    setReportLoading(true);
    setReportError(null);
    setReportText('');
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const trigger = await reportService.triggerReportGeneration(patientId);
      if (!trigger.succeeded) {
        throw new Error(trigger.message || 'Failed to sync data');
      }

      let accumulatedText = '';
      for await (const chunk of streamMedicalReport(patientId, 'doctor', true, abortRef.current.signal)) {
        if (chunk.type === 'text') {
          accumulatedText += chunk.text ?? '';
          setReportText(accumulatedText);
        } else if (chunk.type === 'done') {
          setStreaming(false);
          setReport({
            status: 'success',
            patient_id: patientId,
            report: accumulatedText,
            generated_at: new Date().toISOString(),
            profile_based: true,
          });
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setReportError(err instanceof Error ? err.message : 'Error generating report');
      }
    } finally {
      setStreaming(false);
      setReportLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!patientId || downloading) return;
    setDownloading(true);
    try {
      await reportService.downloadReportPdf(patientId, 'doctor');
    } catch {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (error === 'patientNotFound') {
    return (
      <div className="flex justify-center items-center h-64">
        <ErrorState 
          title={t('patientNotFound')} 
          message={t('patientNotFoundSubtitle')} 
          onRetry={() => router.back()} 
          retryText={t('goBack')} 
        />
      </div>
    );
  }

  if (loading || !patient) {
    return (
      <div className="space-y-6">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  // Use appointmentId to get a stable color
  const avatarColor = AVATAR_COLORS[patient.appointmentId % AVATAR_COLORS.length];
  
  // Group warnings
  const warningsByType = warnings.reduce((acc, w) => {
    if (!acc[w.type]) acc[w.type] = [];
    acc[w.type].push(w);
    return acc;
  }, {} as Record<string, PatientWarning[]>);

  return (
    <>
      <div className="space-y-6">
        {/* Section A — Patient Profile Card */}
        <div className={`flex items-center gap-4 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${avatarColor}`}>
            {getInitials(patient.patientName)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-on-surface">{patient.patientName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                {t('patientId')}: {patient.patientId}
              </span>
              <span className="text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span>
                {t('lastVisit')}: {formatDate(patient.appointmentDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Section B — Visit Snapshot Card */}
        <div 
          className={`bg-surface-container-low rounded-xl p-6 ambient-shadow transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
          style={{ transitionDelay: staggerDelay(0, 80, 150) }}
        >
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            {t('visitSnapshot')}
          </h2>
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">{t('scheduledDate')}</p>
              <p className="font-semibold text-on-surface">{formatDate(patient.appointmentDate)}</p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant mb-1">{t('reason')}</p>
              <p className="font-semibold text-on-surface">{patient.reason || '—'}</p>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Scheduled
            </span>
          </div>
        </div>

        {/* Section C — Action Buttons Row */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' })}
            className={`bg-primary/10 text-primary px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/20 transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(1, 80, 150) }}
          >
            {t('viewReport')}
          </button>
          
          <Link
            href={`/${locale}/doctor/examination?patientId=${patient.patientId}&patientName=${encodeURIComponent(patient.patientName)}`}
            className={`flex items-center gap-1 bg-tertiary/10 text-tertiary px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-tertiary/20 transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(2, 80, 150) }}
          >
            {t('runExamination')}
          </Link>
          
          <button
            onClick={handleComplete}
            disabled={completing}
            className={`flex items-center gap-1 bg-surface-container-high text-on-surface px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-surface-container-highest transition-all duration-500 disabled:opacity-50 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(3, 80, 150) }}
          >
            {completing ? '...' : t('markComplete')}
          </button>
          
          <button
            onClick={handleSendMessage}
            className={`bg-secondary/10 text-secondary px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-secondary/20 transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(4, 80, 150) }}
          >
            {t('sendMessage')}
          </button>
        </div>

        {/* Section D — Clinical Medical Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className={`bg-surface-container-low rounded-xl p-5 ambient-shadow transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}
            style={{ transitionDelay: '300ms' }}
          >
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">coronavirus</span>
              {t('chronicDiseases')}
            </h3>
            {patient.chronicDiseases.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.chronicDiseases.map(d => (
                  <span key={d} className="bg-secondary/10 text-secondary text-sm px-3 py-1 rounded-full font-medium">{d}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">block</span> {t('noRecords')}
              </p>
            )}
          </div>

          <div 
            className={`bg-surface-container-low rounded-xl p-5 ambient-shadow transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: '300ms' }}
          >
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">masks</span>
              {t('allergies')}
            </h3>
            {patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map(a => (
                  <span key={a} className="bg-error-container text-error text-sm px-3 py-1 rounded-full font-medium">{a}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">block</span> {t('noRecords')}
              </p>
            )}
          </div>

          <div 
            className={`bg-surface-container-low rounded-xl p-5 ambient-shadow transition-all duration-500 ${mounted ? ANIM_CLASSES.rightIn : ANIM_CLASSES.right}`}
            style={{ transitionDelay: '300ms' }}
          >
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">medication</span>
              {t('currentMedications')}
            </h3>
            {patient.currentMedicine.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.currentMedicine.map(m => (
                  <span key={m} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">{m}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">block</span> {t('noRecords')}
              </p>
            )}
          </div>
        </div>

        {/* Section E — Drug Interaction Warning Card */}
        <div 
          className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
          style={{ transitionDelay: '400ms' }}
        >
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
              {t('drugWarnings')}
            </h2>
            {warnings.length > 0 && (
              <span className="bg-error text-on-error px-3 py-1 rounded-full text-xs font-bold anim-ring-pulse">
                {t('reviewRequired')}
              </span>
            )}
          </div>

          {warningsOffline ? (
            <div className="bg-surface-container rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-error">cloud_off</span>
                {t('warningServiceOffline')}
              </p>
              <button 
                onClick={loadWarnings}
                className="px-4 py-1.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Retry
              </button>
            </div>
          ) : warningsLoading ? (
            <div className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : warnings.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(warningsByType).map(([type, typeWarnings], i) => (
                <div key={type} className={`space-y-3 transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`} style={{ transitionDelay: staggerDelay(i, 30, 400) }}>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 capitalize border-b border-amber-200 dark:border-amber-800/50 pb-2">
                    {type.replace('_', ' ')}
                  </h4>
                  <ul className="space-y-3 pl-1">
                    {typeWarnings.map((w, j) => {
                      let colorCls = 'text-on-surface-variant';
                      let dotCls = 'border-on-surface-variant';
                      
                      if (w.severity === 'high') {
                        colorCls = 'text-error font-medium';
                        dotCls = 'bg-error border-error';
                      } else if (w.severity === 'medium') {
                        colorCls = 'text-amber-800 dark:text-amber-200';
                        dotCls = 'border-amber-700 dark:border-amber-300';
                      }

                      return (
                        <li key={j} className={`text-sm flex items-start gap-3 ${colorCls}`}>
                          <span className={`w-2.5 h-2.5 rounded-full border-[3px] mt-1.5 flex-shrink-0 ${dotCls}`} />
                          <span className="leading-relaxed">{w.message}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              {t('noWarnings')}
            </p>
          )}
        </div>

        {/* Section F — AI Clinical Report */}
        <div id="report-section" className={`bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden transition-all duration-500 ${mounted ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`} style={{ transitionDelay: '500ms' }}>
          <div className="px-6 py-5 border-b border-surface-container-high flex items-center justify-between gap-4 bg-primary-container/10 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full signature-gradient flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-lg">description</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">AI Clinical Report</p>
                {report?.generated_at && (
                  <p className="text-xs text-on-surface-variant">Last updated: {formatDate(report.generated_at)}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGenerateReport}
                disabled={streaming || reportLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/10 transition-all disabled:opacity-50"
              >
                {streaming || (reportLoading && !reportText) ? (
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">refresh</span>
                )}
                {reportText ? 'Update Report' : 'Generate Report'}
              </button>

              {reportText && !streaming && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-full signature-gradient text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 ambient-shadow"
                >
                  {downloading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  )}
                  Download PDF
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8" dir="ltr">
            {reportLoading && !reportText ? (
              <div className="space-y-4">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : reportText ? (
              <div className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-secondary">
                <MarkdownRenderer text={reportText} dir="ltr" lang="en" streaming={streaming} />
              </div>
            ) : (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-3">description</span>
                <p className="text-on-surface-variant">
                  {reportError ? reportError : 'No report generated yet. Click "Generate Report" to run the AI analysis.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <ReportDrawer 
        patientId={isReportOpen ? patient.patientId : null}
        patientName={patient.patientName}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
}
