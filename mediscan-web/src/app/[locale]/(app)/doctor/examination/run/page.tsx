'use client';

import { useRouter } from 'next/navigation';
import { ExamWizard } from '@/components/exam/ExamWizard';
import { BRAIN_TUMOR_STEPS } from '@/data/exam-steps';

export default function ExaminationRunPage() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <ExamWizard
        steps={BRAIN_TUMOR_STEPS}
        titleKey="exam.brainTumor.title"
        variant="clinical"
        onComplete={() => {
          router.push('/doctor/examination/summary');
        }}
      />
    </div>
  );
}
