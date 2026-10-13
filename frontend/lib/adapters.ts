// Adapters that map backend API payloads onto the frontend domain types.
//
// The backend uses numeric ids and a slightly different vocabulary (e.g.
// "upload" sources, raw topics). These helpers keep the UI components working
// with the existing `@/types` shapes (string ids, `Topic`, `Lecture`, ...).

import type {
  ApiFlashcard,
  ApiLecture,
  ApiQuiz,
  ApiQuizResult,
  ApiTopic,
} from "./api";
import type {
  Difficulty,
  Flashcard,
  Lecture,
  LectureStatus,
  NoteSection,
  QuizAttempt,
  QuizQuestion,
  Topic,
} from "@/types";

export function toDifficulty(value: string | null | undefined): Difficulty {
  return value === "easy" || value === "hard" ? value : "medium";
}

function toStatus(status: string): LectureStatus {
  if (status === "ready") return "ready";
  if (
    ["failed", "invalid_url", "transcript_unavailable", "empty_transcript", "processing_failed"].includes(
      status
    )
  ) {
    return "failed";
  }
  return "processing";
}

function parseNotesLines(notes: string): string[] {
  return notes
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function subjectFor(lecture: ApiLecture): string {
  return (
    lecture.channel?.trim() ||
    (lecture.source === "upload" ? "Uploaded transcript" : "General")
  );
}

export function toTopic(topic: ApiTopic): Topic {
  const bullets = parseNotesLines(topic.notes);
  const keyPoints = bullets.length ? bullets : topic.key_concepts;
  return {
    id: String(topic.id),
    title: topic.title,
    order: topic.order_index + 1,
    timestampSeconds: topic.start_seconds ?? undefined,
    summary: topic.summary,
    keyPoints,
    definitions: topic.definitions ?? [],
    examples: [],
    examImportant: topic.key_concepts.filter((c) => !keyPoints.includes(c)),
    sourceExcerpt: undefined,
    sourceTimestampSeconds: topic.end_seconds ?? topic.start_seconds ?? undefined,
  };
}

export function toLecture(lecture: ApiLecture): Lecture {
  const source =
    lecture.source === "youtube"
      ? {
          type: "youtube" as const,
          url: lecture.youtube_url || undefined,
          youtubeId: lecture.youtube_id ?? undefined,
          channel: lecture.channel ?? undefined,
        }
      : {
          type: "transcript" as const,
          transcriptPreview: "Uploaded transcript",
        };

  return {
    id: String(lecture.id),
    title: lecture.title,
    subject: subjectFor(lecture),
    instructor: lecture.channel || "Your upload",
    date: lecture.created_at,
    durationSeconds: lecture.duration_seconds ?? 0,
    progress: lecture.progress,
    status: toStatus(lecture.status),
    description: `${lecture.title} — study material generated from ${
      lecture.source === "youtube" ? "a YouTube lecture" : "an uploaded transcript"
    }.`,
    source,
    materials: {
      notes: lecture.topic_count > 0,
      flashcards: lecture.flashcard_count,
      quizQuestions: lecture.quiz_question_count,
    },
    topics: [],
    demo: false,
  };
}

export function toNoteSection(lecture: Lecture, topics: ApiTopic[]): NoteSection {
  const takeaways = topics.flatMap((t) => t.key_concepts).slice(0, 6);
  return {
    lectureId: lecture.id,
    title: lecture.title,
    overview: topics[0]?.summary || lecture.description,
    takeaways: takeaways.length
      ? takeaways
      : topics.slice(0, 3).map((t) => t.summary).filter(Boolean),
    topics: topics.map(toTopic),
    references: topics
      .filter((t) => t.summary)
      .slice(0, 5)
      .map((t) => ({
        excerpt: t.summary,
        timestampSeconds: Math.round(t.start_seconds ?? 0),
      })),
  };
}

export function toFlashcard(card: ApiFlashcard): Flashcard {
  return {
    id: String(card.id),
    lectureId: String(card.lecture_id),
    topicId: card.topic_id != null ? String(card.topic_id) : undefined,
    question: card.question,
    answer: card.answer,
    difficulty: toDifficulty(card.difficulty),
    sourceTimestampSeconds: card.source_start_seconds ?? undefined,
    sourceExcerpt: card.source_excerpt || undefined,
    bookmarked: card.bookmarked,
    nextReviewAt: card.next_review_at,
  };
}

export function toQuizQuestions(quiz: ApiQuiz): QuizQuestion[] {
  return quiz.questions.map((q) => ({
    id: String(q.id),
    lectureId: String(quiz.lecture_id),
    topicId: q.topic_id != null ? String(q.topic_id) : "topic",
    topicTitle: q.topic_title ?? "General",
    question: q.question,
    options: q.options,
    // The correct answer is never sent to the client before grading.
    correctIndex: -1,
    explanation: q.explanation,
    difficulty: toDifficulty(q.difficulty),
  }));
}

/** Returns new questions with the correct index filled in from the grader. */
export function applyQuizResults(
  questions: QuizQuestion[],
  result: ApiQuizResult
): QuizQuestion[] {
  const byId = new Map(result.results.map((r) => [r.question_id, r]));
  return questions.map((q) => {
    const r = byId.get(Number(q.id));
    return r ? { ...q, correctIndex: r.correct_index } : q;
  });
}

export function toQuizAttempt(
  quiz: ApiQuiz,
  questions: QuizQuestion[],
  selected: (number | null)[],
  result: ApiQuizResult
): QuizAttempt {
  const topicCounts = new Map<string, { correct: number; total: number }>();
  const answers = questions.map((q, i) => {
    const chosen = selected[i];
    const graded = result.results.find((r) => r.question_id === Number(q.id));
    const correct = graded?.is_correct ?? false;
    const entry = topicCounts.get(q.topicTitle) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (correct) entry.correct += 1;
    topicCounts.set(q.topicTitle, entry);
    return {
      questionId: q.id,
      selected: chosen,
      correct,
    };
  });

  return {
    id: String(result.attempt_id),
    lectureId: String(quiz.lecture_id),
    lectureTitle: quiz.lecture_title ?? quiz.title,
    date: new Date().toISOString(),
    difficulty: toDifficulty(quiz.questions[0]?.difficulty),
    totalQuestions: result.total,
    correctAnswers: result.score,
    score: result.total ? Math.round((result.score / result.total) * 100) : 0,
    topicBreakdown: Array.from(topicCounts.entries()).map(([topic, v]) => ({
      topic,
      correct: v.correct,
      total: v.total,
    })),
    answers,
  };
}
