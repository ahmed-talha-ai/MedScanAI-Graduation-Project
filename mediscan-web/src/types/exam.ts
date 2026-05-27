export type ExamStepKind = 'instruction' | 'timer' | 'observation' | 'cognitive';

export interface ExamStep {
  id: string;
  kind: ExamStepKind;
  titleKey: string;
  instructionKey: string;
  diagram?: string;
  videoSrc?: string;
  timerSeconds?: number;
  observationHintKey?: string;
}

export type ExamStepResult = 'normal' | 'abnormal' | 'done' | 'skipped' | 'concern';

export type ExamResults = Record<string, ExamStepResult>;
