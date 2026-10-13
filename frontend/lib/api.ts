// Typed client for the LectureLoop FastAPI backend.
//
// The token is kept in localStorage and attached as a Bearer header. Every
// request funnels through `request` so error handling and 401 detection stay in
// one place.

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

const TOKEN_KEY = "lectureloop.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

/** Registered by the auth provider so a 401 can clear the session. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Is the backend running?");
  }

  if (res.status === 401) {
    if (auth && onUnauthorized) onUnauthorized();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
      else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
        detail = data.detail.map((d: { msg: string }) => d.msg).join(", ");
      }
    } catch {
      // keep default
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// --------------------------------------------------------------- Backend types

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  preferred_language: string;
  default_difficulty: string;
  notifications_enabled: boolean;
}

export interface ApiToken {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface ApiLecture {
  id: number;
  youtube_url: string;
  youtube_id: string | null;
  title: string;
  channel: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  status: string;
  stage_message: string;
  error_code: string | null;
  error_message: string | null;
  progress: number;
  language: string;
  difficulty: string;
  source: string;
  created_at: string;
  updated_at: string;
  topic_count: number;
  flashcard_count: number;
  quiz_question_count: number;
}

export interface ApiTopic {
  id: number;
  title: string;
  summary: string;
  notes: string;
  definitions: { term: string; definition: string }[];
  key_concepts: string[];
  order_index: number;
  start_seconds: number | null;
  end_seconds: number | null;
}

export interface ApiFlashcard {
  id: number;
  lecture_id: number;
  topic_id: number | null;
  topic_title: string | null;
  lecture_title: string | null;
  question: string;
  answer: string;
  difficulty: string;
  source_excerpt: string;
  source_start_seconds: number | null;
  bookmarked: boolean;
  next_review_at: string | null;
}

export interface ApiQuestion {
  id: number;
  topic_id: number | null;
  topic_title: string | null;
  question: string;
  options: string[];
  explanation: string;
  difficulty: string;
  source_excerpt: string;
  source_start_seconds: number | null;
}

export interface ApiQuiz {
  id: number;
  lecture_id: number;
  lecture_title: string | null;
  title: string;
  questions: ApiQuestion[];
}

export interface ApiQuizResult {
  attempt_id: number;
  quiz_id: number;
  score: number;
  total: number;
  results: {
    question_id: number;
    selected_index: number;
    correct_index: number;
    is_correct: boolean;
    topic_id: number | null;
    explanation: string;
  }[];
}

export interface ApiReview {
  flashcard_id: number;
  rating: string;
  repetitions: number;
  interval_days: number;
  ease: number;
  next_review_at: string;
}

export interface ApiDueCard {
  flashcard_id: number;
  question: string;
  lecture_title: string | null;
  topic_title: string | null;
  next_review_at: string;
  overdue: boolean;
}

export interface ApiTopicAccuracy {
  topic_id: number | null;
  topic_title: string;
  accuracy: number;
  attempts: number;
}

export interface ApiAnalytics {
  total_lectures: number;
  total_flashcards: number;
  total_reviews: number;
  quizzes_completed: number;
  average_quiz_score: number;
  due_today: number;
  overdue: number;
  streak_days: number;
  weak_topics: ApiTopicAccuracy[];
  topic_accuracy: ApiTopicAccuracy[];
  difficulty_accuracy: Record<string, { accuracy: number; attempts: number }>;
  score_trend: { date: string; score: number }[];
  recommended_topics: string[];
}

// ------------------------------------------------------------------- Endpoints

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request<ApiToken>("/auth/register", {
      method: "POST",
      auth: false,
      body: { name, email, password },
    }),
  login: (email: string, password: string) =>
    request<ApiToken>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    }),
  me: () => request<ApiUser>("/auth/me"),
  updateMe: (payload: Partial<Pick<ApiUser, "name" | "preferred_language" | "default_difficulty" | "notifications_enabled">>) =>
    request<ApiUser>("/users/me", { method: "PATCH", body: payload }),

  // Lectures
  listLectures: () => request<ApiLecture[]>("/lectures"),
  getLecture: (id: number | string) => request<ApiLecture>(`/lectures/${id}`),
  createLecture: (payload: {
    youtube_url?: string;
    transcript?: string;
    language?: string;
    difficulty?: string;
  }) => request<ApiLecture>("/lectures", { method: "POST", body: payload }),
  regenerateLecture: (id: number | string) =>
    request<ApiLecture>(`/lectures/${id}/generate`, { method: "POST" }),
  deleteLecture: (id: number | string) =>
    request<void>(`/lectures/${id}`, { method: "DELETE" }),
  getNotes: (id: number | string) => request<ApiTopic[]>(`/lectures/${id}/notes`),
  getLectureFlashcards: (id: number | string) =>
    request<ApiFlashcard[]>(`/lectures/${id}/flashcards`),
  getLectureQuiz: (id: number | string) =>
    request<ApiQuiz | null>(`/lectures/${id}/quiz`),

  // Flashcards
  listFlashcards: (params?: { lecture_id?: number; bookmarked?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.lecture_id !== undefined) search.set("lecture_id", String(params.lecture_id));
    if (params?.bookmarked) search.set("bookmarked", "true");
    const qs = search.toString();
    return request<ApiFlashcard[]>(`/flashcards${qs ? `?${qs}` : ""}`);
  },
  dueFlashcards: () => request<ApiDueCard[]>("/flashcards/due"),
  reviewFlashcard: (id: number | string, rating: string) =>
    request<ApiReview>(`/flashcards/${id}/review`, { method: "POST", body: { rating } }),
  toggleBookmark: (id: number | string) =>
    request<ApiFlashcard>(`/flashcards/${id}/bookmark`, { method: "POST" }),

  // Quizzes
  getQuiz: (id: number | string) => request<ApiQuiz>(`/quizzes/${id}`),
  submitQuiz: (id: number | string, answers: number[]) =>
    request<ApiQuizResult>(`/quizzes/${id}/submit`, { method: "POST", body: { answers } }),

  // Analytics
  analytics: () => request<ApiAnalytics>("/analytics"),
  revisionDue: () => request<ApiDueCard[]>("/revision/due"),
};
