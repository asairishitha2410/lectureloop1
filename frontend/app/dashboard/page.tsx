"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Library,
  Layers,
  ListChecks,
  Flame,
  Sparkles,
  ArrowRight,
  Target,
  CalendarClock,
  Plus,
  BookOpen,
  TrendingUp,
  Layers as LayersIcon,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import LectureCard from "@/components/lectures/LectureCard";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";
import { QuizTrendChart, SubjectProgressBars } from "@/components/charts";
import { api, ApiAnalytics, ApiDueCard } from "@/lib/api";
import { toLecture } from "@/lib/adapters";
import { useAuth } from "@/lib/auth";
import type { Lecture, SubjectProgress } from "@/types";
import { greetingForHour, relativeToNow, truncate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [due, setDue] = useState<ApiDueCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, ls, d] = await Promise.all([
        api.analytics(),
        api.listLectures(),
        api.dueFlashcards(),
      ]);
      setAnalytics(a);
      setLectures(ls.map(toLecture));
      setDue(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recent = useMemo(() => lectures.slice(0, 3), [lectures]);

  const subjectProgress = useMemo<SubjectProgress[]>(() => {
    const groups = new Map<string, { total: number; count: number }>();
    lectures.forEach((l) => {
      const entry = groups.get(l.subject) ?? { total: 0, count: 0 };
      entry.total += l.status === "ready" ? 100 : l.progress;
      entry.count += 1;
      groups.set(l.subject, entry);
    });
    return Array.from(groups.entries()).map(([subject, v]) => ({
      subject,
      progress: v.count ? Math.round(v.total / v.count) : 0,
      flashcardCount: lectures
        .filter((l) => l.subject === subject)
        .reduce((sum, l) => sum + l.materials.flashcards, 0),
      weak: analytics?.weak_topics.some((t) => t.topic_title === subject) ?? false,
    }));
  }, [lectures, analytics]);

  if (loading) {
    return <LoadingState title="Loading your dashboard…" />;
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Could not load your dashboard. Is the backend running?
      </Card>
    );
  }

  const first = (user?.name ?? "learner").split(" ")[0] || "learner";
  const weakTopics = analytics.weak_topics;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`${greetingForHour(new Date().getHours())}, ${first}`}
        description="Your learning at a glance — recent lectures, cards to revise and what to study next."
      />

      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E3A8A] text-white p-7 sm:p-10 mb-8">
        <div className="absolute -top-16 -right-10 w-72 h-72 bg-white/10 rounded-full blur-2xl" aria-hidden />
        <div className="absolute -bottom-24 -left-10 w-80 h-80 bg-lavender/20 rounded-full blur-3xl" aria-hidden />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-white/85">
              AI Lecture-to-Learning Platform
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Turn lectures into knowledge.
            </h2>
            <p className="mt-2 text-white/75 text-sm leading-relaxed">
              Paste a lecture, get structured notes, flashcards and quizzes — then let the
              app tell you what to revise next.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/lectures/new"
              className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold shadow-lg hover:bg-white/90 transition-all"
            >
              <Plus className="w-4.5 h-4.5" /> Add a new lecture
            </Link>
            <Link
              href="/notes"
              className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-all"
            >
              <Sparkles className="w-4.5 h-4.5" /> Continue learning
            </Link>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lectures studied"
          value={analytics.total_lectures}
          icon={Library}
          tone="purple"
          hint={`${analytics.total_flashcards} cards generated in total`}
        />
        <StatCard
          label="Flashcards reviewed"
          value={analytics.total_reviews}
          icon={Layers}
          tone="blue"
          hint={`${analytics.due_today} due today`}
        />
        <StatCard
          label="Average quiz score"
          value={`${Math.round(analytics.average_quiz_score)}%`}
          icon={ListChecks}
          tone="sage"
          hint={`${analytics.quizzes_completed} quizzes completed`}
        />
        <StatCard
          label="Study streak"
          value={`${analytics.streak_days} days`}
          icon={Flame}
          tone="cyan"
          hint={due.length > 0 ? `${due.length} cards due — keep the streak` : "All caught up"}
        />
      </div>

      {/* Recent lectures + revision */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">Recent lectures</h2>
            <Link
              href="/lectures"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {recent.length === 0 ? (
              <Card className="p-8 text-center text-sm text-slate-500">
                No lectures yet.{" "}
                <Link href="/lectures/new" className="font-semibold text-primary hover:underline">
                  Add your first lecture
                </Link>
                .
              </Card>
            ) : (
              recent.map((l) => <LectureCard key={l.id} lecture={l} />)
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Recommended for revision */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4.5 h-4.5 text-rose-500" />
              <h2 className="font-bold text-navy">Recommended for revision</h2>
            </div>
            <div className="space-y-3">
              {weakTopics.length === 0 && due.length === 0 ? (
                <p className="text-sm text-slate-500 leading-relaxed">
                  Nothing flagged right now. Take a quiz and LectureLoop will surface weak
                  topics to focus on.
                </p>
              ) : (
                <>
                  {weakTopics.slice(0, 4).map((topic) => (
                    <Link
                      key={`${topic.topic_id}-${topic.topic_title}`}
                      href="/analytics"
                      className="flex items-start gap-3 rounded-xl bg-rose-50/70 border border-rose-100 p-3 hover:bg-rose-50 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {topic.topic_title}: {Math.round(topic.accuracy)}% accuracy
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          Below target — review the notes and retake the topic quiz.
                        </span>
                      </span>
                    </Link>
                  ))}
                  {due.length > 0 ? (
                    <Link
                      href="/flashcards"
                      className="flex items-start gap-3 rounded-xl bg-lavender-soft border border-primary/10 p-3 hover:bg-primary/10 transition-colors"
                    >
                      <LayersIcon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {due.length} flashcard{due.length > 1 ? "s" : ""} due today
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          Spaced repetition works best when you show up.
                        </span>
                      </span>
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </Card>

          {/* Upcoming revision */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4.5 h-4.5 text-blue" />
              <h2 className="font-bold text-navy">Due for review</h2>
            </div>
            <div className="space-y-2.5">
              {due.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing due right now.</p>
              ) : (
                due.slice(0, 4).map((card) => (
                  <Link
                    key={card.flashcard_id}
                    href="/flashcards"
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-primary/30 hover:bg-lavender-soft/40 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-700 truncate">
                        {truncate(card.question, 48)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {relativeToNow(card.next_review_at)}
                      </span>
                    </span>
                    {card.overdue ? <Badge tone="rose">Overdue</Badge> : <Badge tone="purple">Due</Badge>}
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/flashcards"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Open practice mode <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-navy">Quiz score trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your most recent attempts, oldest to newest
              </p>
            </div>
            <Badge tone="sage">{analytics.quizzes_completed} quizzes</Badge>
          </div>
          <QuizTrendChart data={analytics.score_trend} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-navy">Subject-wise progress</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                How far through each subject&apos;s material you are
              </p>
            </div>
            <Link
              href="/analytics"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <SubjectProgressBars
            data={subjectProgress.map((p) => ({ subject: p.subject, progress: p.progress, weak: p.weak }))}
          />
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
            <BookOpen className="w-3.5 h-3.5" /> Rule-based measurements from your stored data.
          </p>
        </Card>
      </div>
    </div>
  );
}
