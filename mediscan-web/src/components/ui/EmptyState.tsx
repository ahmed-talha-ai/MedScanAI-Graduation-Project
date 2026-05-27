interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = 'inbox', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-2">{title}</h3>
      {subtitle && (
        <p className="text-sm text-on-surface-variant max-w-xs mb-6">{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
