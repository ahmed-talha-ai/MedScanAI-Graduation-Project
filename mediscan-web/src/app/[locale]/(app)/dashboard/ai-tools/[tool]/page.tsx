/* eslint-disable */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { aiService, streamAiEndpoint, type AiStreamChunk } from '@/services/aiService';
import { saveDiagnosisResult, startChatSession, saveChatMessage, getChatHistory } from '@/services/persistenceService';
import { useTranslations, useLocale } from 'next-intl';
import { FileUploadZone } from '@/components/ui/FileUploadZone';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ModelDiagnosisResponse, LabAnalysisResponse, ChatMessage } from '@/types/api';
import { ANIM_CLASSES } from '@/lib/animations';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { Typewriter } from '@/components/ui/Typewriter';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

// ─── Tool config types ────────────────────────────────────────────────────────
type ToolConfigType = {
  titleKey: string;
  icon: string;
  type: 'image' | 'lab' | 'chat';
  uploadLabelKey: string;
  uploadDescKey: string;
};

const TOOL_CONFIG: Record<string, ToolConfigType> = {
  'brain-tumor': { titleKey: 'brainTumor', icon: 'neurology', type: 'image', uploadLabelKey: 'brainTumorUpload', uploadDescKey: 'brainTumorDesc' },
  'xray': { titleKey: 'chestXray', icon: 'radiology', type: 'image', uploadLabelKey: 'xrayUpload', uploadDescKey: 'xrayDesc' },
  'skin': { titleKey: 'skinDisease', icon: 'dermatology', type: 'image', uploadLabelKey: 'skinUpload', uploadDescKey: 'skinDesc' },
  'breast-cancer': { titleKey: 'breastCancer', icon: 'health_and_safety', type: 'image', uploadLabelKey: 'breastUpload', uploadDescKey: 'breastDesc' },
  'lab-ocr': { titleKey: 'labOcr', icon: 'clinical_notes', type: 'lab', uploadLabelKey: 'labUpload', uploadDescKey: 'labDescText' },
  'chatbot': { titleKey: 'chatbot', icon: 'smart_toy', type: 'chat', uploadLabelKey: '', uploadDescKey: '' },
};

// ─── Confidence gauge ─────────────────────────────────────────────────────────
function ConfidenceGauge({ value }: { value: string }) {
  const tTools = useTranslations('aiTools');
  const num = parseFloat(value.replace('%', ''));
  const isHigh = num >= 80;
  const isMed = num >= 50;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Small delay to ensure the initial 0% is rendered before transitioning
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-on-surface-variant">{tTools('confidence')}</span>
        <span className={isHigh ? 'text-primary' : isMed ? 'text-secondary' : 'text-tertiary'}>{num.toFixed(2)}%</span>
      </div>
      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isHigh ? 'bg-primary' : isMed ? 'bg-secondary' : 'bg-tertiary'}`}
          style={{ width: !mounted || isNaN(num) ? '0%' : `${Math.min(num, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Image diagnosis result card ──────────────────────────────────────────────
function DiagnosisResult({ result, onReset, streaming = false }: { result: ModelDiagnosisResponse; onReset: () => void; streaming?: boolean }) {
  const tTools = useTranslations('aiTools');
  const locale = useLocale();
  const isAr = locale === 'ar';
  return (
    <div className="space-y-6">
      <RevealOnScroll direction="up" delay={0}>
        <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border">
          <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">{tTools('diagnosisResult')}</p>
            <h2 className="text-2xl font-bold text-on-surface">{result.classLabelEn}</h2>
            <p className="text-on-surface-variant">{result.classLabelAr}</p>
          </div>
          <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center anim-bounce-in">
            <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
          </span>
        </div>
        <ConfidenceGauge value={result.confidenceLevel} />
      </div>
      </RevealOnScroll>

      <RevealOnScroll direction="up" delay={150}>
        <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border">
          <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">medical_information</span>
          {tTools('aiRecommendation')}
        </h3>
        <MarkdownRenderer text={result.generatedAdvice} dir={isAr ? "rtl" : "ltr"} lang={locale} streaming={streaming} />
        </div>
      </RevealOnScroll>

      <RevealOnScroll direction="up" delay={300}>
        <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-colors"
        >
          {tTools('analyseAnother')}
        </button>
      </div>

      <p className="text-xs text-on-surface-variant text-center">
        {tTools('disclaimer')}
      </p>
      </RevealOnScroll>
    </div>
  );
}

// ─── Lab result card ──────────────────────────────────────────────────────────
function LabResult({ result, previewUrl, onReset }: { result: LabAnalysisResponse; previewUrl: string; onReset: () => void }) {
  const tTools = useTranslations('aiTools');
  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
          <h2 className="text-lg font-bold text-on-surface">{tTools('labAnalysisComplete')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-on-surface-variant text-xs mb-1">{tTools('status')}</p>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">{result.status}</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs mb-1">{tTools('cached')}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${result.cached ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary/10 text-secondary'}`}>
              {result.cached ? tTools('yes') : tTools('no')}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border">
        <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">clinical_notes</span>
          {tTools('extractedAnalysis')}
        </h3>
        <MarkdownRenderer text={result.analysis} dir="auto" lang="auto" streaming={false} />
      </div>

      {previewUrl && (
        <div className="bg-surface-container-lowest rounded-lg p-4 ambient-shadow ghost-border">
          <p className="text-xs font-semibold text-on-surface-variant mb-3">{tTools('uploadedDocument')}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Uploaded lab report" className="w-full rounded-lg object-contain max-h-64 bg-surface-container-high" />
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-3 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-colors"
      >
        {tTools('analyseAnotherReport')}
      </button>
    </div>
  );
}

// ─── Chatbot panel ────────────────────────────────────────────────────────────
function ChatbotPanel() {
  const { user } = useAuthStore();
  const tTools = useTranslations('aiTools');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: tTools('chatbotWelcome'), timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.userId) {
      getChatHistory(user.userId).then(res => {
        if (res?.data) setHistory(res.data);
      }).catch(console.error);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (user?.userId && !sessionId) {
      startChatSession(user.userId).then(id => setSessionId(id)).catch(console.error);
    }
  }, [user?.userId, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setSending(true);
    
    // Add empty AI message placeholder
    setMessages((prev) => [...prev, { role: 'ai', content: '', timestamp: new Date() }]);

    // Persist user message
    if (sessionId) {
      saveChatMessage({ sessionId, senderType: 'Patient', messageText: text }).catch(console.error);
    }

    try {
      let currentResponse = '';
      const abortController = new AbortController();
      
      for await (const chunk of streamAiEndpoint('GetChatbotResponse', { message: text, userRole: user?.role ?? 'Patient' }, abortController.signal)) {
        if (chunk.type === 'text') {
          currentResponse += chunk.text || '';
          setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = currentResponse;
            return newMsgs;
          });
        }
      }

      // Persist AI message after stream ends
      if (sessionId && currentResponse) {
        saveChatMessage({ sessionId, senderType: 'AI', messageText: currentResponse }).catch(console.error);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError('Network error. Please try again.');
        // Remove the empty placeholder if it failed completely
        setMessages((prev) => {
          if (prev[prev.length - 1].role === 'ai' && !prev[prev.length - 1].content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] bg-surface-container-lowest rounded-lg ambient-shadow ghost-border overflow-hidden">
      
      {/* Sidebar: Past Sessions */}
      <div className="hidden md:flex flex-col w-64 bg-surface-container-low border-e border-surface-container-high">
        <div className="p-4 border-b border-surface-container-high">
          <button 
            onClick={() => {
              setSessionId(null);
              setMessages([{ role: 'ai', content: tTools('chatbotWelcome'), timestamp: new Date() }]);
            }}
            className="w-full py-2.5 rounded-lg signature-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_comment</span>
            New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center mt-4">No past sessions</p>
          ) : (
            history.map((s: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setSessionId(s.id);
                  setMessages(s.messages?.map((m: any) => ({
                    role: m.senderType === 'Patient' ? 'user' : 'ai',
                    content: m.messageText,
                    timestamp: new Date(m.timestamp)
                  })) || []);
                }}
                className={`w-full text-start px-3 py-2.5 rounded-md text-sm transition-colors ${sessionId === s.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-surface-container text-on-surface'}`}
              >
                <div className="truncate">{s.messages?.[0]?.messageText || 'Empty Session'}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{new Date(s.createdAt).toLocaleDateString()}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container-high bg-surface-container-low flex items-center gap-3">
        <div className="w-9 h-9 rounded-full signature-gradient flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-base">smart_toy</span>
        </div>
        <div>
          <p className="font-bold text-on-surface text-sm">MediScan Health AI</p>
          <p className="text-xs text-on-surface-variant">{tTools('medicalDisclaimer')}</p>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full signature-gradient flex items-center justify-center flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
              </div>
            )}
            <div className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                ? 'signature-gradient text-white rounded-tr-sm'
                : 'bg-surface-container-low text-on-surface rounded-tl-sm'
              }`}>
              {msg.role === 'ai' ? (
                <MarkdownRenderer text={msg.content} dir="ltr" lang="en" streaming={sending && i === messages.length - 1} animated={false} />
              ) : (
                msg.content
              )}
              <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60 text-end' : 'text-on-surface-variant'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full signature-gradient flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
            </div>
            <div className="bg-surface-container-low rounded-lg rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-xs text-error text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-surface-container-high bg-surface-container-low">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tTools('chatPlaceholder')}
            rows={1}
            className="flex-1 resize-none bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all max-h-32"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full signature-gradient text-white flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2 text-center">
          {tTools('emergencyNote')}
        </p>
      </div>
    </div>
  </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Step = 'upload' | 'processing' | 'result';

const SERVICE_MAP: Record<string, (file: File, role: string) => Promise<import('@/types/api').ReturnBase<ModelDiagnosisResponse | LabAnalysisResponse>>> = {
  'brain-tumor': (f, r) => aiService.diagnoseBrainTumor(f, r),
  'xray': (f, r) => aiService.diagnoseXRay(f, r),
  'skin': (f, r) => aiService.diagnoseDermatology(f, r),
  'breast-cancer': (f, r) => aiService.diagnoseBreastCancer(f, r),
  'lab-ocr': (f, r) => aiService.analyzeLabResults(f, r),
};

export default function AiToolPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? 'ar';
  const slug = (params?.tool as string) ?? '';
  const { user } = useAuthStore();
  const tModels = useTranslations('aiModels');
  const tTools = useTranslations('aiTools');

  const configData = TOOL_CONFIG[slug];
  const config = configData ? {
    ...configData,
    title: tModels(configData.titleKey as any) || configData.titleKey,
    uploadLabel: configData.uploadLabelKey ? tTools(configData.uploadLabelKey as any) : '',
    uploadDesc: configData.uploadDescKey ? tTools(configData.uploadDescKey as any) : '',
  } : null;

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageResult, setImageResult] = useState<ModelDiagnosisResponse | null>(null);
  const [labResult, setLabResult] = useState<LabAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  if (!config) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant">Tool not found.</p>
        <button onClick={() => router.push(`/${locale}/dashboard/ai-tools`)} className="mt-4 text-primary underline text-sm">Back to Hub</button>
      </div>
    );
  }

  if (config.type === 'chat') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/${locale}/dashboard/ai-tools`)} className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">{config.title}</h1>
            <p className="text-on-surface-variant text-sm">{tTools('chatbotSubtitle')}</p>
          </div>
        </div>
        <ChatbotPanel />
      </div>
    );
  }

  const handleFileSelected = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
    setStep('upload');
  };

  const handleAnalyse = async () => {
    if (!file || !user?.role) return;
    setStep('processing');
    setError(null);
    try {
      if (config.type === 'lab') {
        // Labs remain non-streaming for now
        const res = await aiService.analyzeLabResults(file, user.role);
        if (!res.succeeded || !res.data) throw new Error(res.message || 'Analysis failed');
        setLabResult(res.data as LabAnalysisResponse);
        setStep('result');
      } else {
        // Image models: use streaming
        const svcName = slug === 'brain-tumor' ? 'GetBrainTumorDiagnose' 
                      : slug === 'xray' ? 'GetXRayDiagnose'
                      : slug === 'skin' ? 'GetDermatologyDiagnose'
                      : slug === 'breast-cancer' ? 'GetBreastCancerDiagnose'
                      : null;
                      
        if (!svcName) throw new Error('Unknown tool');
        
        const form = new FormData();
        form.append('Image', file);
        form.append('UserRole', user.role);
        
        let text = '';
        abortRef.current = new AbortController();
        setStreaming(true);
        // Keep step='processing' — will switch to 'result' when first metadata arrives
        
        for await (const chunk of streamAiEndpoint(svcName, form, abortRef.current.signal)) {
          if (chunk.type === 'metadata') {
            setStep('result'); // NOW show result UI
            setImageResult({
              classLabelEn: chunk.label || '',
              classLabelAr: chunk.label_ar || chunk.label || '', 
              confidenceLevel: `${((chunk.confidence || 0) * 100).toFixed(2)}%`,
              generatedAdvice: ''
            });
          } else if (chunk.type === 'text') {
            text += chunk.text || '';
            setImageResult(prev => prev ? { ...prev, generatedAdvice: text } : null);
          } else if (chunk.type === 'done') {
            setStreaming(false);
            
            // Fire-and-forget save
            const SLUG_TO_MODEL_TYPE: Record<string, string> = {
              'brain-tumor': 'BrainTumor',
              'xray': 'ChestXRay',
              'breast-cancer': 'BreastCancer',
              'skin': 'SkinDisease',
              'lab-ocr': 'LabOCR',
            };
            
            saveDiagnosisResult({
              patientId: user.userId,
              modelType: SLUG_TO_MODEL_TYPE[slug] || 'Unknown',
              resultLabel: imageResult?.classLabelEn || 'Unknown',
              confidenceScore: imageResult ? parseFloat(imageResult.confidenceLevel.replace('%', '')) : 0,
              resultText: text,
            }).catch(console.error);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'Unexpected error');
        setStep('upload');
      }
    } finally {
      if (config.type !== 'lab') setStreaming(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreviewUrl('');
    setImageResult(null);
    setLabResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/${locale}/dashboard/ai-tools`)} className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">{config.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-primary">{config.title}</h1>
            <p className="text-on-surface-variant text-sm">{config.uploadLabel}</p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="ms-auto hidden md:flex items-center gap-2">
          {(['upload', 'processing', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s || (i < ['upload', 'processing', 'result'].indexOf(step)) ? 'signature-gradient text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 rounded ${i < ['upload', 'processing', 'result'].indexOf(step) ? 'bg-primary' : 'bg-surface-container-high'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upload / Processing / Result */}
        <div className="lg:col-span-2">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className={!file ? 'animate-pulse' : ''}>
                <FileUploadZone
                  onFileSelected={handleFileSelected}
                  label={config.uploadLabel}
                  description={config.uploadDesc}
                />
              </div>
              {error && <ErrorState message={error} onRetry={() => setError(null)} />}
              {file && (
                <button
                  onClick={handleAnalyse}
                  className={`w-full py-4 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 duration-500 ${ANIM_CLASSES.scaleIn}`}
                >
                  <span className="material-symbols-outlined">biotech</span>
                  {tTools('analyseBtn')}
                </button>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-surface-container-high" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  <Typewriter text={tTools('processing')} speed={40} />
                </h3>
                <p className="text-on-surface-variant text-sm max-w-xs">{tTools('processingDesc')}</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
          )}

          {step === 'result' && config.type === 'image' && imageResult && (
            <DiagnosisResult result={imageResult} onReset={reset} streaming={streaming} />
          )}
          {step === 'result' && config.type === 'lab' && labResult && (
            <LabResult result={labResult} previewUrl={previewUrl} onReset={reset} />
          )}
        </div>

        {/* Right: Guidelines sidebar */}
        <aside className="space-y-6">
          <div className="bg-surface-container-lowest rounded-lg p-6 ambient-shadow ghost-border relative overflow-hidden">
            <div className="absolute top-0 start-0 end-0 h-1 signature-gradient" />
            <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rule</span>
              {tTools('qualityTitle')}
            </h3>
            <ul className="space-y-4">
              {[
                { icon: 'center_focus_strong', title: 'Proper Positioning', desc: 'Ensure the full anatomical area is clearly visible in the frame.' },
                { icon: 'contrast', title: 'Contrast & Resolution', desc: 'High-contrast, high-resolution images yield the most accurate results.' },
                { icon: 'warning', title: 'Avoid Artefacts', desc: 'Motion blur or incorrect exposure may reduce diagnostic accuracy.' },
              ].map(({ icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-base">{icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm mb-0.5">{title}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {previewUrl && step !== 'upload' && (
            <div className="bg-surface-container-lowest rounded-lg p-4 ambient-shadow ghost-border">
              <p className="text-xs font-semibold text-on-surface-variant mb-3">Uploaded Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Uploaded scan preview" className="w-full rounded-lg object-contain max-h-48 bg-surface-container-high" />
            </div>
          )}

          <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <span className="font-semibold text-on-surface">{tTools('medicalDisclaimer')}:</span> {tTools('disclaimer')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
