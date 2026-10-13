"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight,
  Library,
  Clock4,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  QuizTrendChart,
  SubjectProgressBars,
  TopicAccuracyChart,
  DifficultyChart,
} from "@/components/charts";
import { api, ApiError, type ApiAnalytics } from "@/lib/api";
import { toLecture } from "@/lib/adapters";
import { difficultyStyle } from "@/lib/theme";
import type { Difficulty, Lecture, SubjectProgress } from "@/types";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, rows] = await Promise.all([api.analytics(), api.listLectures()]);
        setAnalytics(a);
        setLectures(rows.map(toLecture));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load analytics.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const topicAccuracy = useMemo(
    () =>
      (analytics?.topic_accuracy ?? []).map((t) => ({
        topic: t.topic_title.length > 24 ? `${t.topic_title.slice(0, 24)}…` : t.topic_title,
        accuracy: Math.round(t.accuracy),
      })),
    [analytics]
  );

  const difficultyData = useMemo(
    () =>
      Object.entries(analytics?.difficulty_accuracy ?? {}).map(([key, v]) => ({
        name: difficultyStyle[key as Difficulty]?.label ?? key,
        accuracy: Math.round(v.accuracy),
      })),
    [analytics]
  );

  const weakTopics = useMemo(
    () => (analytics?.weak_topics ?? []).map((t) => ({ ...t, accuracy: Math.round(t.accuracy) })),
    [analytics]
  );
  const strongTopics = useMemo(
    () => topicAccuracy.filter((t) => t.accuracy >= 80),
    [topicAccuracy]
  );

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!analytics) return [];
    const out: Recommendation[] = [];
    if (analytics.due_today + analytics.overdue > 0) {
      out.push({
        id: "rec-due",
        title: `${analytics.due_today + analytics.overdue} card${
          analytics.due_today + analytics.overdue === 1 ? "" : "s"
        } due for revision`,
        description: "Spaced repetition works best when you show up. A quick session keeps the streak alive.",
        href: "/flashcards",
        cta: "Revise now",
      });
    }
    if (weakTopics.length > 0) {
      out.push({
        id: "rec-weak",
        title: `${weakTopics.slice(0, 3).map((t) => t.topic_title).join(" · ")} need more time`,
        description: "These topics score below your average — review the notes and retry their quiz.",
        href: "/notes",
        cta: "Review notes",
      });
    }
    if (analytics.recommended_topics.length > 0) {
      out.push({
        id: "rec-rec",
        title: "Suggested: " + analytics.recommended_topics.slice(0, 3).join(", "),
        description: "Based on your recent accuracy, these topics deserve another pass.",
        href: "/flashcards",
        cta: "Practice cards",
      });
    }
    if (analytics.quizzes_completed === 0 || analytics.average_quiz_score < 75) {
      out.push({
        id: "rec-quiz",
        title: "Sharpen accuracy with a short quiz",
        description:
          analytics.quizzes_completed === 0
            ? "Take your first practice quiz to unlock per-topic accuracy."
            : `Your average is ${Math.round(analytics.average_quiz_score)}% — a short session can test weak topics.`,
        href: "/quiz",
        cta: "Start a quiz",
      });
    }
    return out;
  }, [analytics, weakTopics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        Loading analytics…
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        {error ?? "Could not load analytics. Is the backend running?"}
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Progress"
        title="Analytics"
        description="Measured from your lectures, reviews and quiz attempts stored by the backend."
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lectures"
          value={analytics.total_lectures}
          icon={Library}
          tone="purple"
          hint={`${analytics.total_flashcards} cards generated`}
        />
        <StatCard
          label="Average quiz score"
          value={`${Math.round(analytics.average_quiz_score)}%`}
          icon={Target}
          tone="sage"
          hint={`${analytics.quizzes_completed} quizzes completed`}
        />
        <StatCard
          label="Flashcard reviews"
          value={analytics.total_reviews}
          icon={Layers}
          tone="blue"
          hint={`${analytics.due_today} due today`}
        />
        <StatCard
          label="Study streak"
          value={`${analytics.streak_days} days`}
          icon={Flame}
          tone="cyan"
          hint={analytics.overdue > 0 ? `${analytics.overdue} cards overdue` : "All caught up"}
        />
      </div>

      {/* Quiz trend + difficulty */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-primary" /> Quiz score trend
            </h2>
            <Badge tone={analytics.score_trend.length ? "sage" : "slate"}>
              {analytics.score_trend.length ? "real attempts" : "no attempts yet"}
            </Badge>
          </div>
          <QuizTrendChart data={analytics.score_trend} />
        </Card>
        <Card className="p-6">
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-primary" /> Accuracy by difficulty
          </h2>
          <DifficultyChart data={difficultyData} />
        </Card>
      </div>

      {/* Topic accuracy + strengths */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Target className="w-4.5 h-4.5 text-primary" /> Accuracy by topic
          </h2>
          <TopicAccuracyChart data={topicAccuracy} />
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-success" /> Strong topics
            </h3>
            {strongTopics.length ? (
              <ul className="space-y-2">
                {strongTopics.map((t) => (
                  <li key={t.topic} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{t.topic}</span>
                    <Badge tone="sage">{t.accuracy}%</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">
                Topics you answer at 80%+ across quizzes appear here.
              </p>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" /> Needs attention
            </h3>
            {weakTopics.length ? (
              <ul className="space-y-2">
                {weakTopics.map((t) => (
                  <li key={t.topic_title} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{t.topic_title}</span>
                    <Badge tone="rose">{t.accuracy}%</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">
                Topics scored under your target show up here once you have quiz data.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Subject progress + recommendations */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-navy flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-primary" /> Subject progress
            </h2>
            <Link href="/lectures">
              <Button variant="outline" size="sm">
                All lectures <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <SubjectProgressBars
            data={subjectProgress.map((s) => ({ subject: s.subject, progress: s.progress, weak: s.weak }))}
          />
          <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 leading-relaxed">
            <Clock4 className="w-3.5 h-3.5" /> Progress reflects how much material each lecture has generated.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-primary" /> Suggested next steps
          </h2>
          <div className="space-y-4">
            {recommendations.map((r) => (
              <Link
                key={r.id}
                href={r.href}
                className="block rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-primary/25 hover:bg-lavender-soft/40 transition-colors"
              >
                <p className="text-sm font-bold text-navy">{r.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  {r.cta} <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400">Nothing flagged right now — keep it up.</p>
            ) : null}
          </div>
          <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
            Suggestions are computed from your stored activity.
          </p>
        </Card>
      </div>
    </div>
  );
}
