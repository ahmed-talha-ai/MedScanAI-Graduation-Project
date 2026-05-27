# Examination Wizard Architecture

The Examination Wizard (`src/components/exam/ExamWizard.tsx`) is a multi-step, state-driven component designed to guide users through self-examinations (Brain Tumor, Breast, Skin, etc.).

## Core Features
1. **Multi-step navigation:** Next/Previous buttons with animated transitions.
2. **Progress tracking:** Top progress bar and step indicators.
3. **Timed steps:** Integration with `<ExamTimer>` for steps requiring specific durations (e.g., Romberg Balance Test).
4. **Clinical capture:** Post-exam "Analysis" screen allowing users to upload a photo for AI diagnosis.
5. **Report generation:** End-of-flow RAG integration to summarize the findings.

## Data Structure
Each exam follows this structure:
```typescript
export interface ExamStep {
  id: string;
  title: string;       // Translates to: t('brainTumor.step1Title')
  instruction: string; // Translates to: t('brainTumor.step1Instruction')
  hint?: string;       // Optional clinical hint
  duration?: number;   // Optional timer duration in seconds
}

export interface ExamConfig {
  id: string;          // e.g. 'brain-tumor'
  type: DiagnosisType;
  title: string;
  subtitle: string;
  steps: ExamStep[];
}
```

## Component Flow
1. **Welcome Screen:** Title, subtitle, and "Begin Examination" button.
2. **Step View:** Displays instruction, optional hint, and an `<ExamTimer>` if `duration` is set. The "Next" button is disabled until the timer completes.
3. **Analysis Step (Optional):** Prompts the user to capture or upload an image. If skipped, proceeds to summary.
4. **Summary & RAG:** Sends data to backend, generates report via Python RAG, displays warnings and clinical summary.
