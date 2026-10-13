// Shared domain types for the LectureLoop frontend.

/** Subject/channel label. Free-form because lectures come from the backend. */
export type Subject = string;

export type Difficulty = "easy" | "medium" | "hard";

export type Rating = "again" | "hard" | "good" | "easy";

export type LectureStatus = "ready" | "processing" | "failed";

export interface LectureSource {
  type: "youtube" | "transcript";
  url?: string;
  youtubeId?: string;
  channel?: string;
  filename?: string;
  transcriptPreview?: string;
  /** When the source was captured (prototype: simulated, now). */
  capturedAt?: string;
}

export interface StudyMaterials {
  notes: boolean;
  flashcards: number;
  quizQuestions: number;
}

export interface Lecture {
  id: string;
  title: string;
  subject: Subject;
  instructor: string;
  /** ISO date the lecture was added to the library. */
  date: string;
  durationSeconds: number;
  /** Overall study progress 0–100. */
  progress: number;
  status: LectureStatus;
  /** Free-text description used in previews. */
  description: string;
  source: LectureSource;
  materials: StudyMaterials;
  topics: Topic[];
  notes?: NoteSection;
  /** True when this lecture ships with the demo and is not user-created. */
  demo: boolean;
}

export interface Topic {
  id: string;
  title: string;
  order: number;
  timestampSeconds?: number;
  summary: string;
  keyPoints: string[];
  definitions: { term: string; definition: string }[];
  examples: string[];
  examImportant: string[];
  sourceExcerpt?: string;
  sourceTimestampSeconds?: number;
}

export interface NoteSection {
  lectureId: string;
  title: string;
  overview: string;
  takeaways: string[];
  topics: Topic[];
  references: { excerpt: string; timestampSeconds: number }[];
}

export interface Flashcard {
  id: string;
  lectureId: string;
  topicId?: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  /** Timestamp in the source lecture where this concept is explained. */
  sourceTimestampSeconds?: number;
  sourceExcerpt?: string;
  bookmarked?: boolean;
  nextReviewAt?: string | null;
}

export interface FlashcardReview {
  cardId: string;
  rating: Rating;
  reviewedAt: string;
  /** ISO date when this card should be seen again. */
  nextReviewAt: string;
  mastered: boolean;
}

export interface QuizQuestion {
  id: string;
  lectureId: string;
  topicId: string;
  topicTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface QuizAnswer {
  questionId: string;
  selected: number | null;
  correct: boolean;
}

export interface QuizAttempt {
  id: string;
  lectureId: string;
  lectureTitle: string;
  date: string;
  difficulty: Difficulty;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  topicBreakdown: { topic: string; correct: number; total: number }[];
  answers: QuizAnswer[];
}

export interface StudyActivityDay {
  date: string;
  label: string;
  minutes: number;
}

export interface SubjectProgress {
  subject: Subject;
  progress: number;
  flashcardCount: number;
  weak: boolean;
}

export type RecommendationKind =
  | "weak-topic"
  | "due-flashcards"
  | "quiz"
  | "notes";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export interface UpcomingRevision {
  id: string;
  title: string;
  dueIn: string;
  count: number;
  href: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
}

export interface UserSettings {
  name: string;
  email: string;
  dailyGoalMinutes: number;
  reminderEnabled: boolean;
  reminderTime: string;
  preferredDifficulty: Difficulty;
  /** Show a confirmation before leaving a quiz. */
  confirmQuizSubmit: boolean;
}

export interface SubjectStyle {
  badge: string;
  bar: string;
  chart: string;
}

/** Aggregate stats used by the dashboard and analytics pages. */
export interface LearningStats {
  totalLectures: number;
  totalFlashcards: number;
  flashcardsReviewed: number;
  avgQuizScore: number;
  quizzesCompleted: number;
  streakDays: number;
  minutesStudied: number;
}