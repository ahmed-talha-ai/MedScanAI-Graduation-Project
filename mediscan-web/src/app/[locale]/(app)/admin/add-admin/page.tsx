'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { useTranslations } from 'next-intl';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { useEffect } from 'react';

const inputCls = 'w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all border border-transparent focus:border-primary/30';

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-on-surface">{label}</label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

interface FormData { userName: string; email: string; password: string; }
type Errors = Partial<Record<keyof FormData | 'form', string>>;

function validate(form: FormData): Errors {
  const e: Errors = {};
  if (!form.userName.trim() || form.userName.trim().length < 3) e.userName = 'Username must be at least 3 characters';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
  if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
  if (!/[^a-zA-Z0-9]/.test(form.password)) e.password = 'Password must contain at least 1 symbol';
  if (!/[0-9]/.test(form.password)) e.password = 'Password must contain at least 1 number';
  return e;
}

export default function AddAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('addAdmin');

  const [form, setForm]       = useState<FormData>({ userName: '', email: '', password: '' });
  const [errors, setErrors]   = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const set = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await adminService.registerAdmin({
        userName: form.userName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      if (res.succeeded) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/admin`), 2000);
      } else {
        setErrors({ form: res.message || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full signature-gradient flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface">{t('successTitle')}</h2>
        <p className="text-on-surface-variant">{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className={`max-w-lg mx-auto space-y-6 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}>
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/${locale}/admin`)}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm mb-4"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t('backToDashboard')}
        </button>
        <DashboardHero 
          title={t('title')} 
          subtitle={t('subtitle')} 
          icon="manage_accounts" 
        />
      </div>

      {errors.form && (
        <div className="bg-error-container text-error rounded-xl p-4 text-sm font-medium">{errors.form}</div>
      )}

      <form
        onSubmit={(e) => void (async () => { await handleSubmit(e); })()}
        className={`bg-surface-container-lowest rounded-xl p-8 ambient-shadow ghost-border space-y-5 transition-all duration-500 ${mounted ? ANIM_CLASSES.scaleIn : ANIM_CLASSES.scale}`}
      >
        <div className={`transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(0, 60) }}>
          <Field label={t('username')} error={errors.userName}>
            <input
              type="text"
              value={form.userName}
              onChange={e => set('userName', e.target.value)}
              placeholder="admin_username"
              className={inputCls}
              autoComplete="username"
            />
          </Field>
        </div>

        <div className={`transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(1, 60) }}>
          <Field label={t('email')} error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="admin@mediscan.ai"
              className={inputCls}
              autoComplete="email"
            />
          </Field>
        </div>

        <div className={`transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(2, 60) }}>
          <Field label={t('password')} error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Min 8 chars, 1 number, 1 symbol"
              className={inputCls}
              autoComplete="new-password"
            />
            <p className="text-xs text-on-surface-variant mt-1">
              {t('passwordHint')}
            </p>
          </Field>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 rounded-full signature-gradient text-white font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`}
          style={{ transitionDelay: staggerDelay(3, 60) }}
        >
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('creating')}</>
            : <><span className="material-symbols-outlined">manage_accounts</span> {t('createBtn')}</>
          }
        </button>
      </form>
    </div>
  );
}
