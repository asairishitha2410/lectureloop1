"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Layers,
  Trophy,
  ClipboardList,
  FileQuestion,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Field, { selectClass } from "@/components/ui/Field";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import QuizOption from "@/components/quiz/QuizOption";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError, type ApiQuiz } from "@/lib/api";
import { applyQuizResults, toLecture, toQuizAttempt, toQuizQuestions } from "@/lib/adapters";
import { difficultyStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Difficulty, QuizAttempt, QuizQuestion } from "@/types";

type Phase = "setup" | "quiz" | "results";
const MCQ_COUNTS = [5, 10, 15] as const;

export default function QuizPage() {
  const toast = useToast();

  const [lectures, setLectures] = useState<ReturnType<typeof toLecture>[]>([]);
  const [lectureId, setLectureId] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [count, setCount] = useState<number>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [quiz, setQuiz] = useState<ApiQuiz | null>(null);
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>([]);
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [graded, setGraded] = useState<QuizQuestion[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [rows, analytics] = await Promise.all([api.listLectures(), api.analytics()]);
        const withQuiz = rows.filter((l) => l.quiz_question_count > 0).map(toLecture);
        setLectures(withQuiz);
        setAttemptCount(analytics.quizzes_completed);
        const url = new URLSearchParams(window.location.search);
        const lectureInitial = url.get("lecture");
        if (lectureInitial && withQuiz.some((l) => l.id === lectureInitial)) {
          setLectureId(lectureInitial);
        }
      } catch (err) {
        toast.push(err instanceof ApiError ? err.message : "Could not load quizzes.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const availableCount = useMemo(() => {
    return examQuestions.filter((q) => difficulty === "all" || q.difficulty === difficulty).length;
  }, [examQuestions, difficulty]);

  async function startQuiz() {
    if (lectureId === "all") {
      toast.push("Choose a lecture to practice.", "error");
      return;
    }
    setStarting(true);
    try {
      const loaded = await api.getLectureQuiz(lectureId);
      if (!loaded || loaded.questions.length === 0) {
        toast.push("This lecture doesn't have a quiz yet.", "error");
        return;
      }
      const all = toQuizQuestions(loaded);
      const filtered =
        difficulty === "all" ? all : all.filter((q) => q.difficulty === difficulty);
      if (filtered.length === 0) {
        toast.push("No questions match the chosen difficulty.", "error");
        return;
      }
      const chosen = filtered.slice(0, Math.min(count, filtered.length));
      setQuiz(loaded);
      setExamQuestions(all);
      setPool(chosen);
      setAnswers(Array(chosen.length).fill(null));
      setCurrent(0);
      setAttempt(null);
      setGraded([]);
      setPhase("quiz");
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not start the quiz.", "error");
    } finally {
      setStarting(false);
    }
  }

  function answeredCount() {
    return answers.filter((a) => a !== null).length;
  }

  async function submitQuiz() {
    if (!quiz) return;
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      const payload = answers.map((a) => (a === null ? -1 : a));
      const result = await api.submitQuiz(quiz.id, payload);
      const gradedQuestions = applyQuizResults(pool, result);
      setGraded(gradedQuestions);
      setAttempt(toQuizAttempt(quiz, gradedQuestions, answers, result));
      setAttemptCount((c) => c + 1);
      setPhase("results");
      const unanswered = answers.filter((a) => a === null).length;
      if (unanswered > 0) {
        toast.push(`${unanswered} question${unanswered === 1 ? "" : "s"} left unanswered (counted as incorrect).`, "info");
      } else {
        toast.push(`Quiz scored ${result.total ? Math.round((result.score / result.total) * 100) : 0}%.`);
      }
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not submit the quiz.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading quizzes…</div>;
  }

  if (lectures.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No quizzes available"
        description="Add a lecture and let the backend generate its practice quiz — it'll appear here."
        action={
          <Link href="/lectures/new">
            <Button>Add a lecture</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Practice"
        title="Practice Quiz"
        description="Answer MCQ questions and get per-topic feedback. Quizzes are generated from each lecture's transcript and graded on the server."
      />

      {phase === "setup" ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-bold text-navy text-lg mb-6">
              <FileQuestion className="w-5 h-5 text-primary" /> Quiz setup
            </h2>

            <div className="space-y-5">
              <Field label="Lecture" htmlFor="quiz-lecture" hint="Each lecture has its own generated quiz.">
                <select
                  id="quiz-lecture"
                  value={lectureId}
                  onChange={(e) => setLectureId(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">Select a lecture…</option>
                  {lectures.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} · {l.subject}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Difficulty" htmlFor="quiz-difficulty">
                  <select
                    id="quiz-difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "all" | Difficulty)}
                    className={selectClass}
                  >
                    <option value="all">All difficulties</option>
                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                      <option key={d} value={d}>
                        {difficultyStyle[d].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Number of questions" htmlFor="quiz-count">
                  <select
                    id="quiz-count"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className={selectClass}
                  >
                    {MCQ_COUNTS.map((n) => (
                      <option key={n} value={n}>
                        {n} questions
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="rounded-xl bg-lavender-soft border border-primary/10 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-navy">Ready to start</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lectureId === "all"
                      ? "Pick a lecture to see how many questions are available."
                      : `${availableCount} question${availableCount === 1 ? "" : "s"} available with the current difficulty`}
                  </p>
                </div>
                <Button onClick={startQuiz} loading={starting} disabled={lectureId === "all" || availableCount === 0}>
                  {!starting ? <Play className="w-4.5 h-4.5" /> : null} Start quiz
                </Button>
              </div>
            </div>
          </Card>

          {attemptCount > 0 ? (
            <Card className="p-6">
              <h3 className="flex items-center gap-2 font-bold text-navy mb-3">
                <ClipboardList className="w-4.5 h-4.5 text-primary" /> Your progress
              </h3>
              <p className="text-sm text-slate-500">
                {attemptCount} quiz attempt{attemptCount === 1 ? "" : "s"} recorded. Visit Analytics for
                trends across your lectures.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {phase === "quiz" && pool.length > 0 ? (
        <div className="max-w-3xl mx-auto">
          {/* Progress + nav */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <Badge tone="purple">
              Question {current + 1} of {pool.length}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                {answeredCount()}/{pool.length} answered
              </span>
              <Button size="sm" loading={submitting} onClick={() => setConfirmOpen(true)}>
                Submit quiz
              </Button>
            </div>
          </div>

          {/* Question navigation panel */}
          <div className="flex flex-wrap gap-2 mb-6" aria-label="Question navigation">
            {pool.map((_, i) => {
              const selected = answers[i] !== null;
              const isCurrent = i === current;
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    isCurrent ? "ring-2 ring-primary ring-offset-2 text-primary" : "",
                    selected ? "bg-lavender-soft text-primary" : "bg-white text-slate-500 border border-slate-200"
                  )}
                  aria-label={`Go to question ${i + 1}${selected ? " (answered)" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Badge
                tone={pool[current].difficulty === "easy" ? "sage" : pool[current].difficulty === "hard" ? "rose" : "purple"}
              >
                {difficultyStyle[pool[current].difficulty].label}
              </Badge>
              <Badge tone="slate">{pool[current].topicTitle}</Badge>
              {answers[current] !== null ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                </span>
              ) : null}
            </div>
            <h2 className="text-lg font-bold text-navy leading-snug mb-5">{pool[current].question}</h2>
            <div className="grid gap-3">
              {pool[current].options.map((option, i) => (
                <QuizOption
                  key={i}
                  index={i}
                  text={option}
                  state={answers[current] === i ? "selected" : "idle"}
                  onSelect={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[current] = next[current] === i ? null : i;
                      return next;
                    })
                  }
                />
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              {current < pool.length - 1 ? (
                <Button size="sm" onClick={() => setCurrent((c) => c + 1)}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" loading={submitting} onClick={() => setConfirmOpen(true)}>
                  Finish &amp; submit
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {phase === "results" && attempt ? (
        <ResultsView
          attempt={attempt}
          questions={graded}
          onRetry={startQuiz}
          onRestart={() => {
            setPhase("setup");
            setAttempt(null);
            setGraded([]);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Submit quiz?"
        description={`You have answered ${answeredCount()} of ${answers.length} questions. Anything unanswered will be counted as incorrect.`}
        confirmLabel="Submit quiz"
        onConfirm={submitQuiz}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// --------------------------------------------------------------------------- Results

function ResultsView({
  attempt,
  questions,
  onRetry,
  onRestart,
}: {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  onRetry: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" role="img" aria-label={`Score ${attempt.score}%`}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={attempt.score >= 70 ? "#22C55E" : attempt.score >= 40 ? "#7C3AED" : "#F43F5E"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(attempt.score / 100) * 326.7} 326.7`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-navy">{attempt.score}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Score</span>
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="flex items-center justify-center sm:justify-start gap-2 text-xl font-bold text-navy">
              {attempt.score >= 70 ? <Trophy className="w-5 h-5 text-amber-500" /> : <ClipboardList className="w-5 h-5 text-primary" />}
              Quiz complete
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              You answered {attempt.correctAnswers} of {attempt.totalQuestions} correctly
              {attempt.totalQuestions ? ` (${attempt.score}%)` : ""}.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <Badge tone="slate">{difficultyStyle[attempt.difficulty].label} difficulty</Badge>
              <Badge tone="purple">{attempt.lectureTitle}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
              <Button size="sm" onClick={onRetry}>
                <RotateCcw className="w-4 h-4" /> Retry quiz
              </Button>
              <Link href="/flashcards" className="inline-block">
                <Button variant="outline" size="sm">
                  <Layers className="w-4 h-4" /> Review flashcards
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onRestart}>
                New settings
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Topic breakdown */}
        <Card className="p-6">
          <h3 className="font-bold text-navy mb-3">Topic-level performance</h3>
          {attempt.topicBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No topic data.</p>
          ) : (
            <div className="space-y-3">
              {attempt.topicBreakdown.map((t) => {
                const acc = t.total ? Math.round((t.correct / t.total) * 100) : 0;
                return (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-medium text-slate-600">{t.topic}</span>
                      <span className="font-bold text-navy">
                        {acc}% <span className="text-xs font-medium text-slate-400">({t.correct}/{t.total})</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${acc < 50 ? "bg-rose-400" : acc < 75 ? "bg-primary" : "bg-success"}`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Answer summary */}
        <Card className="p-6">
          <h3 className="font-bold text-navy mb-3">Answer summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-sage-soft border border-emerald-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">{attempt.correctAnswers}</p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-rose-600">
                {attempt.totalQuestions - attempt.correctAnswers}
              </p>
              <p className="text-xs text-slate-500">Incorrect / skipped</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Review every question below for the explanation.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Question review */}
      <div className="space-y-4">
        <h3 className="font-bold text-navy">Question review</h3>
        {attempt.answers.map((a, i) => {
          const q = questions[i];
          if (!q) return null;
          const yourAnswer = a.selected !== null ? q.options[a.selected] : null;
          return (
            <Card key={q.id} className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                {a.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy leading-snug">
                    {i + 1}. {q.question}
                  </p>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        a.correct
                          ? "bg-sage-soft text-emerald-800 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wide block mb-0.5">
                        Your answer
                      </span>
                      {yourAnswer ?? "Skipped"}
                    </div>
                    <div className="rounded-lg px-3 py-2 text-sm bg-lavender-soft text-primary border border-primary/10">
                      <span className="text-[10px] font-bold uppercase tracking-wide block mb-0.5">
                        Correct answer
                      </span>
                      {q.options[q.correctIndex] ?? "—"}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    <span className="font-semibold text-navy">Why: </span>
                    {q.explanation}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
