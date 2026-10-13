import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={`animate-spin text-primary ${className ?? "w-6 h-6"}`} aria-hidden />;
}

export default function LoadingState({
  title = "Loading…",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-20 ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue flex items-center justify-center shadow-lg shadow-primary/25">
        <Spinner className="w-6 h-6 text-white" />
      </div>
      <p className="mt-4 text-sm font-semibold text-navy">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p> : null}
    </div>
  );
}