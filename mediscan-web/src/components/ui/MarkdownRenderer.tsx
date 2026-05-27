/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { staggerDelay } from '@/lib/animations';

interface MarkdownRendererProps {
  text: string;
  dir?: 'rtl' | 'ltr' | 'auto';
  lang?: string;
  animated?: boolean;
  streaming?: boolean;
}

export function MarkdownRenderer({
  text,
  dir = 'rtl',
  lang = 'ar',
  animated = true,
  streaming = false,
}: MarkdownRendererProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!animated) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [animated]);

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
                    <th key={idx} className="p-4 font-bold text-on-surface text-start border-e last:border-e-0 border-surface-container-high">
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
                        <td key={cIdx} className="p-4 text-on-surface-variant align-top border-e last:border-e-0 border-surface-container-high">
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
      elements.push(<hr key={i} className="my-6 border-t border-surface-container-high" />);
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-s-4 border-primary/50 bg-primary/5 p-4 rounded-e my-3 text-on-surface-variant italic">
          {parseBold(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-primary mt-6 mb-2 first:mt-0">
          {parseBold(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-on-surface mt-4 mb-1">
          {parseBold(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <li key={i} className="list-none flex gap-2 text-on-surface-variant">
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span>{parseBold(line.slice(2))}</span>
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      const number = line.match(/^\d+/)?.[0];
      elements.push(
        <li key={i} className="list-none flex gap-2 text-on-surface-variant">
          <span className="text-primary mt-0.5 flex-shrink-0 font-bold">{number}.</span>
          <span>{parseBold(content)}</span>
        </li>
      );
    } else if (line === '') {
      elements.push(<div key={i} className="h-2" />);
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
    <div className="space-y-2 text-on-surface leading-relaxed text-base font-body" dir={dir} lang={lang}>
      {elements.map((el, idx) => {
        const isLast = idx === elements.length - 1;
        return (
          <div 
            key={idx} 
            className={animated ? `transition-all duration-500 ease-out ${mounted ? 'anim-fade-up-in' : 'anim-fade-up'}` : ''}
            style={animated ? { transitionDelay: staggerDelay(idx, 80) } : undefined}
          >
            {el}
            {streaming && isLast && (
              <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ms-0.5 align-text-bottom" />
            )}
          </div>
        );
      })}
      {streaming && elements.length === 0 && (
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ms-0.5 align-text-bottom" />
      )}
    </div>
  );
}
