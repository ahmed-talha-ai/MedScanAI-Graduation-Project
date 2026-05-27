'use client';

import { useState, useEffect, useRef } from 'react';

interface ExamTimerProps {
  duration: number;
  onComplete: () => void;
}

export function ExamTimer({ duration, onComplete }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setIsPaused(true);
      } else if (!document.hidden && isActive && isPaused) {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, isPaused]);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, timeLeft, onComplete]);

  const toggleTimer = () => {
    if (!isActive && timeLeft === 0) {
      setTimeLeft(duration);
    }
    setIsActive(!isActive);
    setIsPaused(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(duration);
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (timeLeft / duration) * circumference;
  const isWarning = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="flex flex-row items-center gap-3 bg-surface-container-lowest ambient-shadow rounded-full pl-1.5 pr-3 py-1.5 w-fit">
      <div className="relative w-10 h-10 flex-shrink-0">
        {!reducedMotion && (
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="18"
              className="stroke-surface-container-high fill-none"
              strokeWidth="4"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              className={`fill-none transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.6,1)] ${
                isWarning ? 'stroke-error' : 'stroke-primary'
              }`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ strokeDashoffset }}
            />
          </svg>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            aria-live="polite"
            className={`text-sm font-bold ${isWarning ? 'text-error' : 'text-on-surface'}`}
          >
            {timeLeft}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={toggleTimer}
          className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all ${
            isActive
              ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              : 'bg-primary text-on-primary hover:scale-105'
          }`}
        >
          {isActive ? 'Pause' : timeLeft === 0 ? 'Restart' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          disabled={timeLeft === duration}
          className="px-3 py-1.5 text-xs rounded-full border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container-lowest disabled:opacity-50 disabled:hover:bg-transparent transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
