'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth';
import { authService } from '@/services/authService';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const v = useTranslations('validation');
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'ar';

  const email = searchParams?.get('email') ?? '';
  const token = searchParams?.get('token') ?? '';

  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const getValidationMessage = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    try {
      return v(key.replace('validation.', '') as Parameters<typeof v>[0]);
    } catch {
      return key;
    }
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setApiError(null);
    try {
      const result = await authService.resetPassword({
        email,
        newPassword: data.newPassword,
        resetPasswordToken: token,
      });
      if (result.succeeded) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/login`), 2500);
      } else {
        setApiError(result.message || 'Failed to reset password');
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
          <span className="material-symbols-outlined text-4xl text-primary">lock_reset</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3">{t('successTitle')}</h2>
        <p className="text-on-surface-variant mb-8 max-w-xs">{t('successMessage')}</p>
        <div className="text-sm text-on-surface-variant">{t('redirecting')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 md:p-12 lg:p-16 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-10 lg:hidden">
        <Logo size={36} className="rounded-lg" />
        <span className="text-xl font-bold text-primary">MediScan AI</span>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">{t('title')}</h2>
        <p className="text-on-surface-variant mt-2">{t('subtitle')}</p>
        {email && <p className="text-sm text-primary font-medium mt-1">{email}</p>}
      </div>

      {apiError && (
        <div className="mb-6 px-4 py-3 rounded bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {apiError}
        </div>
      )}

      {!email || !token ? (
        <div className="flex flex-col items-center gap-4 text-center py-8">
          <span className="material-symbols-outlined text-5xl text-error">link_off</span>
          <p className="text-on-surface-variant">{t('invalidLink')}</p>
          <Link href={`/${locale}/forgot-password`} className="btn-primary h-12 px-6 text-sm inline-flex items-center gap-2">
            {t('requestNewLink')}
            <span className="material-symbols-outlined text-lg">refresh</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 flex-1" noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="new-password">{t('newPassword')}</label>
            <div className="relative">
              <input id="new-password" type={showNew ? 'text' : 'password'} placeholder="••••••••"
                className={`input-clinical pr-12 ${errors.newPassword ? 'error' : ''}`}
                {...register('newPassword')} />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary" tabIndex={-1}>
                <span className="material-symbols-outlined text-xl">{showNew ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-error">{getValidationMessage(errors.newPassword.message)}</p>
            )}
            <p className="text-xs text-on-surface-variant">{t('passwordHint')}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="confirm-password">{t('confirmPassword')}</label>
            <div className="relative">
              <input id="confirm-password" type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                className={`input-clinical pr-12 ${errors.confirmPassword ? 'error' : ''}`}
                {...register('confirmPassword')} />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary" tabIndex={-1}>
                <span className="material-symbols-outlined text-xl">{showConfirm ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-error">{getValidationMessage(errors.confirmPassword.message)}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
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
                <span className="material-symbols-outlined text-xl">lock_reset</span>
                {t('submit')}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
