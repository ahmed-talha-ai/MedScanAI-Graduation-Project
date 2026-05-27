'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';

type Status = 'loading' | 'success' | 'error';

export default function ConfirmEmailPage() {
  const t = useTranslations('auth.confirmEmail');
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'ar';

  const userId = searchParams?.get('UserId') ?? '';
  const token = searchParams?.get('Token') ?? '';

  const hasParams = userId && token;

  const [status, setStatus] = useState<Status>(hasParams ? 'loading' : 'error');
  const [errorMessage, setErrorMessage] = useState<string>(hasParams ? '' : t('errorMessage'));
  const didRun = useRef(false);

  useEffect(() => {
    if (!hasParams || didRun.current) return;
    didRun.current = true;

    authService
      .confirmEmail(userId, token)
      .then((result) => {
        if (result.succeeded) {
          setStatus('success');
        } else {
          setErrorMessage(result.message || t('errorMessage'));
          setStatus('error');
        }
      })
      .catch(() => {
        setErrorMessage(t('errorMessage'));
        setStatus('error');
      });
  }, [hasParams, userId, token, t]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-fade-in-up">
      {/* Loading */}
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">{t('title')}</h2>
          <p className="text-on-surface-variant">{t('verifying')}</p>
        </>
      )}

      {/* Success */}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">verified</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3">{t('successTitle')}</h2>
          <p className="text-on-surface-variant mb-8 max-w-xs">{t('successMessage')}</p>
          <Link href={`/${locale}/login`} className="btn-primary inline-flex items-center gap-2">
            Sign In
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </Link>
        </>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3">{t('errorTitle')}</h2>
          <p className="text-on-surface-variant mb-8 max-w-xs">{errorMessage}</p>
          <Link href={`/${locale}/login`} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Sign In
          </Link>
        </>
      )}
    </div>
  );
}
