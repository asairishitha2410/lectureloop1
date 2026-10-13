import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-400 leading-relaxed">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full h-11 px-3.5 rounded-[var(--radius-control)] border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow";

export const selectClass =
  "w-full h-11 px-3 pr-8 rounded-[var(--radius-control)] border border-slate-200 bg-white text-sm text-slate-800 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m3%206%205%205%205-5%22%2F%3E%3C%2Fsvg%3E')]";

export const textareaClass =
  "w-full rounded-[var(--radius-control)] border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-3 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow resize-y";