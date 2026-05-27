'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { getRoleRedirectPath } from '@/lib/auth';
import { useEffect } from 'react';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const v = useTranslations('validation');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'ar';
  const redirectPath = searchParams?.get('redirect') || null;

  const login = useAuthStore((s) => s.login);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const getValidationMessage = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    try {
      return v(key.replace('validation.', '') as Parameters<typeof v>[0]);
    } catch {
      return key;
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const result = await authService.login(data);
      if (result.succeeded && result.data) {
        login(result.data);
        // Get role from freshly decoded token
        const { decodeToken } = await import('@/lib/auth');
        const decoded = decodeToken(result.data);
        if (decoded) {
          const dest = redirectPath || getRoleRedirectPath(decoded.role);
          router.push(`/${locale}${dest}`);
        }
      } else {
        setApiError(result.message || 'Login failed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApiError(error?.response?.data?.message || 'Network error');
    }
  };

  return (
    <div className="flex flex-col h-full p-8 md:p-12 lg:p-16">
      {/* Mobile logo */}
      <div className={`flex items-center gap-2 mb-10 lg:hidden ${mounted ? 'anim-rotate-in' : 'anim-rotate'}`}>
        <Logo size={36} className="rounded-lg" />
        <span className="text-xl font-bold text-primary">MediScan AI</span>
      </div>

      {/* Header */}
      <div className={`mb-10 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(0, 60) }}>
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">{t('title')}</h2>
        <p className="text-on-surface-variant mt-2">{t('subtitle')}</p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-6 px-4 py-3 rounded bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {apiError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 flex-1" noValidate>
        {/* Email */}
        <div className={`flex flex-col gap-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(1, 60) }}>
          <label className="text-sm font-medium text-on-surface" htmlFor="email">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            className={`input-clinical ${errors.email ? 'error' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-error">{getValidationMessage(errors.email.message)}</p>
          )}
        </div>

        {/* Password */}
        <div className={`flex flex-col gap-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(2, 60) }}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-on-surface" htmlFor="password">
              {t('password')}
            </label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-primary hover:underline transition-colors"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              autoComplete="current-password"
              className={`input-clinical pr-12 ${errors.password ? 'error' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-error">{getValidationMessage(errors.password.message)}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn-primary mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:anim-glow ${mounted ? 'anim-fade-down-in' : 'anim-fade-down'}`}
          style={{ transitionDelay: staggerDelay(3, 60) }}
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
              {t('submit')}
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-on-surface-variant mt-auto pt-4">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`} className="text-primary font-semibold hover:underline">
            {t('register')}
          </Link>
        </p>
      </form>
    </div>
  );
}
