'use client';

import { useState, useEffect } from 'react';
import { useInView } from '@/lib/animations';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
}

export function TypewriterText({ 
  text, 
  speed = 40, 
  delay = 0, 
  className = '', 
  cursorClassName = '' 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [ref, inView] = useInView<HTMLSpanElement>(0.1, true);

  useEffect(() => {
    if (!inView) return;

    let timeoutId: NodeJS.Timeout;
    
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      
      const typeNextChar = () => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
          timeoutId = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          // Hide cursor after 2s
          setTimeout(() => setIsDone(true), 2000);
        }
      };
      
      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, [inView, text, speed, delay]);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={`${className} inline`}>
      {displayedText}
      {!isDone && (
        <span 
          className={`inline-block w-[3px] bg-primary align-middle ${isTyping ? 'animate-pulse' : 'animate-blink'} ${cursorClassName}`}
          style={{ height: '0.75em', marginInlineStart: '4px' }}
        />
      )}
    </span>
  );
}
