import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "purple" | "blue" | "sage" | "cyan" | "indigo";
}

const tones = {
  purple: "from-lavender-soft to-purple-100/50 border-primary/10 text-primary",
  blue: "from-blue-50 to-blue-100/50 border-blue-100 text-blue",
  sage: "from-sage-soft to-emerald-100/50 border-emerald-100 text-emerald-700",
  cyan: "from-cyan-50 to-cyan-100/50 border-cyan-100 text-cyan-700",
  indigo: "from-indigo-50 to-indigo-100/50 border-indigo-100 text-indigo",
} as const;

export default function StatCard({ label, value, hint, icon: Icon, tone = "purple" }: StatCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${tones[tone]} rounded-2xl border p-5 shadow-[var(--shadow-soft)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-extrabold tracking-tight text-navy">{value}</p>
          <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${tones[tone].split(" ").pop()}`} />
        </div>
      </div>
      {hint ? <p className="text-xs mt-2 text-slate-500">{hint}</p> : null}
    </div>
  );
}