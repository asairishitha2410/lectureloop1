"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Layers, PartyPopper, RotateCcw, SlidersHorizontal, Info } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FlashcardViewer from "@/components/flashcards/FlashcardViewer";
import { useToast } from "@/components/ui/Toast";
import { selectClass } from "@/components/ui/Field";
import { api, ApiError, type ApiFlashcard } from "@/lib/api";
import { toFlashcard, toLecture } from "@/lib/adapters";
import type { Flashcard, Lecture, Rating } from "@/types";
import type { BadgeTone } from "@/lib/theme";

function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function FlashcardsPage() {
  const toast = useToast();

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [rawCards, setRawCards] = useState<ApiFlashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [lectureFilter, setLectureFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [rated, setRated] = useState<Record<string, Rating>>({});
  const [nextDates, setNextDates] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const load = useCallback(async () => {
    try {
      const [lectureRows, cardRows] = await Promise.all([
        api.listLectures(),
        api.listFlashcards(),
      ]);
      const withCards = lectureRows.filter((l) => l.flashcard_count > 0).map(toLecture);
      setLectures(withCards);
      setRawCards(cardRows);

      const url = new URLSearchParams(window.location.search);
      const lectureInitial = url.get("lecture");
      const topicInitial = url.get("topic");
      if (lectureInitial && withCards.some((l) => l.id === lectureInitial)) {
        setLectureFilter(lectureInitial);
        if (topicInitial && cardRows.some((c) => String(c.topic_id) === topicInitial)) {
          setTopicFilter(topicInitial);
        }
      }
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not load flashcards.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const allCards = useMemo<Flashcard[]>(() => rawCards.map(toFlashcard), [rawCards]);

  const cards = useMemo(
    () =>
      allCards.filter((c) => {
        if (lectureFilter !== "all" && c.lectureId !== lectureFilter) return false;
        if (topicFilter !== "all" && c.topicId !== topicFilter) return false;
        return true;
      }),
    [allCards, lectureFilter, topicFilter]
  );

  const topics = useMemo(() => {
    const map = new Map<string, string>();
    rawCards.forEach((c) => {
      if (lectureFilter !== "all" && String(c.lecture_id) !== lectureFilter) return;
      if (c.topic_id != null) map.set(String(c.topic_id), c.topic_title ?? `Topic ${c.topic_id}`);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [rawCards, lectureFilter]);

  useEffect(() => {
    setOrder(cards.map((c) => c.id));
    setIndex(0);
    setRated({});
    setFinished(false);
  }, [cards]);

  const deck = useMemo(
    () => order.map((id) => allCards.find((c) => c.id === id)).filter(Boolean) as Flashcard[],
    [order, allCards]
  );

  const current = deck[index] ?? null;
  const canPrev = index > 0;
  const canNext = index < deck.length - 1;
  const currentKey = current ? `${current.id}-${lectureFilter}-${topicFilter}` : "none";

  function lectureTitle(card: Flashcard): string | undefined {
    return lectures.find((l) => l.id === card.lectureId)?.title ?? undefined;
  }

  function topicTitle(card: Flashcard): string | undefined {
    const raw = rawCards.find((c) => String(c.id) === card.id);
    return raw?.topic_title ?? undefined;
  }

  function formatDays(iso: string): string {
    const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
    return days <= 0 ? "due today" : `due in ~${days} day${days === 1 ? "" : "s"}`;
  }

  async function handleRate(rating: Rating) {
    if (!current) return;
    try {
      const review = await api.reviewFlashcard(current.id, rating);
      setNextDates((prev) => ({ ...prev, [current.id]: review.next_review_at }));
      setRated((prev) => ({ ...prev, [current.id]: rating }));
      toast.push(`“${rating}” recorded — ${formatDays(review.next_review_at)}.`, "info");
      if (index < deck.length - 1) setIndex((i) => i + 1);
      else setFinished(true);
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not save your review.", "error");
    }
  }

  async function toggleMastered() {
    if (!current) return;
    try {
      const updated = await api.toggleBookmark(current.id);
      setRawCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.push(updated.bookmarked ? "Card bookmarked." : "Bookmark removed.", "info");
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not update the card.", "error");
    }
  }

  function handleShuffle() {
    setOrder((prev) => shuffleArray(prev));
    setIndex(0);
    setFinished(false);
    toast.push("Deck shuffled.", "info");
  }

  const masteredCount = deck.filter((c) => c.bookmarked).length;
  const sessionRated = Object.keys(rated).length;

  const filterSummary = [
    lectureFilter !== "all" ? lectures.find((l) => l.id === lectureFilter)?.title : null,
    topicFilter !== "all" ? topics.find((t) => t.id === topicFilter)?.title : null,
  ].filter(Boolean);

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading flashcards…</div>;
  }

  if (allCards.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No flashcards yet"
        description="Add a lecture and let the backend generate its flashcards — they'll appear here."
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
        eyebrow="Spaced repetition"
        title="Flashcards"
        description="Reveal the answer, rate your recall, and let the scheduler decide when each card comes back."
      />

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center flex-wrap">
          <label htmlFor="flashcard-lecture" className="sr-only">
            Filter by lecture
          </label>
          <select
            id="flashcard-lecture"
            value={lectureFilter}
            onChange={(e) => {
              setLectureFilter(e.target.value);
              setTopicFilter("all");
            }}
            className={`${selectClass} lg:w-64`}
          >
            <option value="all">All lectures</option>
            {lectures.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <label htmlFor="flashcard-topic" className="sr-only">
            Filter by topic
          </label>
          <select
            id="flashcard-topic"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className={`${selectClass} lg:w-56`}
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 lg:ml-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" aria-hidden />
            <span className="text-sm font-medium text-slate-600">
              {deck.length} card{deck.length === 1 ? "" : "s"} in session
            </span>
            <Badge tone={masteredCount > 0 ? "sage" : "slate"}>{masteredCount} bookmarked</Badge>
          </div>
        </div>
      </Card>

      {deck.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No cards match these filters"
          description="Try a different lecture or topic filter."
        />
      ) : finished ? (
        <Card className="p-10 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <PartyPopper className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-navy">Session complete!</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            You reviewed {sessionRated} of {deck.length} cards. The scheduler saved each result and
            will surface these cards again when they&apos;re due.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto">
            {(["again", "hard", "good", "easy"] as Rating[]).map((r) => {
              const count = Object.values(rated).filter((x) => x === r).length;
              const tone: BadgeTone =
                r === "again" ? "rose" : r === "hard" ? "amber" : r === "good" ? "purple" : "sage";
              return (
                <div key={r} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-xl font-extrabold text-navy">{count}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{r}</p>
                  <Badge tone={tone} className="mt-1">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setOrder(deck.map((c) => c.id));
                setIndex(0);
                setRated({});
                setFinished(false);
              }}
            >
              <RotateCcw className="w-4 h-4" /> Review this deck again
            </Button>
            <Button onClick={handleShuffle}>
              <RotateCcw className="w-4 h-4" /> Shuffle &amp; restart
            </Button>
          </div>
        </Card>
      ) : (
        <div className="max-w-3xl mx-auto">
          <FlashcardViewer
            key={currentKey}
            card={current}
            index={index}
            total={deck.length}
            lectureTitle={current ? lectureTitle(current) : undefined}
            topicFilter={current ? topicTitle(current) : undefined}
            mastered={current ? Boolean(current.bookmarked) : false}
            onRate={handleRate}
            onToggleMastered={toggleMastered}
            onPrev={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={() => setIndex((i) => Math.min(deck.length - 1, i + 1))}
            canPrev={canPrev}
            canNext={canNext}
            onShuffle={handleShuffle}
          />

          <p className="mt-4 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            Filters: {filterSummary.length ? filterSummary.join(" · ") : "all cards"}.
            {current && nextDates[current.id]
              ? ` This card is next due ${formatDays(nextDates[current.id])}.`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
