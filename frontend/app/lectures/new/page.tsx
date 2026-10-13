"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  YoutubeIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  Upload,
  Info,
  Wand2,
  ListOrdered,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Field, { inputClass, selectClass, textareaClass } from "@/components/ui/Field";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/ui/Toast";
import {
  normalizeYouTubeUrl,
  parseYouTubeUrl,
  getWordCount,
  youtubeThumb,
} from "@/lib/utils";
import { SAMPLE_TRANSCRIPT, SAMPLE_TRANSCRIPT_MIN_WORDS } from "@/lib/mock-data";
import { api, ApiError, ApiLecture } from "@/lib/api";
import type { Difficulty } from "@/types";

type InputMode = "youtube" | "transcript";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const STAGES = [
  { key: "queued", label: "Queued" },
  { key: "processing", label: "Processing transcript" },
  { key: "generating", label: "Generating notes & cards" },
  { key: "validating", label: "Validating & building quiz" },
  { key: "ready", label: "Ready" },
];

function stageIndex(status: string): number {
  if (status === "ready") return STAGES.length;
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function AddLecturePage() {
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<InputMode>("youtube");
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [language, setLanguage] = useState("en");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [stageMessage, setStageMessage] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pollRef = useRef<number | null>(null);

  const youtubeId = useMemo(() => parseYouTubeUrl(url), [url]);
  const normalizedUrl = useMemo(() => normalizeYouTubeUrl(url), [url]);
  const wordCount = useMemo(() => getWordCount(transcript), [transcript]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (mode === "youtube") {
      if (!url.trim()) next.url = "Please paste a YouTube lecture URL.";
      else if (!youtubeId) next.url = "That doesn't look like a valid YouTube video URL.";
    } else if (wordCount === 0) {
      next.transcript = "Please paste a transcript or choose a .txt file.";
    } else if (wordCount < SAMPLE_TRANSCRIPT_MIN_WORDS) {
      next.transcript = `At least ${SAMPLE_TRANSCRIPT_MIN_WORDS} words are needed. This transcript has ${wordCount}.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      toast.push("Please choose a .txt file.", "error");
      e.target.value = "";
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setTranscript(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function stopPolling() {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function poll(lectureId: number) {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const lecture: ApiLecture = await api.getLecture(lectureId);
        setStatus(lecture.status);
        setStageMessage(lecture.stage_message);
        setProgress(lecture.progress);
        if (lecture.status === "ready") {
          stopPolling();
          toast.push("Study material is ready.", "success");
          router.push(`/lectures/${lectureId}`);
        } else if (lecture.status === "failed") {
          stopPolling();
          setGenerating(false);
          setFailure(lecture.error_message || "Processing failed. Try a different source.");
        }
      } catch (err) {
        stopPolling();
        setGenerating(false);
        setFailure(err instanceof ApiError ? err.message : "Lost connection to the server.");
      }
    }, 1500);
  }

  async function generate() {
    if (!validate()) {
      toast.push("Please fix the highlighted errors.", "error");
      return;
    }
    setGenerating(true);
    setFailure(null);
    setProgress(5);
    setStatus("queued");
    setStageMessage("Submitting…");

    try {
      const payload =
        mode === "youtube"
          ? { youtube_url: normalizedUrl ?? url.trim(), difficulty, language }
          : { transcript, difficulty, language };
      const lecture = await api.createLecture(payload);
      setStatus(lecture.status);
      setStageMessage(lecture.stage_message);
      setProgress(lecture.progress || 5);
      toast.push("Processing started — generating your study material.", "info");
      poll(lecture.id);
    } catch (err) {
      setGenerating(false);
      setFailure(err instanceof ApiError ? err.message : "Could not submit the lecture.");
    }
  }

  const activeStage = stageIndex(status);

  return (
    <div>
      <PageHeader
        eyebrow="Import"
        title="Add a lecture"
        description="Paste a YouTube lecture URL or a transcript. The backend retrieves the captions (or uses your transcript) and generates notes, flashcards and a quiz."
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Source */}
          <Card className="p-6">
            <h2 className="font-bold text-navy mb-4">1 · Choose a source</h2>
            <SegmentedControl
              value={mode}
              onChange={(v) => {
                setMode(v);
                setErrors({});
              }}
              options={[
                { value: "youtube", label: (<span className="inline-flex items-center gap-1.5"><YoutubeIcon className="w-4 h-4 text-rose-500" /> YouTube URL</span>) },
                { value: "transcript", label: (<span className="inline-flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" /> Transcript text</span>) },
              ]}
              ariaLabel="Input mode"
            />

            {mode === "youtube" ? (
              <div className="mt-5">
                <Field
                  label="YouTube lecture URL"
                  htmlFor="youtube-url"
                  hint="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  error={errors.url}
                >
                  <div className="relative">
                    <YoutubeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-rose-500" aria-hidden />
                    <input
                      id="youtube-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className={`${inputClass} pl-10`}
                      autoComplete="off"
                      disabled={generating}
                    />
                  </div>
                </Field>

                {normalizedUrl ? (
                  <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl bg-sage-soft border border-emerald-100 p-4">
                    {youtubeId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={youtubeThumb(youtubeId)}
                        alt="Video thumbnail preview"
                        className="w-full sm:w-44 h-24 object-cover rounded-lg border border-emerald-200"
                      />
                    ) : null}
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-navy">URL looks valid</p>
                      <p className="mt-1 leading-relaxed text-slate-500">
                        The backend will fetch the permitted captions for this video. If captions
                        are unavailable, you&apos;ll get a clear message and can upload a transcript
                        instead.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="txt-upload"
                    className="inline-flex items-center gap-2 h-11 px-4 rounded-[var(--radius-control)] bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:border-primary/40 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-primary" />
                    Choose a .txt file
                  </label>
                  <input
                    id="txt-upload"
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={handleFile}
                    disabled={generating}
                  />
                  <Button variant="secondary" size="sm" onClick={() => setTranscript(SAMPLE_TRANSCRIPT)} disabled={generating}>
                    <Wand2 className="w-4 h-4" /> Insert sample transcript
                  </Button>
                  {filename ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-sage-soft border border-emerald-100 rounded-full px-2.5 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {filename} loaded
                    </span>
                  ) : null}
                </div>

                <Field
                  label="Transcript text"
                  htmlFor="transcript"
                  error={errors.transcript}
                  hint={`Paste transcript text. ${wordCount} word${wordCount === 1 ? "" : "s"} — a minimum of ${SAMPLE_TRANSCRIPT_MIN_WORDS} words is required.`}
                >
                  <textarea
                    id="transcript"
                    rows={9}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste the full lecture transcript here, or upload a .txt file above…"
                    className={textareaClass}
                    disabled={generating}
                  />
                </Field>
              </div>
            )}
          </Card>

          {/* Options */}
          <Card className="p-6">
            <h2 className="font-bold text-navy mb-4">2 · Generation options</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Question difficulty" htmlFor="difficulty">
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className={selectClass}
                  disabled={generating}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Transcript language" htmlFor="language">
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={selectClass}
                  disabled={generating}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              The pipeline always produces topic notes, flashcards and a practice quiz.
            </p>
          </Card>

          {/* Generate */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              onClick={generate}
              loading={generating}
              className="w-full sm:w-auto"
              disabled={generating}
            >
              <Sparkles className="w-4.5 h-4.5" />
              Generate study material
            </Button>
            <p className="text-xs text-slate-400 inline-flex items-center gap-1.5">
              <Info className="w-4 h-4 shrink-0" />
              The backend retrieves the transcript and generates everything with the AI pipeline.
            </p>
          </div>

          {generating || failure ? (
            <Card className="p-6">
              <h3 className="font-bold text-navy mb-4">Processing status</h3>
              <ol className="space-y-3">
                {STAGES.map((stage, i) => {
                  const done = activeStage > i;
                  const active = activeStage === i && status !== "ready";
                  return (
                    <li key={stage.key} className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          done
                            ? "bg-emerald-100 text-emerald-700"
                            : active
                              ? "bg-lavender-soft text-primary"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <span className={`text-sm ${active ? "font-semibold text-navy" : "text-slate-500"}`}>
                        {stage.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-blue transition-all duration-500"
                  style={{ width: `${Math.max(progress, failure ? 100 : 5)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {failure ? "Could not finish processing." : stageMessage || "Working…"} · {progress}%
              </p>
              {failure ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5 text-sm text-rose-600" role="alert">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {failure}
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-lavender-soft to-sage-soft border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="w-4.5 h-4.5 text-primary" />
              <h3 className="font-bold text-navy">What happens next</h3>
            </div>
            <ol className="space-y-2.5 text-sm text-slate-600 list-none">
              {[
                "We validate your source and retrieve the transcript.",
                "The content is organised into topics.",
                "Notes, flashcards and a quiz are generated with explanations.",
                "Your lecture is saved to your account.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
