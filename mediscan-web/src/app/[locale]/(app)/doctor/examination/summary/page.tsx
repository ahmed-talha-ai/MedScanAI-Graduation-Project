'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/stores/examStore';
import { ExamSummary } from '@/components/exam/ExamSummary';
import { BRAIN_TUMOR_STEPS } from '@/data/exam-steps';
import { ANIM_CLASSES } from '@/lib/animations';

export default function ExaminationSummaryPage() {
  const router = useRouter();
  const { results, patientId, reset } = useExamStore();

  useEffect(() => {
    if (Object.keys(results).length === 0) {
      router.replace('/doctor/examination');
    }
  }, [results, router]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  if (Object.keys(results).length === 0) {
    return null;
  }

  const handleSaveAndClose = () => {
    const timestamp = new Date().toISOString();
    const storageKey = `exam_${patientId}_${timestamp}`;
    localStorage.setItem(storageKey, JSON.stringify(results));
    
    router.push('/doctor/appointments');
  };

  const handleGenerateReport = () => {
    handleSaveAndClose();
  };

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 py-8 ${ANIM_CLASSES.visible}`}>
      <ExamSummary
        steps={BRAIN_TUMOR_STEPS}
        onGenerateReport={handleGenerateReport}
        onSaveAndClose={handleSaveAndClose}
      />
    </div>
  );
}
