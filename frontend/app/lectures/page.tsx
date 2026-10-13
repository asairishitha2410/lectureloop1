"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Library, LayoutGrid, Rows3, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LectureCard from "@/components/lectures/LectureCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { toLecture } from "@/lib/adapters";
import { selectClass } from "@/components/ui/Field";
import type { Lecture, Subject } from "@/types";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "in-progress" | "not-started" | "completed";

function statusOf(lecture: Lecture): StatusFilter {
  if (lecture.progress >= 100) return "completed";
  if (lecture.progress > 0) return "in-progress";
  return "not-started";
}

export default function LecturesPage() {
  const toast = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<"all" | Subject>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [pendingDelete, setPendingDelete] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = await api.listLectures();
      setLectures(rows.map(toLecture));
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not load lectures.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const subjects = useMemo(
    () => Array.from(new Set(lectures.map((l) => l.subject))).sort(),
    [lectures]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lectures.filter((l) => {
      const matchesQuery =
        !q || l.title.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q);
      const matchesSubject = subject === "all" || l.subject === subject;
      const matchesStatus = status === "all" || statusOf(l) === status;
      return matchesQuery && matchesSubject && matchesStatus;
    });
  }, [lectures, query, subject, status]);

  const counts = useMemo(() => {
    return {
      inProgress: lectures.filter((l) => statusOf(l) === "in-progress").length,
      notStarted: lectures.filter((l) => statusOf(l) === "not-started").length,
      completed: lectures.filter((l) => statusOf(l) === "completed").length,
    };
  }, [lectures]);

  async function handleDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.deleteLecture(target.id);
      setLectures((prev) => prev.filter((l) => l.id !== target.id));
      toast.push(`“${target.title}” was removed from your library.`);
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not delete the lecture.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="My Lectures"
        description="Every lecture you added — study progress and the materials available for each."
        actions={
          <Link href="/lectures/new">
            <Button>
              <Plus className="w-4.5 h-4.5" /> Add lecture
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <label htmlFor="lecture-search" className="sr-only">
              Search lectures
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
            <input
              id="lecture-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or subject…"
              className="w-full h-11 pl-9 pr-3 rounded-[var(--radius-control)] border border-slate-200 bg-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <label htmlFor="filter-subject" className="sr-only">
              Filter by subject
            </label>
            <select
              id="filter-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as "all" | Subject)}
              className={`${selectClass} lg:w-48`}
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label htmlFor="filter-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className={`${selectClass} lg:w-44`}
            >
              <option value="all">All statuses</option>
              <option value="in-progress">In progress ({counts.inProgress})</option>
              <option value="not-started">Not started ({counts.notStarted})</option>
              <option value="completed">Completed ({counts.completed})</option>
            </select>
            <div className="inline-flex items-center gap-1 p-1 rounded-[var(--radius-control)] bg-slate-100 border border-slate-200">
              <button
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                className={`h-8 w-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  view === "grid" ? "bg-white shadow-sm text-primary" : "text-slate-400"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={`h-8 w-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  view === "list" ? "bg-white shadow-sm text-primary" : "text-slate-400"
                }`}
                aria-label="List view"
              >
                <Rows3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-sm text-slate-400">Loading lectures…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Library}
          title={lectures.length === 0 ? "Your library is empty" : "No lectures found"}
          description={
            lectures.length === 0
              ? "Add your first lecture to start generating study material."
              : "Nothing matches the current search and filters. Try clearing them."
          }
          action={
            <Link href="/lectures/new">
              <Button>
                <Plus className="w-4.5 h-4.5" /> Add lecture
              </Button>
            </Link>
          }
        />
      ) : (
        <div className={view === "grid" ? "grid md:grid-cols-2 gap-4" : "space-y-4"}>
          {filtered.map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 ? (
        <p className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
          <Badge tone="slate">{filtered.length}</Badge> lecture{filtered.length === 1 ? "" : "s"} shown
        </p>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this lecture?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” and all of its generated notes, flashcards and quiz attempts will be permanently deleted.`
            : undefined
        }
        confirmLabel={<span className="inline-flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete</span>}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
