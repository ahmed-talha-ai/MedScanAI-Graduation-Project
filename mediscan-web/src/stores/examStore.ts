import { create } from 'zustand';
import type { ExamResults, ExamStepResult } from '@/types/exam';

interface ExamState {
  patientId: string | null;
  patientName: string | null;
  results: ExamResults;
  notes: Record<string, string>;
  completedAt: string | null;

  setPatient: (id: string, name: string) => void;
  setResult: (stepId: string, result: ExamStepResult) => void;
  setNote: (stepId: string, note: string) => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  patientId: null,
  patientName: null,
  results: {},
  notes: {},
  completedAt: null,

  setPatient: (id, name) => set({ patientId: id, patientName: name }),
  setResult: (stepId, result) =>
    set((state) => ({
      results: { ...state.results, [stepId]: result },
    })),
  setNote: (stepId, note) =>
    set((state) => ({
      notes: { ...state.notes, [stepId]: note },
    })),
  reset: () =>
    set({
      patientId: null,
      patientName: null,
      results: {},
      notes: {},
      completedAt: null,
    }),
}));
