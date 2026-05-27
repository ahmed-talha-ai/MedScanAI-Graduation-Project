import { ANIM_CLASSES } from '@/lib/animations';

interface ExamProgressDotsProps {
  total: number;
  current: number;
}

export function ExamProgressDots({ total, current }: ExamProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < current;
        const isActive = index === current;

        return (
          <div key={index} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                ${
                  isActive
                    ? `bg-primary text-on-primary ${ANIM_CLASSES.scaleIn}`
                    : isCompleted
                    ? 'bg-primary text-on-primary'
                    : 'border-2 border-surface-container-high text-on-surface-variant'
                }
              `}
            >
              {isCompleted ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            {index < total - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 transition-all duration-500 ${
                  index < current ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
