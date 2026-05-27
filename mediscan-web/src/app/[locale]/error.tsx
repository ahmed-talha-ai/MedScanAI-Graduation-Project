'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring (console in dev)
    console.error('[MediScan Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 p-6 animate-fade-in-up">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-4xl">error_outline</span>
      </div>

      {/* Message */}
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-on-surface">Something went wrong</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          An unexpected error occurred. Your data is safe — please try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-on-surface-variant/60 font-mono mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="h-11 px-6 rounded-full text-sm font-bold text-white signature-gradient hover:opacity-90 transition-all flex items-center justify-center gap-2 ambient-shadow"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Try Again
        </button>
        <Link
          href="/"
          className="h-11 px-6 rounded-full text-sm font-semibold text-on-surface bg-surface-container-low border border-surface-container-high hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Return Home
        </Link>
      </div>
    </div>
  );
}
