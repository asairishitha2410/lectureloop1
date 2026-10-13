import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 rounded-[var(--radius-card)] border border-dashed border-slate-300/70 bg-white/50 ${className ?? ""}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-lavender-soft flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      {description ? (
        <p className="text-sm text-slate-500 mt-1.5 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap gap-3 justify-center">{action}</div> : null}
    </div>
  );
}