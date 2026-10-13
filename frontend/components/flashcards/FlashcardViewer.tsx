"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Quote,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
} from "lucide-react";
import type { Flashcard, Rating } from "@/types";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn, formatTimestamp } from "@/lib/utils";
import { ratingExplanations } from "@/lib/revision";

const RATINGS: { key: Rating; label: string; tone: string }[] = [
  {
    key: "again",
    label: "Again",
    tone: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100",
  },
  {
    key: "hard",
    label: "Hard",
    tone: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
  },
  {
    key: "good",
    label: "Good",
    tone: "bg-lavender-soft text-primary border-primary/10 hover:bg-primary/10",
  },
  {
    key: "easy",
    label: "Easy",
    tone: "bg-sage-soft text-emerald-700 border-emerald-100 hover:bg-emerald-100",
  },
];

interface FlashcardViewerProps {
  card: Flashcard | null;
  index: number;
  total: number;
  lectureTitle?: string;
  topicFilter?: string;
  mastered: boolean;
  onRate: (rating: Rating) => void;
  onToggleMastered: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  onShuffle?: () => void;
}

export default function FlashcardViewer({
  card,
  index,
  total,
  lectureTitle,
  topicFilter,
  mastered,
  onRate,
  onToggleMastered,
  onPrev,
  onNext,
  canPrev,
  canNext,
  onShuffle,
}: FlashcardViewerProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card?.id]);

  const rate = useCallback(
    (rating: Rating) => {
      if (!revealed || !card) return;
      onRate(rating);
    },
    [revealed, card, onRate]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed((r) => !r);
        return;
      }
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
      if (!revealed) return;
      const map: Record<string, Rating> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      if (map[e.key]) rate(map[e.key]);
      if (e.key.toLowerCase() === "m") onToggleMastered();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, rate, revealed, onToggleMastered]);

  if (!card) return null;

  const ts = formatTimestamp(card.sourceTimestampSeconds);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="slate">
            Card {index + 1} / {total}
          </Badge>
          {topicFilter ? <Badge tone="purple">{topicFilter}</Badge> : null}
          {mastered ? (
            <Badge tone="sage">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {onShuffle ? (
            <button
              onClick={onShuffle}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-[10px] text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:border-primary/40 hover:text-primary cursor-pointer transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" /> Shuffle
            </button>
          ) : null}
          <button
            onClick={onToggleMastered}
            className={cn(
              "h-9 px-3 inline-flex items-center gap-1.5 rounded-[10px] text-xs font-semibold border transition-colors cursor-pointer",
              mastered
                ? "bg-sage-soft text-emerald-700 border-emerald-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
            )}
            aria-pressed={mastered}
          >
            {mastered ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {mastered ? "Mastered" : "Mark mastered"}
          </button>
        </div>
      </div>

      <div className="perspective-1200">
        <div
          className={cn(
            "relative grid transition-transform duration-500 preserve-3d",
            revealed && "rotate-y-180"
          )}
        >
          {/* Front */}
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="backface-hidden [grid-area:1/1] w-full text-left bg-white border border-slate-200/80 rounded-3xl shadow-[var(--shadow-card)] p-7 sm:p-10 cursor-pointer min-h-[320px] flex flex-col"
            aria-label="Reveal the answer"
          >
            <div className="h-1 w-14 bg-gradient-to-r from-primary via-lavender to-blue rounded-full mb-6" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Question
            </p>
            <h2 className="mt-3 text-xl sm:text-2xl font-bold text-navy leading-snug flex-1">
              {card.question}
            </h2>
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Click the card or press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">Space</kbd> to reveal the answer
            </div>
          </button>

          {/* Back */}
          <div className="backface-hidden rotate-y-180 [grid-area:1/1] w-full bg-gradient-to-br from-lavender-soft via-white to-sage-soft border border-primary/15 rounded-3xl shadow-[var(--shadow-card)] p-7 sm:p-10 flex flex-col">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Answer
              </p>
              <button
                onClick={() => setRevealed(false)}
                className="text-xs font-semibold text-slate-400 hover:text-navy cursor-pointer"
              >
                Hide answer
              </button>
            </div>
            <p className="mt-3 text-lg text-slate-800 leading-relaxed flex-1">{card.answer}</p>

            {card.sourceExcerpt ? (
              <div className="mt-6 rounded-xl bg-white/80 border border-primary/10 p-4">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold mb-1.5">
                  <Quote className="w-3.5 h-3.5" />
                  From the transcript
                  {ts ? <span className="text-slate-400 font-normal">· {ts}</span> : null}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{card.sourceExcerpt}</p>
              </div>
            ) : null}

            {lectureTitle ? (
              <p className="mt-4 text-xs text-slate-400">{lectureTitle}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {revealed ? (
          <div className="animate-fade-in-up" style={{ opacity: 1 }}>
            <p className="text-xs text-slate-400 mb-2.5">
              How well did you remember? Screens 1–4, or press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">4</kbd>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="group" aria-label="Rate your recall">
              {RATINGS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => rate(r.key)}
                  className={`h-12 rounded-[var(--radius-control)] border font-semibold text-sm transition-colors cursor-pointer ${r.tone}`}
                  title={ratingExplanations[r.key]}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Demo scheduler note: Again → ~1 day, Hard → ~2, Good → ~4, Easy → ~7. Intervals
              grow as a card is reinforced. (Deterministic sample logic, not AI.)
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold text-slate-600 border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <div className="flex-1">
          <ProgressBar value={((index + 1) / total) * 100} label="Session progress" />
        </div>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold text-slate-600 border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}