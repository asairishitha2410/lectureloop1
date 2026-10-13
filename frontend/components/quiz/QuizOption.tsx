import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizOptionProps {
  index: number;
  text: string;
  state?: "idle" | "selected" | "correct" | "incorrect" | "muted";
  onSelect?: () => void;
  disabled?: boolean;
}

const letters = ["A", "B", "C", "D", "E", "F"];

function stateClasses(state: QuizOptionProps["state"]): string {
  switch (state) {
    case "selected":
      return "border-primary/60 bg-lavender-soft ring-2 ring-primary/20 text-navy";
    case "correct":
      return "border-emerald-300 bg-sage-soft text-emerald-900 ring-1 ring-emerald-300";
    case "incorrect":
      return "border-rose-300 bg-rose-50 text-rose-900 ring-1 ring-rose-300";
    case "muted":
      return "border-slate-200 bg-white text-slate-500 opacity-60";
    default:
      return "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-lavender-soft/40";
  }
}

export default function QuizOption({ index, text, state = "idle", onSelect, disabled }: QuizOptionProps) {
  const letter = letters[index] ?? String(index + 1);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cn(
        "w-full flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all",
        stateClasses(state),
        !disabled && state === "idle" && "cursor-pointer",
        disabled && "cursor-default"
      )}
    >
      <span
        className={cn(
          "mt-0.5 w-6 h-6 shrink-0 rounded-lg text-xs font-bold flex items-center justify-center border",
          state === "correct" && "border-emerald-300 bg-emerald-100 text-emerald-700",
          state === "incorrect" && "border-rose-300 bg-rose-100 text-rose-700",
          state === "selected" && "border-primary/30 bg-primary/10 text-primary",
          (state === "idle" || state === "muted") && "border-slate-200 bg-slate-50 text-slate-500"
        )}
      >
        {state === "correct" ? <Check className="w-3.5 h-3.5" /> : state === "incorrect" ? <X className="w-3.5 h-3.5" /> : state === "selected" ? <Check className="w-3.5 h-3.5" /> : letter}
      </span>
      <span className="leading-relaxed">{text}</span>
    </button>
  );
}