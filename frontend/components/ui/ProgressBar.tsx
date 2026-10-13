import { cn, clampPercent } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  tone?: "default" | "success" | "danger";
  size?: "sm" | "md";
  showLabel?: boolean;
  label?: string;
}

const barTones = {
  default: "bg-gradient-to-r from-primary to-blue",
  success: "bg-gradient-to-r from-success to-emerald-300",
  danger: "bg-gradient-to-r from-rose-400 to-rose-500",
};

export default function ProgressBar({
  value,
  className,
  tone = "default",
  size = "sm",
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = clampPercent(value);
  return (
    <div className={className}>
      {showLabel ? (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-600">{label ?? "Progress"}</span>
          <span className="text-xs font-bold text-navy">{pct}%</span>
        </div>
      ) : null}
      <div
        className={cn(
          "w-full bg-slate-200/70 rounded-full overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", barTones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}