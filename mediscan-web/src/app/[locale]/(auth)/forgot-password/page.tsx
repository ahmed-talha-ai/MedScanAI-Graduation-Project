'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/auth';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const v = useTranslations('validation');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';

  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const getValidationMessage = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    try {
      return v(key.replace('validation.', '') as Parameters<typeof v>[0]);
    } catch {
      return key;
    }
  };

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setApiError(null);
    try {
      const result = await authService.resetPasswordEmail({ email: data.email });
      if (result.succeeded) {
        setSuccess(true);
      } else {
        setApiError(result.message || 'Failed to send email');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApiError(error?.response?.data?.message || 'Network error');
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-primary">mail</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3">{t('successTitle')}</h2>
        <p className="text-on-surface-variant mb-2 max-w-xs">{t('successMessage')}</p>
        <p className="text-sm font-semibold text-primary mb-8">{getValues('email')}</p>
        <Link href={`/${locale}/login`} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 md:p-12 lg:p-16 animate-fade-in-up">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-10 lg:hidden">
        <Logo size={36} className="rounded-lg" />
        <span className="text-xl font-bold text-primary">MediScan AI</span>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">{t('title')}</h2>
        <p className="text-on-surface-variant mt-2">{t('subtitle')}</p>
      </div>

      {apiError && (
        <div className="mb-6 px-4 py-3 rounded bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 flex-1" noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface" htmlFor="fp-email">{t('email')}</label>
          <input
            id="fp-email"
            type="email"
            placeholder="example@mail.com"
            autoComplete="email"
            className={`input-clinical ${errors.email ? 'error' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-error">{getValidationMessage(errors.email.message)}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {t('loading')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">send</span>
              {t('submit')}
            </>
          )}
        </button>

        <div className="text-center mt-auto pt-4">
          <Link href={`/${locale}/login`} className="text-sm text-on-surface-variant hover:text-primary flex items-center justify-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
