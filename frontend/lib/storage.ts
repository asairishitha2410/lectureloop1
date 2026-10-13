// Safe, versioned localStorage helpers.
// All functions are no-ops / return fallbacks during server-side rendering so the
// initial server render stays stable and free of hydration errors.

import type {
  Flashcard,
  FlashcardReview,
  Lecture,
  LearningStats,
  NotificationItem,
  QuizAttempt,
  UserSettings,
} from "@/types";
import {
  defaultSettings,
  sampleFlashcards,
  sampleLectures,
  sampleNotifications,
  sampleStats,
} from "./mock-data";

const PREFIX = "lectureloop.v1.";

const KEYS = {
  lectures: `${PREFIX}lectures`,
  reviews: `${PREFIX}reviews`,
  attempts: `${PREFIX}attempts`,
  settings: `${PREFIX}settings`,
  studied: `${PREFIX}studiedLectures`,
  notifications: `${PREFIX}notifications`,
  renamed: `${PREFIX}renamedSampleLecture`,
  hidden: `${PREFIX}hiddenLectures`,
} as const;

function canUseStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `${PREFIX}__probe__`;
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getItem<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / unavailable — prototype degrades gracefully.
  }
}

export function removeItem(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Clears every key that belongs to the LectureLoop demo namespace. */
export function resetAllDemoData(): void {
  if (!canUseStorage()) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

// Lectures -------------------------------------------------------------------

function getHiddenSampleIds(): string[] {
  return getItem<string[]>(KEYS.hidden, []);
}

function visibleSampleLectures(): Lecture[] {
  const hidden = new Set(getHiddenSampleIds());
  return sampleLectures.filter((l) => !hidden.has(l.id));
}

/** All lectures: any user-created demo lectures first, then visible samples. */
export function getLectures(): Lecture[] {
  const created = getItem<Lecture[]>(KEYS.lectures, []);
  return [...created, ...visibleSampleLectures()];
}

export function getLectureById(id: string): Lecture | undefined {
  return getLectures().find((l) => l.id === id);
}

export function saveLecture(lecture: Lecture): Lecture[] {
  const created = getItem<Lecture[]>(KEYS.lectures, []).filter((l) => l.id !== lecture.id);
  const next = [lecture, ...created];
  setItem(KEYS.lectures, next);
  return next;
}

export function deleteLecture(id: string): Lecture[] {
  const isSample = sampleLectures.some((l) => l.id === id);
  if (isSample) {
    // Sample lectures are demonstration content — hiding keeps the library
    // state consistent across every page without destroying the samples.
    const hidden = Array.from(new Set([...getHiddenSampleIds(), id]));
    setItem(KEYS.hidden, hidden);
    return getLectures();
  }
  const next = getItem<Lecture[]>(KEYS.lectures, []).filter((l) => l.id !== id);
  setItem(KEYS.lectures, next);
  return next;
}

/** Renaming is only meaningful for created lectures; samples are always reset. */
export function renameLecture(id: string, title: string): void {
  const created = getItem<Lecture[]>(KEYS.lectures, []);
  const target = created.find((l) => l.id === id);
  if (!target) {
    // Allow "renaming" only in-memory for sample lectures (stored separately).
    const renamed = getItem<Record<string, string>>(KEYS.renamed, {});
    renamed[id] = title;
    setItem(KEYS.renamed, renamed);
    return;
  }
  target.title = title;
  setItem(KEYS.lectures, created);
}

/** Sorted, de-duplicated lecture list for selectors. */
export function getLectureOptions() {
  return getLectures().map((l) => ({ id: l.id, title: l.title, subject: l.subject }));
}

// Flashcards / reviews ---------------------------------------------------------

/** Flashcard library = all sample cards (merged with any created lecture cards). */
export function getAllFlashcards(): Flashcard[] {
  const created = getItem<Lecture[]>(KEYS.lectures, []);
  const createdCards = created
    .filter((l) => l.materials.flashcards > 0)
    .flatMap((l) => demoCardsForLecture(l));
  return [...createdCards, ...sampleFlashcards];
}

function demoCardsForLecture(lecture: Lecture): Flashcard[] {
  // Created lectures get a small deterministic demo card set.
  const n = Math.min(lecture.materials.flashcards, 5);
  const out: Flashcard[] = [];
  for (let i = 1; i <= n; i += 1) {
    out.push({
      id: `${lecture.id}-card-${i}`,
      lectureId: lecture.id,
      question: `Flashcard ${i} · ${lecture.title}`,
      answer: `Sample answer for “${lecture.title}”. This card exists to demonstrate a local study session in the prototype.`,
      difficulty: "medium",
    });
  }
  return out;
}

export function getFlashcards(): Flashcard[] {
  return getAllFlashcards();
}

export function getReviewMap(): Record<string, FlashcardReview> {
  const reviews = getItem<FlashcardReview[]>(KEYS.reviews, []);
  const map: Record<string, FlashcardReview> = {};
  reviews.forEach((r) => {
    map[r.cardId] = r;
  });
  return map;
}

export function getReviews(): FlashcardReview[] {
  return getItem<FlashcardReview[]>(KEYS.reviews, []);
}

/** Persist a review (keyed by card id, latest wins) and return the new list. */
export function saveReview(review: FlashcardReview): FlashcardReview[] {
  const next = [...getReviews().filter((r) => r.cardId !== review.cardId), review];
  setItem(KEYS.reviews, next);
  return next;
}

export function getDueFlashcards(date: Date = new Date()): Flashcard[] {
  const all = getAllFlashcards();
  const map = getReviewMap();
  const now = date.getTime();
  const due: Flashcard[] = [];
  all.forEach((card) => {
    const review = map[card.id];
    if (!review || new Date(review.nextReviewAt).getTime() <= now) due.push(card);
  });
  return due;
}

// Quiz attempts -----------------------------------------------------------------

export function getAttempts(): QuizAttempt[] {
  return getItem<QuizAttempt[]>(KEYS.attempts, []);
}

export function saveAttempt(attempt: QuizAttempt): QuizAttempt[] {
  const next = [...getAttempts(), attempt];
  setItem(KEYS.attempts, next);
  return next;
}

export function deleteAttempt(id: string): QuizAttempt[] {
  const next = getAttempts().filter((a) => a.id !== id);
  setItem(KEYS.attempts, next);
  return next;
}

// Settings ---------------------------------------------------------------------

export function getSettings(): UserSettings {
  return getItem<UserSettings>(KEYS.settings, defaultSettings);
}

export function saveSettings(settings: UserSettings): void {
  setItem(KEYS.settings, settings);
}

// “Marked as studied” lectures ---------------------------------------------------

export function getStudiedLectureIds(): string[] {
  return getItem<string[]>(KEYS.studied, []);
}

export function markLectureStudied(id: string): string[] {
  const next = Array.from(new Set([...getStudiedLectureIds(), id]));
  setItem(KEYS.studied, next);
  return next;
}

export function unmarkLectureStudied(id: string): string[] {
  const next = getStudiedLectureIds().filter((x) => x !== id);
  setItem(KEYS.studied, next);
  return next;
}

// Notifications ---------------------------------------------------------------
// Read/unread state for the header notification dropdown.

export function getStoredNotifications(): NotificationItem[] {
  return getItem<NotificationItem[]>(KEYS.notifications, sampleNotifications);
}

export function saveNotifications(items: NotificationItem[]): void {
  setItem(KEYS.notifications, items);
}

// Aggregate stats -----------------------------------------------------------------

export interface PersistedStats {
  flashcardsReviewed: number;
  masteredCards: number;
  quizzesCompleted: number;
  avgQuizScore: number;
  minutesFromReviews: number;
}

/** Counters derived purely from what the student has persisted locally. */
export function getPersistedStats(): PersistedStats {
  const reviews = getReviews();
  const attempts = getAttempts();
  const attemptsWithScore = attempts.filter((a) => a.score > 0);
  const avg = attemptsWithScore.length
    ? Math.round(
        attemptsWithScore.reduce((sum, a) => sum + a.score, 0) / attemptsWithScore.length
      )
    : 0;
  return {
    flashcardsReviewed: reviews.length,
    masteredCards: reviews.filter((r) => r.mastered).length,
    quizzesCompleted: attempts.length,
    avgQuizScore: avg,
    minutesFromReviews: Math.round(reviews.length * 1.5),
  };
}

/**
 * Dashboard / analytics numbers: sample baseline enriched by anything the
 * student persisted locally (created lectures, reviews, attempts).
 */
export function getMergedStats(): LearningStats {
  const persisted = getPersistedStats();
  const createdLectures = getItem<Lecture[]>(KEYS.lectures, []);
  const createdCards = createdLectures.reduce(
    (sum, l) => sum + Math.min(l.materials.flashcards, 5),
    0
  );
  return {
    totalLectures: sampleStats.totalLectures + createdLectures.length,
    totalFlashcards: sampleStats.totalFlashcards + createdCards,
    flashcardsReviewed: sampleStats.flashcardsReviewed + persisted.flashcardsReviewed,
    avgQuizScore: persisted.quizzesCompleted > 0 ? persisted.avgQuizScore : sampleStats.avgQuizScore,
    quizzesCompleted: sampleStats.quizzesCompleted + persisted.quizzesCompleted,
    streakDays: sampleStats.streakDays,
    minutesStudied: sampleStats.minutesStudied + persisted.minutesFromReviews,
  };
}