// Deterministic, prototype-only review scheduler.
//
// This is intentionally simple and reproducible — it is NOT an AI prediction.
// Every rating maps to a fixed base interval in days, which grows modestly with
// the number of times the card has been reviewed before. A future backend phase
// would replace this with a proper spaced-repetition algorithm (e.g. SM-2).

import type { FlashcardReview, Rating } from "@/types";

const BASE_INTERVAL_DAYS: Record<Rating, number> = {
  again: 1,
  hard: 2,
  good: 4,
  easy: 7,
};

/** Base interval for a rating in days. */
export function baseInterval(rating: Rating): number {
  return BASE_INTERVAL_DAYS[rating];
}

/**
 * Compute the next review interval for a rating given the card's review history.
 * “Again” always restarts the schedule. Other ratings grow up to 3x the base
 * interval as a card is reinforced over time.
 */
export function nextIntervalDays(rating: Rating, history: FlashcardReview[]): number {
  const base = BASE_INTERVAL_DAYS[rating];
  if (rating === "again") return 1;
  const reinforced = history.filter((h) => h.rating !== "again").length;
  const multiplier = Math.min(1 + reinforced * 0.5, 3);
  return Math.round(base * multiplier);
}

export function isMastered(history: FlashcardReview[]): boolean {
  // A card counts as mastered after two consecutive non-“again” reviews.
  const recent = [...history].reverse().slice(0, 2);
  return recent.length >= 2 && recent.every((h) => h.rating !== "again" && h.rating !== "hard");
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function buildReview(
  cardId: string,
  rating: Rating,
  history: FlashcardReview[]
): FlashcardReview {
  const interval = nextIntervalDays(rating, history);
  const nextReviewAt = addDays(new Date(), interval);
  return {
    cardId,
    rating,
    reviewedAt: new Date().toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    mastered: isMastered(history),
  };
}

/**
 * Human label for the base intervals, shown in the flashcards page so the demo
 * behavior is transparent.
 */
export const ratingExplanations: Record<Rating, string> = {
  again: "Revisit in ~1 day — starts a fresh cycle.",
  hard: "Revisit in ~2 days.",
  good: "Revisit in ~4 days.",
  easy: "Revisit in ~7 days.",
};