"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  NotebookPen,
  Search,
  Copy,
  Download,
  BookOpenCheck,
  Layers,
  ListChecks,
  Quote,
  Info,
  Lightbulb,
  GraduationCap,
  FileText,
  Clock,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { toLecture, toNoteSection } from "@/lib/adapters";
import { selectClass } from "@/components/ui/Field";
import { formatTimestamp } from "@/lib/utils";
import type { Lecture, NoteSection, Topic } from "@/types";

function topicMatches(topic: Topic, q: string): boolean {
  const hay = [
    topic.title,
    topic.summary,
    ...topic.keyPoints,
    ...topic.definitions.map((d) => `${d.term} ${d.definition}`),
    ...topic.examples,
    ...topic.examImportant,
    topic.sourceExcerpt ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function NotesPage() {
  const toast = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lectureId, setLectureId] = useState<string>("");
  const [notes, setNotes] = useState<NoteSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const topicRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadNotes = useCallback(
    async (id: string) => {
      setLoadingNotes(true);
      try {
        const [rawLecture, topics] = await Promise.all([
          api.getLecture(id),
          api.getNotes(id),
        ]);
        setNotes(toNoteSection(toLecture(rawLecture), topics));
      } catch {
        setNotes(null);
      } finally {
        setLoadingNotes(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await api.listLectures();
        const withNotes = rows.filter((l) => l.topic_count > 0).map(toLecture);
        if (cancelled) return;
        setLectures(withNotes);
        const initial = new URLSearchParams(window.location.search).get("lecture");
        const first =
          initial && withNotes.some((l) => l.id === initial) ? initial : withNotes[0]?.id ?? "";
        setLectureId(first);
        if (first) void loadNotes(first);
      } catch (err) {
        if (!cancelled) {
          toast.push(err instanceof ApiError ? err.message : "Could not load your notes.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadNotes, toast]);

  useEffect(() => {
    if (!lectureId || !notes) return;
    const topic = new URLSearchParams(window.location.search).get("topic");
    if (!topic) return;
    const id = window.setTimeout(() => {
      topicRefs.current[topic]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => window.clearTimeout(id);
  }, [lectureId, notes]);

  const lecture = lectures.find((l) => l.id === lectureId) ?? null;

  const q = query.trim().toLowerCase();
  const visibleTopics = useMemo(() => {
    if (!notes) return [];
    if (!q) return notes.topics;
    return notes.topics.filter((t) => topicMatches(t, q));
  }, [notes, q]);

  const totalMatches = useMemo(() => {
    if (!notes || !q) return null;
    const count = (t: Topic) =>
      [
        t.title,
        t.summary,
        ...t.keyPoints,
        ...t.definitions.map((d) => `${d.term} ${d.definition}`),
        ...t.examples,
        ...t.examImportant,
        t.sourceExcerpt ?? "",
      ].filter((s) => s.toLowerCase().includes(q)).length;
    return notes.topics.reduce((sum, t) => sum + count(t), 0);
  }, [notes, q]);

  function selectLecture(id: string) {
    setLectureId(id);
    setNotes(null);
    const url = new URL(window.location.href);
    url.searchParams.set("lecture", id);
    window.history.replaceState({}, "", url.toString());
    void loadNotes(id);
  }

  function handleCopy() {
    if (!lecture || !notes) return;
    const parts: string[] = [`${lecture.title} — Notes`, ""];
    parts.push(notes.overview);
    parts.push("");
    parts.push("KEY TAKEAWAYS");
    notes.takeaways.forEach((t) => parts.push(`- ${t}`));
    notes.topics.forEach((t) => {
      parts.push("", `## ${t.title}`, t.summary, "");
      parts.push("Key points:");
      t.keyPoints.forEach((k) => parts.push(`- ${k}`));
      if (t.definitions.length) {
        parts.push("Definitions:");
        t.definitions.forEach((d) => parts.push(`- ${d.term}: ${d.definition}`));
      }
      if (t.examImportant.length) {
        parts.push("Exam important:");
        t.examImportant.forEach((e) => parts.push(`- ${e}`));
      }
    });
    navigator.clipboard?.writeText(parts.join("\n")).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    toast.push("Notes copied to your clipboard.");
  }

  function handleDownload() {
    if (!lecture || !notes) return;
    const parts: string[] = [`${lecture.title}`, "", "AI-generated study notes", "", notes.overview, ""];
    notes.topics.forEach((t) => {
      parts.push(`### Topic ${t.order}: ${t.title}`);
      parts.push(t.summary, "");
      parts.push("Key points:");
      t.keyPoints.forEach((k) => parts.push(`- ${k}`));
      parts.push("");
      parts.push("Definitions:");
      t.definitions.forEach((d) => parts.push(`- ${d.term}: ${d.definition}`));
      parts.push("");
    });
    const blob = new Blob([parts.join("\n")], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${lecture.title.replace(/[^\w\d -]/g, "").replace(/\s+/g, "-").toLowerCase()}-notes.txt`;
    a.click();
    URL.revokeObjectURL(href);
    toast.push("Notes downloaded as a .txt file.");
  }

  function scrollToTopic(topicId: string) {
    topicRefs.current[topicId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeRef = (id: string) => (node: HTMLDivElement | null) => {
    topicRefs.current[id] = node;
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading notes…</div>;
  }

  if (lectures.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Add a lecture and let the backend generate its notes — they'll appear here."
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
        eyebrow="Notes"
        title="Study notes"
        description="Structured notes by topic, generated from the lecture transcript on the server."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!notes}>
              {copied ? <Info className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy notes"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!notes}>
              <Download className="w-4 h-4" /> Download .txt
            </Button>
          </>
        }
      />

      {/* Lecture selector */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label htmlFor="notes-lecture" className="text-sm font-semibold text-slate-700 shrink-0">
            Lecture
          </label>
          <select
            id="notes-lecture"
            value={lectureId}
            onChange={(e) => selectLecture(e.target.value)}
            className={`${selectClass} sm:max-w-md flex-1`}
          >
            {lectures.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} · {l.subject}
              </option>
            ))}
          </select>
          {lecture ? (
            <Link href={`/flashcards?lecture=${lecture.id}`} className="shrink-0">
              <Button variant="secondary" size="sm">
                <Layers className="w-4 h-4" /> Flashcards
              </Button>
            </Link>
          ) : null}
        </div>
      </Card>

      {loadingNotes || !lecture || !notes || notes.topics.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={loadingNotes ? "Loading notes…" : "No notes for this lecture"}
          description={
            loadingNotes
              ? "Fetching the generated notes from the server."
              : "This lecture has no generated notes yet. Try regenerating it."
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-[88px] self-start">
            <Card className="p-4 lg:p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Table of contents
              </p>
              <div className="relative mb-4">
                <label htmlFor="notes-search" className="sr-only">
                  Search within these notes
                </label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <input
                  id="notes-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes…"
                  className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-slate-200 bg-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow"
                />
                {totalMatches ? (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary">
                    {totalMatches}
                  </span>
                ) : null}
              </div>
              <nav className="space-y-1" aria-label="Topics">
                <button
                  onClick={() =>
                    document
                      .getElementById("notes-overview")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-lavender-soft hover:text-primary transition-colors cursor-pointer"
                >
                  Overview
                </button>
                {visibleTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => scrollToTopic(topic.id)}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-lavender-soft hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                      {topic.order}
                    </span>
                    <span className="truncate">{topic.title}</span>
                  </button>
                ))}
                {q && visibleTopics.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">No matching topics.</p>
                ) : null}
              </nav>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <Link href={`/flashcards?lecture=${lecture.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    <Layers className="w-4 h-4" /> Study flashcards
                  </Button>
                </Link>
                <Link href={`/quiz?lecture=${lecture.id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full">
                    <ListChecks className="w-4 h-4" /> Take quiz
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>

          {/* Notes body */}
          <div className="space-y-6 min-w-0">
            <Card className="p-6 sm:p-8" id="notes-overview">
              <div className="flex items-center gap-2 mb-4">
                <BookOpenCheck className="w-4.5 h-4.5 text-primary" />
                <h2 className="text-xl font-bold text-navy">Overview</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-[15px]">{notes.overview}</p>

              {notes.takeaways.length ? (
                <div className="mt-6 rounded-xl bg-sage-soft border border-emerald-100 p-4">
                  <p className="text-sm font-bold text-emerald-800 mb-2">Key takeaways</p>
                  <ul className="space-y-1.5">
                    {notes.takeaways.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Lightbulb className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>

            {visibleTopics.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matches in these notes"
                description={`Nothing in “${lecture.title}” matches “${query}”. Try a different search term.`}
              />
            ) : (
              visibleTopics.map((topic) => (
                <Card key={topic.id} className="p-6 sm:p-8 scroll-mt-24">
                  <div ref={activeRef(topic.id)} className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue text-white text-xs font-bold flex items-center justify-center">
                        {topic.order}
                      </span>
                      <h3 className="text-lg font-bold text-navy">{topic.title}</h3>
                      {topic.timestampSeconds ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                          {formatTimestamp(topic.timestampSeconds)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[15px] text-slate-600 leading-relaxed mt-2">{topic.summary}</p>

                    <div className="mt-5 grid gap-4">
                      {topic.keyPoints.length ? (
                        <div className="rounded-xl bg-white border border-slate-100 p-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                            Key points
                          </p>
                          <ul className="space-y-2">
                            {topic.keyPoints.map((kp, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                {kp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {topic.definitions.length ? (
                        <div className="rounded-xl bg-lavender-soft border border-primary/10 p-4">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                            Definitions
                          </p>
                          <dl className="space-y-2">
                            {topic.definitions.map((d, i) => (
                              <div key={i}>
                                <dt className="text-sm font-semibold text-navy">{d.term}</dt>
                                <dd className="text-sm text-slate-600 leading-relaxed">{d.definition}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ) : null}

                      {topic.examImportant.length ? (
                        <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-4">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">
                            <GraduationCap className="w-4 h-4" /> Exam-important
                          </p>
                          <ul className="space-y-2">
                            {topic.examImportant.map((ei, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                {ei}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Source references */}
            {notes.references.length ? (
              <Card className="p-6 sm:p-8">
                <h3 className="flex items-center gap-2 font-bold text-navy mb-4">
                  <Quote className="w-4.5 h-4.5 text-primary" /> Source references
                </h3>
                <div className="space-y-3">
                  {notes.references.map((ref, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-sm text-slate-600 italic leading-relaxed">“{ref.excerpt}”</p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-blue">
                        <Clock className="w-3.5 h-3.5" /> {formatTimestamp(ref.timestampSeconds) ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
