// Builds deterministic prototype content for user-created lectures.
// Mirrors what a real backend pipeline would produce — clearly labelled as
// local demonstration data in the UI.

import type {
  Lecture,
  LectureSource,
  NoteSection,
  QuizQuestion,
  Subject,
  Topic,
} from "@/types";
import { uid } from "./utils";

export interface DemoLectureInput {
  title: string;
  subject: Subject;
  description: string;
  source: LectureSource;
  notes: boolean;
  flashcards: number;
  quizQuestions: number;
}

function topicOne(id: string, subject: Subject): Topic {
  return {
    id: `${id}-t1`,
    title: "Overview & core ideas",
    order: 1,
    timestampSeconds: 60,
    summary: `A short introduction to ${subject}, covering the big picture and the vocabulary you need to answer exam questions with confidence.`,
    keyPoints: [
      `Identify the fundamental definitions used across ${subject}.`,
      "Connect concepts to a realistic study context.",
      "Expect definitions, examples and short answer-style checks.",
    ],
    definitions: [
      {
        term: "Concept",
        definition: `A fundamental idea that everything else in ${subject} builds upon.`,
      },
      {
        term: "Example problem",
        definition: "A concrete scenario that applies one or more concepts.",
      },
    ],
    examples: [
      `A worked comparison of two core ${subject} approaches.`,
      "A step-by-step reasoning chain for a typical exam question.",
    ],
    examImportant: ["Definitions are usually worth easy marks.", "Link every concept to a concrete example."],
    sourceExcerpt:
      "…we start with the core ideas, then practice each concept with a realistic example…",
    sourceTimestampSeconds: 60,
  };
}

function topicTwo(id: string, subject: Subject): Topic {
  return {
    id: `${id}-t2`,
    title: "Key concepts & practice",
    order: 2,
    timestampSeconds: 420,
    summary: `Deeper practice on the most commonly examined areas of ${subject}, with reminders of the mistakes students usually make.`,
    keyPoints: [
      "Recognise the pattern that identifies which technique to apply.",
      "Practise a full worked problem end to end.",
      "Note down the classic error that loses marks in exams.",
    ],
    definitions: [
      {
        term: "Heuristic",
        definition: "A rule of thumb that usually gives the right approach quickly.",
      },
    ],
    examples: [
      `A complete solved problem using ${subject} principles.`,
      "A before/after comparison of the naive vs correct approach.",
    ],
    examImportant: ["Aim for clarity over memorisation.", "Check units and edge cases."],
    sourceExcerpt:
      "…practice is where most students improve fastest, so let's walk through a full example…",
    sourceTimestampSeconds: 420,
  };
}

function buildTopics(id: string, subject: Subject): Topic[] {
  return [topicOne(id, subject), topicTwo(id, subject)];
}

export function buildDemoLecture(input: DemoLectureInput): Lecture {
  const id = uid("lec");
  const topics = input.notes ? buildTopics(id, input.subject) : [];
  const noteSection: NoteSection | undefined = input.notes
    ? {
        lectureId: id,
        title: input.title,
        overview: input.description,
        takeaways: [
          `Review the ${input.subject} concepts introduced in this lecture while they are fresh.`,
          "Use the flashcards to test recall, then take a short quiz.",
        ],
        topics,
        references: [
          { excerpt: "…we start with the core ideas…", timestampSeconds: 60 },
          { excerpt: "…lets walk through a full example…", timestampSeconds: 420 },
        ],
      }
    : undefined;

  return {
    id,
    title: input.title,
    subject: input.subject,
    instructor: "Your upload",
    date: new Date().toISOString(),
    durationSeconds: 0,
    progress: 0,
    status: "ready" as const,
    description: input.description,
    source: input.source,
    materials: {
      notes: input.notes,
      flashcards: input.flashcards,
      quizQuestions: input.quizQuestions,
    },
    topics,
    notes: noteSection,
    demo: false,
  };
}

const MCQs_PER_LECTURE = 3;

/** Deterministic demo MCQs for a user-created lecture. */
export function getQuizQuestionsForLecture(lecture: Lecture): QuizQuestion[] {
  const n = Math.max(1, Math.min(MCQs_PER_LECTURE, lecture.materials.quizQuestions || 1));
  const title = lecture.title;
  const topic = lecture.topics[0]?.title ?? "Overview";
  const subject = lecture.subject;
  const base: Omit<QuizQuestion, "id">[] = [
    {
      lectureId: lecture.id,
      topicId: lecture.topics[0]?.id ?? "topic",
      topicTitle: topic,
      question: `What is a primary concept introduced in “${title}”?`,
      options: [
        `The central ideas behind ${subject}, clearly defined`,
        "A random collection of unrelated facts",
        "Only the author's personal opinion",
        "A list of external links",
      ],
      correctIndex: 0,
      explanation: `The lecture opens by defining the ${subject} concepts, which everything else builds on.`,
      difficulty: "easy",
    },
    {
      lectureId: lecture.id,
      topicId: lecture.topics[1]?.id ?? "topic",
      topicTitle: lecture.topics[1]?.title ?? "Practice",
      question: `According to the notes, why is practice emphasised?`,
      options: [
        "It replaces understanding entirely",
        "It is where students improve fastest",
        "It is the only graded activity",
        "It makes lectures unnecessary",
      ],
      correctIndex: 1,
      explanation: "Working through full examples builds the patterns you reuse in exams.",
      difficulty: "medium",
    },
    {
      lectureId: lecture.id,
      topicId: lecture.topics[1]?.id ?? "topic",
      topicTitle: lecture.topics[1]?.title ?? "Practice",
      question: `Which habit is encouraged for exam answers in ${subject}?`,
      options: [
        "Memorising without context",
        "Vague, unfocused writing",
        "Clarity and checking edge cases",
        "Skipping definitions",
      ],
      correctIndex: 2,
      explanation: "Clear reasoning with checked edge cases reliably earns marks.",
      difficulty: "medium",
    },
  ];
  return base.slice(0, n).map((q, i) => ({ ...q, id: `${lecture.id}-q${i + 1}` }));
}