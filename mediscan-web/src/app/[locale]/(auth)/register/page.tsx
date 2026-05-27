'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { TagInput } from '@/components/ui/TagInput';
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Values,
  type RegisterStep2Values,
  type RegisterStep3Values,
} from '@/lib/validations/auth';
import { authService } from '@/services/authService';
import { ANIM_CLASSES, staggerDelay } from '@/lib/animations';

type Step = 1 | 2 | 3 | 4;

interface FormData extends RegisterStep1Values, RegisterStep2Values, RegisterStep3Values {}

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const v = useTranslations('validation');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const step1Form = useForm<RegisterStep1Values>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { fullName: formData.fullName, email: formData.email },
  });

  const step2Form = useForm<RegisterStep2Values>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: {
      phoneNumber: formData.phoneNumber,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
    },
  });

  const selectedGender = useWatch({ control: step2Form.control, name: 'gender' });

  const getValidationMessage = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    try {
      return v(key.replace('validation.', '') as Parameters<typeof v>[0]);
    } catch {
      return key;
    }
  };

  const handleStep1 = step1Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  });

  const handleStep2 = step2Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  });

  const step3Form = useForm<RegisterStep3Values>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues: {
      bloodType: formData.bloodType || '',
      chronicDiseases: formData.chronicDiseases || '',
      familyHistory: formData.familyHistory || '',
      allergies: formData.allergies || '',
      currentMedications: formData.currentMedications || '',
    },
  });

  const handleStep3 = step3Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(4); // Review step is now Step 4
  });

  const handleSkipStep3 = () => {
    // Leave them as empty strings
    setFormData((prev) => ({ 
      ...prev, 
      bloodType: '', 
      chronicDiseases: '', 
      familyHistory: '',
      allergies: '',
      currentMedications: '' 
    }));
    setStep(4);
  };

  const handleSubmit = async () => {
    const combined = { ...formData } as FormData;
    setApiError(null);
    setIsSubmitting(true);
    try {
      const result = await authService.registerPatient({
        fullName: combined.fullName,
        email: combined.email,
        password: combined.password,
        phoneNumber: combined.phoneNumber,
        gender: combined.gender,
        dateOfBirth: combined.dateOfBirth,
        bloodType: combined.bloodType,
        chronicDiseases: combined.chronicDiseases ? combined.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : [],
        familyHistory: combined.familyHistory ? combined.familyHistory.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: combined.allergies ? combined.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        currentMedications: combined.currentMedications ? combined.currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      if (result.succeeded) {
        setSuccess(true);
      } else {
        setApiError(result.message || 'Registration failed');
        setStep(1);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApiError(error?.response?.data?.message || 'Network error');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-primary">mark_email_read</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3">{t('successTitle')}</h2>
        <p className="text-on-surface-variant mb-8 max-w-xs">{t('successMessage')}</p>
        <Link href={`/${locale}/login`} className="btn-primary inline-flex items-center gap-2">
          {t('login')}
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 md:p-12 lg:p-16">
      {/* Mobile logo */}
      <div className={`flex items-center gap-2 mb-8 lg:hidden ${mounted ? 'anim-rotate-in' : 'anim-rotate'}`}>
        <Logo size={36} className="rounded-lg" />
        <span className="text-xl font-bold text-primary">MediScan AI</span>
      </div>

      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(0, 60) }}>
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">{t('title')}</h2>
        <p className="text-on-surface-variant mt-1 text-sm">
          {t('stepOf', { step, total: 4 })}
          {step === 1 && ` — ${t('step1Title')}`}
          {step === 2 && ` — ${t('step2Title')}`}
          {step === 3 && ` — ${t('step4Title')}`}
          {step === 4 && ` — ${t('step3Title')}`}
        </p>

          {/* Progress bar */}
          <div className="relative mt-4 py-2">
            {/* Track — insets exactly 6px (1.5) on each side to start from the center of the first dot and end at the center of the last dot */}
            <div className="absolute top-1/2 -translate-y-1/2 start-1.5 end-1.5 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
            {/* Dots */}
            <div className="relative z-10 flex justify-between items-center">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full border-2 border-surface-container-lowest transition-all duration-500 ease-out shrink-0 ${
                    s <= step ? 'bg-primary scale-125 shadow-sm' : 'bg-surface-container-high scale-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

      {/* API error */}
      {apiError && (
        <div className="mb-6 px-4 py-3 rounded bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {apiError}
        </div>
      )}

      {/* ─── Step 1 ─────────────────────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="flex flex-col gap-5 flex-1" noValidate>
          <div className={`flex flex-col gap-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(1, 60) }}>
            <label className="text-sm font-medium text-on-surface" htmlFor="fullName">{t('fullName')}</label>
            <input id="fullName" type="text" placeholder={t('fullNamePlaceholder')}
              className={`input-clinical ${step1Form.formState.errors.fullName ? 'error' : ''}`}
              {...step1Form.register('fullName')} />
            {step1Form.formState.errors.fullName && (
              <p className="text-xs text-error">{getValidationMessage(step1Form.formState.errors.fullName.message)}</p>
            )}
          </div>

          <div className={`flex flex-col gap-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(2, 60) }}>
            <label className="text-sm font-medium text-on-surface" htmlFor="reg-email">{t('email')}</label>
            <input id="reg-email" type="email" placeholder="example@mail.com"
              className={`input-clinical ${step1Form.formState.errors.email ? 'error' : ''}`}
              {...step1Form.register('email')} />
            {step1Form.formState.errors.email && (
              <p className="text-xs text-error">{getValidationMessage(step1Form.formState.errors.email.message)}</p>
            )}
          </div>

          <div className={`flex flex-col gap-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(3, 60) }}>
            <label className="text-sm font-medium text-on-surface" htmlFor="reg-password">{t('password')}</label>
            <input id="reg-password" type="password" placeholder="••••••••"
              className={`input-clinical ${step1Form.formState.errors.password ? 'error' : ''}`}
              {...step1Form.register('password')} />
            {step1Form.formState.errors.password && (
              <p className="text-xs text-error">{getValidationMessage(step1Form.formState.errors.password.message)}</p>
            )}
            <p className="text-xs text-on-surface-variant">Min. 8 chars · 1 number · 1 symbol</p>
          </div>

          <div className={`flex flex-col gap-1.5 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} style={{ transitionDelay: staggerDelay(4, 60) }}>
            <label className="text-sm font-medium text-on-surface" htmlFor="confirmPassword">{t('confirmPassword')}</label>
            <input id="confirmPassword" type="password" placeholder="••••••••"
              className={`input-clinical ${step1Form.formState.errors.confirmPassword ? 'error' : ''}`}
              {...step1Form.register('confirmPassword')} />
            {step1Form.formState.errors.confirmPassword && (
              <p className="text-xs text-error">{getValidationMessage(step1Form.formState.errors.confirmPassword.message)}</p>
            )}
          </div>

          <div className={`flex items-center justify-between mt-4 pt-4 transition-all duration-700 ${mounted ? ANIM_CLASSES.visible : ANIM_CLASSES.hidden}`} style={{ transitionDelay: staggerDelay(5, 60) }}>
            <Link href={`/${locale}/login`} className="text-sm text-on-surface-variant hover:text-primary transition-colors">
              {t('hasAccount')} <span className="text-primary font-semibold">{t('login')}</span>
            </Link>
            <button type="submit" className={`btn-primary flex items-center gap-2 h-12 px-6 text-sm hover:anim-glow ${mounted ? 'anim-fade-down-in' : 'anim-fade-down'}`}>
              {t('next')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── Step 2 ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleStep2} className={`flex flex-col gap-5 flex-1 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="phone">{t('phone')}</label>
            <input id="phone" type="tel" placeholder={t('phonePlaceholder')}
              className={`input-clinical ${step2Form.formState.errors.phoneNumber ? 'error' : ''}`}
              {...step2Form.register('phoneNumber')} />
            {step2Form.formState.errors.phoneNumber && (
              <p className="text-xs text-error">{getValidationMessage(step2Form.formState.errors.phoneNumber.message)}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-on-surface">{t('gender')}</label>
            <div className="flex gap-3">
              {(['Male', 'Female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => step2Form.setValue('gender', g, { shouldValidate: true })}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGender === g
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  {g === 'Male' ? t('male') : t('female')}
                </button>
              ))}
            </div>
            {step2Form.formState.errors.gender && (
              <p className="text-xs text-error">{getValidationMessage(step2Form.formState.errors.gender.message)}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface" htmlFor="dob">{t('dateOfBirth')}</label>
            <input id="dob" type="date" max={new Date().toISOString().split('T')[0]}
              className={`input-clinical ${step2Form.formState.errors.dateOfBirth ? 'error' : ''}`}
              {...step2Form.register('dateOfBirth')} />
            {step2Form.formState.errors.dateOfBirth && (
              <p className="text-xs text-error">{getValidationMessage(step2Form.formState.errors.dateOfBirth.message)}</p>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4">
            <button type="button" onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t('back')}
            </button>
            <button type="submit" className={`btn-primary flex items-center gap-2 h-12 px-6 text-sm hover:anim-glow ${mounted ? 'anim-fade-down-in' : 'anim-fade-down'}`}>
              {t('next')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── Step 3: Medical Profile ────────────────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleStep3} className={`flex flex-col gap-5 flex-1 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`} noValidate>
          <div className="bg-surface-container-low p-4 rounded-xl border border-primary/20 mb-2">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <span className="material-symbols-outlined text-primary text-xl align-middle me-2">health_and_safety</span>
              {t('medicalProfileDesc')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-on-surface">{t('bloodType', { fallback: 'Blood Type' })}</label>
            <div className="grid grid-cols-4 gap-2">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => {
                const isSelected = step3Form.watch('bloodType') === type;
                // Determine color based on blood group
                let colorClass = 'border-surface-variant text-on-surface hover:border-primary/50 hover:bg-primary/5';
                if (isSelected) {
                  if (type.includes('A') && !type.includes('B')) colorClass = 'border-red-500 bg-red-500/10 text-red-700 font-bold';
                  else if (type.includes('B') && !type.includes('A')) colorClass = 'border-blue-500 bg-blue-500/10 text-blue-700 font-bold';
                  else if (type.includes('AB')) colorClass = 'border-purple-500 bg-purple-500/10 text-purple-700 font-bold';
                  else colorClass = 'border-green-500 bg-green-500/10 text-green-700 font-bold'; // O
                }

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => step3Form.setValue('bloodType', type)}
                    className={`h-11 rounded-lg border-2 flex items-center justify-center transition-all ${colorClass}`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <TagInput
              id="currentMedications"
              label={t('currentMedications', { fallback: 'Current Medications' })}
              placeholder={t('currentMedicationsPlaceholder', { fallback: 'e.g., Inhaler' })}
              value={step3Form.watch('currentMedications') || ''}
              onChange={(v) => step3Form.setValue('currentMedications', v)}
            />

            <TagInput
              id="allergies"
              label={t('allergies', { fallback: 'Allergies' })}
              placeholder={t('allergiesPlaceholder', { fallback: 'e.g., Dust' })}
              value={step3Form.watch('allergies') || ''}
              onChange={(v) => step3Form.setValue('allergies', v)}
            />

            <TagInput
              id="chronicDiseases"
              label={t('chronicDiseases')}
              placeholder={t('chronicDiseasesPlaceholder')}
              value={step3Form.watch('chronicDiseases') || ''}
              onChange={(v) => step3Form.setValue('chronicDiseases', v)}
            />

            <TagInput
              id="familyHistory"
              label={t('familyHistory', { fallback: 'Family Medical History' })}
              placeholder={t('familyHistoryPlaceholder', { fallback: 'e.g., Diabetes' })}
              value={step3Form.watch('familyHistory') || ''}
              onChange={(v) => step3Form.setValue('familyHistory', v)}
            />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4">
            <button type="button" onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t('back')}
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={handleSkipStep3} className="btn-secondary h-12 px-4 text-sm font-semibold">
                {t('skip')}
              </button>
              <button type="submit" className={`btn-primary flex items-center gap-2 h-12 px-6 text-sm hover:anim-glow ${mounted ? 'anim-fade-down-in' : 'anim-fade-down'}`}>
                {t('next')}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ─── Step 4: Review ─────────────────────────────────────────────── */}
      {step === 4 && (
        <div className={`flex flex-col flex-1 transition-all duration-500 ${mounted ? ANIM_CLASSES.leftIn : ANIM_CLASSES.left}`}>
          <div className="flex-1 space-y-4">
            {[
              { label: t('review.name'), value: formData.fullName },
              { label: t('review.email'), value: formData.email },
              { label: t('review.phone'), value: formData.phoneNumber },
              { label: t('review.gender'), value: formData.gender },
              { label: t('review.dob'), value: formData.dateOfBirth },
              { label: t('bloodType', { fallback: 'Blood Type' }), value: formData.bloodType },
              { label: t('chronicDiseases'), value: formData.chronicDiseases },
              { label: t('familyHistory', { fallback: 'Family Medical History' }), value: formData.familyHistory },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-surface-container-high last:border-0">
                <span className="text-sm text-on-surface-variant">{label}</span>
                <span className="text-sm font-medium text-on-surface">{value || '—'}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4">
            <button type="button" onClick={() => setStep(3)}
              className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t('back')}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting}
              className={`btn-primary flex items-center gap-2 h-12 px-6 text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:anim-glow ${mounted ? 'anim-fade-down-in' : 'anim-fade-down'}`}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t('loading')}
                </>
              ) : (
                <>
                  {t('submit')}
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
