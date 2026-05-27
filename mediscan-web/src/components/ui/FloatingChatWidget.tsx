'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { streamAiEndpoint } from '@/services/aiService';
import { startChatSession, saveChatMessage } from '@/services/persistenceService';
import { useTranslations } from 'next-intl';
import type { ChatMessage } from '@/types/api';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { usePathname } from 'next/navigation';

export function FloatingChatWidget() {
  const { user } = useAuthStore();
  const tTools = useTranslations('aiTools');
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: tTools('chatbotWelcome'), timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Initialize session when opened for the first time
  useEffect(() => {
    if (isOpen && user?.userId && !sessionId) {
      startChatSession(user.userId).then(id => setSessionId(id)).catch(console.error);
    }
  }, [isOpen, user?.userId, sessionId]);

  // Don't render on the dedicated AI tools chatbot page
  if (pathname?.includes('/dashboard/ai-tools/chatbot')) {
    return null;
  }

  // Only show for authenticated users
  if (!user) {
    return null;
  }

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
      
      for await (const chunk of streamAiEndpoint('GetChatbotResponse', { message: text, userRole: user.role }, abortController.signal)) {
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
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    }
  };

  return (
    <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      <div 
        className={`bg-surface-container-lowest rounded-2xl ambient-shadow ghost-border mb-4 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto h-[500px] w-[350px] sm:w-[400px]' : 'opacity-0 scale-90 translate-y-8 pointer-events-none h-0 w-[350px] sm:w-[400px]'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-surface-container-high bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full signature-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">MediScan Health AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary font-medium">Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'ai' && (
                <div className="w-6 h-6 rounded-full signature-gradient flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="material-symbols-outlined text-white text-[12px]">smart_toy</span>
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'signature-gradient text-white rounded-tr-sm'
                  : 'bg-surface-container text-on-surface rounded-tl-sm border border-surface-container-high'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-1 [&>p:last-child]:mb-0">
                    <MarkdownRenderer text={msg.content} dir="auto" lang="auto" streaming={sending && i === messages.length - 1} animated={false} />
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full signature-gradient flex items-center justify-center flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-white text-[12px]">smart_toy</span>
              </div>
              <div className="bg-surface-container rounded-xl rounded-tl-sm px-3 py-3 flex items-center gap-1.5 border border-surface-container-high">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-error text-center">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-surface-container-high bg-surface-container-lowest">
          <div className="flex items-end gap-2 bg-surface-container rounded-xl p-1 border border-outline-variant/30 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tTools('chatPlaceholder')}
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none max-h-24"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-lg signature-gradient text-white flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 flex-shrink-0 mb-1 me-1"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full signature-gradient text-white ambient-shadow flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-50 ${isOpen ? 'rotate-90 scale-90' : 'rotate-0'}`}
        aria-label="Toggle Health Assistant Chat"
      >
        <span className={`material-symbols-outlined text-2xl absolute transition-all duration-300 ${isOpen ? 'opacity-0 rotate-45 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
          smart_toy
        </span>
        <span className={`material-symbols-outlined text-2xl absolute transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-50'}`}>
          close
        </span>
      </button>

    </div>
  );
}
