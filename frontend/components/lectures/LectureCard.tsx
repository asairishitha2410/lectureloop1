import Link from "next/link";
import {
  NotebookPen,
  Layers,
  ListChecks,
  Clock,
  Play,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { Lecture } from "@/types";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import { subjectStyleFor } from "@/lib/theme";
import { formatDate, formatDuration } from "@/lib/utils";

interface LectureCardProps {
  lecture: Lecture;
  onDelete?: (lecture: Lecture) => void;
}

export default function LectureCard({ lecture, onDelete }: LectureCardProps) {
  const subject = subjectStyleFor(lecture.subject);

  return (
    <div className="group bg-white/80 backdrop-blur-xl rounded-[var(--radius-card)] border border-slate-200/60 shadow-[var(--shadow-card)] hover:border-primary/25 hover:shadow-primary/10 transition-all p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge className={subject.badge}>{lecture.subject}</Badge>
        {lecture.demo ? (
          <Badge tone="slate">Sample</Badge>
        ) : (
          <Badge tone="blue">Generated</Badge>
        )}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
          <Clock className="w-3.5 h-3.5" /> {formatDuration(lecture.durationSeconds)}
        </span>
      </div>

      <Link
        href={`/lectures/${lecture.id}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
      >
        <h3 className="font-bold text-navy text-[15px] leading-snug group-hover:text-primary transition-colors">
          {lecture.title}
        </h3>
      </Link>
      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
        {lecture.instructor} · added {formatDate(lecture.date)}
      </p>

      <div className="mt-4">
        <ProgressBar
          value={lecture.progress}
          showLabel
          label="Study progress"
          tone={lecture.progress >= 60 ? "default" : "danger"}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {lecture.materials.notes ? (
          <span className="inline-flex items-center gap-1.5">
            <NotebookPen className="w-3.5 h-3.5 text-primary" /> Notes
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue" /> {lecture.materials.flashcards} cards
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-emerald-600" /> {lecture.materials.quizQuestions} MCQs
        </span>
        <span className="inline-flex items-center gap-1.5 ml-auto">
          {lecture.source.type === "youtube" ? (
            <ExternalLink className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          {lecture.source.type === "youtube" ? "YouTube" : "Transcript"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-slate-100">
        <Link href={`/lectures/${lecture.id}`}>
          <Button variant="secondary" size="sm">
            <ExternalLink className="w-4 h-4" /> Open lecture
          </Button>
        </Link>
        <Link href={`/notes?lecture=${lecture.id}`}>
          <Button size="sm">
            <Play className="w-4 h-4" /> Continue learning
          </Button>
        </Link>
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-rose-500 hover:bg-rose-50"
            onClick={() => onDelete(lecture)}
            aria-label={`Delete ${lecture.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}