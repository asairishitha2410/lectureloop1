"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  NotebookPen,
  Layers,
  ListChecks,
  Clock,
  Calendar,
  YoutubeIcon,
  FileText,
  RefreshCw,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError, type ApiTopic } from "@/lib/api";
import { toLecture } from "@/lib/adapters";
import { subjectStyleFor } from "@/lib/theme";
import { formatDate, formatDuration, formatTimestamp } from "@/lib/utils";
import type { Lecture } from "@/types";

export default function LectureDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [topics, setTopics] = useState<ApiTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadNotes = useCallback(async (id: string) => {
    try {
      setTopics(await api.getNotes(id));
    } catch {
      setTopics([]);
    }
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        const raw = await api.getLecture(params.id);
        const adapted = toLecture(raw);
        setLecture(adapted);
        setError(null);
        if (raw.status === "ready") {
          stopPolling();
          await loadNotes(params.id);
        } else if (raw.status !== "failed") {
          // Keep polling while the pipeline runs.
          if (pollRef.current === null) {
            pollRef.current = window.setInterval(() => void load({ silent: true }), 2000);
          }
        } else {
          stopPolling();
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setLecture(null);
          setError("notfound");
        } else {
          setError(err instanceof ApiError ? err.message : "Could not load this lecture.");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [params.id, loadNotes, stopPolling]
  );

  useEffect(() => {
    void load();
    return () => stopPolling();
  }, [load, stopPolling]);

  const takeaways = useMemo(() => {
    const list = topics.flatMap((t) => t.key_concepts).slice(0, 6);
    if (list.length) return list;
    return topics.slice(0, 3).map((t) => t.summary).filter(Boolean);
  }, [topics]);

  async function regenerate() {
    if (!lecture) return;
    setRegenerating(true);
    try {
      await api.regenerateLecture(lecture.id);
      toast.push("Regeneration started — this may take a moment.", "info");
      setTopics([]);
      await load();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not start regeneration.", "error");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading lecture…</div>;
  }

  if (error === "notfound" || lecture === null) {
    return (
      <Card className="p-10 text-center">
        <h1 className="font-bold text-navy text-lg">Lecture not found</h1>
        <p className="text-sm text-slate-500 mt-1">
          It may have been deleted, or it belongs to another account.
        </p>
        <Link href="/lectures" className="inline-block mt-5">
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4" /> Back to My Lectures
          </Button>
        </Link>
      </Card>
    );
  }

  const subject = subjectStyleFor(lecture.subject);
  const isProcessing = lecture.status === "processing";
  const isFailed = lecture.status === "failed";

  return (
    <div>
      <Link
        href="/lectures"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Lectures
      </Link>

      <PageHeader
        eyebrow="Lecture workspace"
        title={lecture.title}
        description={lecture.description}
        actions={
          <>
            {isProcessing ? (
              <Badge tone="blue">
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                </span>
              </Badge>
            ) : isFailed ? (
              <Badge tone="rose">Failed</Badge>
            ) : (
              <Badge tone="sage">Ready</Badge>
            )}
            <Button variant="outline" onClick={regenerate} loading={regenerating}>
              {!regenerating ? <RefreshCw className="w-4 h-4" /> : null} Regenerate
            </Button>
          </>
        }
      />

      {isFailed ? (
        <Card className="p-5 mb-6 border-rose-100 bg-rose-50">
          <p className="flex items-start gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            {lecture.title && "Generation did not finish. "}
            Try regenerating, or add a different lecture with an available transcript.
          </p>
        </Card>
      ) : null}

      {error && error !== "notfound" ? (
        <Card className="p-5 mb-6 border-amber-100 bg-amber-50">
          <p className="text-sm text-amber-700">{error}</p>
        </Card>
      ) : null}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className={subject.badge}>{lecture.subject}</Badge>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" /> {formatDuration(lecture.durationSeconds)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" /> Added {formatDate(lecture.date)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
                {lecture.instructor}
              </span>
            </div>

            <h3 className="font-bold text-navy mb-3">Study overview</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {topics[0]?.summary ?? lecture.description}
            </p>

            {takeaways.length > 0 ? (
              <div className="mt-5 rounded-xl bg-lavender-soft border border-primary/10 p-4">
                <p className="text-sm font-semibold text-primary mb-1.5">Key takeaways</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {takeaways.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          {topics.length > 0 ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy">Topics ({topics.length})</h3>
                <Link
                  href={`/notes?lecture=${lecture.id}`}
                  className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read full notes <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 hover:border-primary/25 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <p className="font-semibold text-navy text-sm">{topic.title}</p>
                      {topic.start_seconds ? (
                        <span className="ml-auto text-[11px] font-mono text-slate-400">
                          {formatTimestamp(topic.start_seconds)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">{topic.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : isProcessing ? (
            <Card className="p-6 text-sm text-slate-500">
              Topics will appear here once generation completes.
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-navy mb-4">Available material</h3>
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="rounded-xl bg-lavender-soft border border-primary/10 p-3">
                <NotebookPen className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
                <p className="text-lg font-extrabold text-navy">{topics.length}</p>
                <p className="text-[10px] text-slate-500">topics</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                <Layers className="w-4.5 h-4.5 text-blue mx-auto mb-1" />
                <p className="text-lg font-extrabold text-navy">{lecture.materials.flashcards}</p>
                <p className="text-[10px] text-slate-500">cards</p>
              </div>
              <div className="rounded-xl bg-sage-soft border border-emerald-100 p-3">
                <ListChecks className="w-4.5 h-4.5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-navy">{lecture.materials.quizQuestions}</p>
                <p className="text-[10px] text-slate-500">MCQs</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { href: `/notes?lecture=${lecture.id}`, icon: NotebookPen, label: "Study the notes", enabled: topics.length > 0 },
                { href: `/flashcards?lecture=${lecture.id}`, icon: Layers, label: "Review flashcards", enabled: lecture.materials.flashcards > 0 },
                { href: `/quiz?lecture=${lecture.id}`, icon: ListChecks, label: "Take the quiz", enabled: lecture.materials.quizQuestions > 0 },
              ].map((action) =>
                action.enabled ? (
                  <Link key={action.label} href={action.href} className="block">
                    <Button variant="outline" className="w-full">
                      <action.icon className="w-4 h-4 text-primary" /> {action.label}
                    </Button>
                  </Link>
                ) : null
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-navy mb-3">Source</h3>
            {lecture.source.type === "youtube" && lecture.source.url ? (
              <div className="rounded-xl bg-white border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold mb-1.5">
                  <YoutubeIcon className="w-4 h-4" /> YouTube lecture
                </div>
                <p className="text-xs text-slate-500 break-all leading-relaxed">{lecture.source.url}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold mb-1.5">
                  <FileText className="w-4 h-4" /> Uploaded transcript
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lecture.source.transcriptPreview}
                </p>
              </div>
            )}
            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              Progress ({lecture.progress}%) reflects how much of this lecture’s material has been generated.
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-lavender-soft to-sage-soft border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
              <h3 className="font-bold text-navy">Continue</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lecture.materials.flashcards === 0
                ? "No material yet — regenerate once the source has an available transcript."
                : "Skim the notes, drill the flashcards, then finish with a quiz pass."}
            </p>
            {topics.length > 0 ? (
              <Link href={`/notes?lecture=${lecture.id}`} className="block mt-3">
                <Button size="sm" className="w-full">
                  Continue learning
                </Button>
              </Link>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
