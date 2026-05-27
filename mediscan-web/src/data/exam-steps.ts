import type { ExamStep } from '@/types/exam';

export const BRAIN_TUMOR_STEPS: ExamStep[] = [
  {
    id: 'romberg',
    kind: 'timer',
    titleKey: 'exam.brainTumor.step1Title',
    instructionKey: 'exam.brainTumor.step1Instruction',
    timerSeconds: 30,
    observationHintKey: 'exam.brainTumor.step1Hint',
    videoSrc: '/videos/exam/brain/01.mp4',
  },
  {
    id: 'finger-nose',
    kind: 'observation',
    titleKey: 'exam.brainTumor.step2Title',
    instructionKey: 'exam.brainTumor.step2Instruction',
    observationHintKey: 'exam.brainTumor.step2Hint',
    videoSrc: '/videos/exam/brain/02.mp4',
  },
  {
    id: 'eye-movement',
    kind: 'observation',
    titleKey: 'exam.brainTumor.step3Title',
    instructionKey: 'exam.brainTumor.step3Instruction',
    observationHintKey: 'exam.brainTumor.step3Hint',
    videoSrc: '/videos/exam/brain/03.mp4',
  },
  {
    id: 'pronator-drift',
    kind: 'timer',
    titleKey: 'exam.brainTumor.step4Title',
    instructionKey: 'exam.brainTumor.step4Instruction',
    timerSeconds: 20,
    observationHintKey: 'exam.brainTumor.step4Hint',
    videoSrc: '/videos/exam/brain/04.mp4',
  },
  {
    id: 'cognitive',
    kind: 'cognitive',
    titleKey: 'exam.brainTumor.step5Title',
    instructionKey: 'exam.brainTumor.step5Instruction',
    observationHintKey: 'exam.brainTumor.step5Hint',
    videoSrc: '/videos/exam/brain/05.mp4',
  },
];

export const BREAST_SELF_STEPS: ExamStep[] = [
  {
    id: 'breast-visual-sides',
    kind: 'observation',
    titleKey: 'exam.breastSelf.step1Title',
    instructionKey: 'exam.breastSelf.step1Instruction',
    videoSrc: '/videos/exam/breast/01.gif',
  },
  {
    id: 'breast-visual-hips',
    kind: 'observation',
    titleKey: 'exam.breastSelf.step2Title',
    instructionKey: 'exam.breastSelf.step2Instruction',
    videoSrc: '/videos/exam/breast/02.gif',
  },
  {
    id: 'breast-mirror-check',
    kind: 'observation',
    titleKey: 'exam.breastSelf.step3Title',
    instructionKey: 'exam.breastSelf.step3Instruction',
    videoSrc: '/videos/exam/breast/03.gif',
  },
  {
    id: 'breast-palpation',
    kind: 'observation',
    titleKey: 'exam.breastSelf.step4Title',
    instructionKey: 'exam.breastSelf.step4Instruction',
    videoSrc: '/videos/exam/breast/04.gif',
  },
  {
    id: 'breast-nipple-check',
    kind: 'observation',
    titleKey: 'exam.breastSelf.step5Title',
    instructionKey: 'exam.breastSelf.step5Instruction',
    videoSrc: '/videos/exam/breast/05.gif',
  },
  {
    id: 'breast-lying-down',
    kind: 'observation',
    titleKey: 'exam.breastSelf.step6Title',
    instructionKey: 'exam.breastSelf.step6Instruction',
    videoSrc: '/videos/exam/breast/06.gif',
  },
];

export const SKIN_SELF_STEPS: ExamStep[] = [
  {
    id: 'skin-asymmetry',
    kind: 'observation',
    titleKey: 'exam.skinSelf.step1Title',
    instructionKey: 'exam.skinSelf.step1Instruction',
  },
  {
    id: 'skin-border',
    kind: 'observation',
    titleKey: 'exam.skinSelf.step2Title',
    instructionKey: 'exam.skinSelf.step2Instruction',
  },
  {
    id: 'skin-color',
    kind: 'observation',
    titleKey: 'exam.skinSelf.step3Title',
    instructionKey: 'exam.skinSelf.step3Instruction',
  },
  {
    id: 'skin-diameter',
    kind: 'observation',
    titleKey: 'exam.skinSelf.step4Title',
    instructionKey: 'exam.skinSelf.step4Instruction',
  },
  {
    id: 'skin-evolving',
    kind: 'observation',
    titleKey: 'exam.skinSelf.step5Title',
    instructionKey: 'exam.skinSelf.step5Instruction',
  },
];
