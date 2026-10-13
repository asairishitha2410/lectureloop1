import type { Difficulty } from "@/types";

// Shared palette, mirroring the CSS tokens in app/globals.css.
export const colors = {
  primary: "#7C3AED",
  primaryDark: "#6D28D9",
  lavender: "#A855F7",
  blue: "#2563EB",
  blueDark: "#1D4ED8",
  navy: "#0F172A",
  page: "#FAF8F5",
  lavenderSoft: "#F6F2FF",
  sageSoft: "#F3FAF5",
  success: "#22C55E",
  mint: "#86EFAC",
  cyan: "#06B6D4",
  indigo: "#6366F1",
  rose: "#FB7185",
  amber: "#D97706",
};

// Ordered series palette for charts (purple, blue, indigo, emerald, cyan).
export const chartSeries = [
  colors.primary,
  colors.blue,
  colors.indigo,
  colors.success,
  colors.cyan,
];

export const difficultyStyle: Record<
  Difficulty,
  { bg: string; text: string; label: string }
> = {
  easy: { bg: "bg-sage-soft", text: "text-emerald-700", label: "Easy" },
  medium: { bg: "bg-lavender-soft", text: "text-primary", label: "Medium" },
  hard: { bg: "bg-rose-50", text: "text-rose-600", label: "Hard" },
};

const SUBJECT_PALETTE: { badge: string; bar: string; chart: string }[] = [
  { badge: "bg-lavender-soft text-primary", bar: "bg-primary", chart: colors.primary },
  { badge: "bg-blue-50 text-blue", bar: "bg-blue", chart: colors.blue },
  { badge: "bg-cyan-50 text-cyan-700", bar: "bg-cyan", chart: colors.cyan },
  { badge: "bg-emerald-50 text-emerald-700", bar: "bg-success", chart: colors.success },
  { badge: "bg-amber-50 text-amber-700", bar: "bg-amber", chart: colors.amber },
  { badge: "bg-rose-50 text-rose-600", bar: "bg-rose", chart: colors.rose },
];

/** Stable colour for a subject/channel label (hash-based, always defined). */
export function subjectStyleFor(subject: string): {
  badge: string;
  bar: string;
  chart: string;
} {
  let hash = 0;
  for (let i = 0; i < subject.length; i += 1) {
    hash = (hash * 31 + subject.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length];
}

export const badgeTones = {
  purple: "bg-lavender-soft text-primary",
  blue: "bg-blue-50 text-blue",
  sage: "bg-sage-soft text-emerald-700",
  slate: "bg-slate-100 text-slate-600",
  rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-700",
  amber: "bg-amber-50 text-amber-700",
} as const;

export type BadgeTone = keyof typeof badgeTones;