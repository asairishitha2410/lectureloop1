"""End-to-end lecture processing pipeline.

queued -> processing -> generating -> validating -> ready
Failure states: invalid_url, transcript_unavailable, processing_failed.

Designed to run inside a background task; it manages its own DB session so it
never holds a request-scoped session open.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import (
    Flashcard,
    Lecture,
    Question,
    Quiz,
    Topic,
    TranscriptSegment,
)
from . import llm, validation
from .segmenter import build_chunks
from .transcript import (
    TranscriptError,
    fetch_youtube_transcript,
    parse_user_transcript,
)

logger = logging.getLogger("lectureloop.pipeline")

_MAX_TOPICS = 14
_MAX_CARDS = 60
_MAX_MCQS = 24


def _set_status(db: Session, lecture: Lecture, status: str, message: str, progress: int):
    lecture.status = status
    lecture.stage_message = message
    lecture.progress = progress
    db.commit()


def run_pipeline(lecture_id: int) -> None:
    db = SessionLocal()
    try:
        lecture = db.get(Lecture, lecture_id)
        if lecture is None:
            return
        try:
            _process(db, lecture)
        except TranscriptError as exc:
            db.rollback()
            lecture = db.get(Lecture, lecture_id)
            lecture.status = "failed"
            lecture.error_code = exc.code
            lecture.error_message = exc.message
            lecture.stage_message = "Transcript unavailable"
            db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Pipeline failed for lecture %s", lecture_id)
            db.rollback()
            lecture = db.get(Lecture, lecture_id)
            lecture.status = "failed"
            lecture.error_code = "processing_failed"
            lecture.error_message = f"Unexpected error: {exc}"
            lecture.stage_message = "Processing failed"
            db.commit()
    finally:
        db.close()


def _ingest_segments(db: Session, lecture: Lecture) -> list[dict]:
    existing = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.lecture_id == lecture.id)
        .order_by(TranscriptSegment.seq)
    ).all()
    if existing:
        return [
            {
                "id": s.id,
                "text": s.text,
                "start_seconds": s.start_seconds,
                "end_seconds": s.end_seconds,
            }
            for s in existing
        ]

    # No stored segments yet; acquire transcript.
    if lecture.source == "upload" and lecture.pending_transcript:
        result = parse_user_transcript(lecture.pending_transcript)
        lecture.pending_transcript = None
    else:
        if not lecture.youtube_id:
            raise TranscriptError("invalid_url", "This lecture has no valid video id.")
        result = fetch_youtube_transcript(lecture.youtube_id)

    stored = []
    for i, seg in enumerate(result.segments):
        row = TranscriptSegment(
            lecture_id=lecture.id,
            seq=i,
            text=seg["text"],
            start_seconds=seg.get("start_seconds"),
            end_seconds=seg.get("end_seconds"),
        )
        db.add(row)
        stored.append(row)
    db.flush()
    if lecture.duration_seconds is None:
        ends = [s.end_seconds for s in stored if s.end_seconds]
        if ends:
            lecture.duration_seconds = int(max(ends))
    return [
        {
            "id": s.id,
            "text": s.text,
            "start_seconds": s.start_seconds,
            "end_seconds": s.end_seconds,
        }
        for s in stored
    ]


def _process(db: Session, lecture: Lecture) -> None:
    _set_status(db, lecture, "processing", "Validating and ingesting transcript…", 15)

    segments = _ingest_segments(db, lecture)
    if not segments:
        raise TranscriptError("empty_transcript", "No usable transcript text was found.")

    chunks = build_chunks(segments)
    _set_status(db, lecture, "processing", "Segmenting transcript…", 35)

    # --- Identify topics -------------------------------------------------
    _set_status(db, lecture, "generating", "Identifying topics and concepts…", 50)
    topic_payloads: list[dict] = []
    seen_titles: set[str] = set()
    for chunk in chunks:
        if len(topic_payloads) >= _MAX_TOPICS:
            break
        for t in llm.analyze_chunk(chunk.text, chunk.segment_ids, chunk.start_seconds, chunk.end_seconds):
            title = (t.get("title") or "Lecture topic").strip()
            key = title.lower()
            if key in seen_titles:
                continue
            seen_titles.add(key)
            topic_payloads.append(t)
            if len(topic_payloads) >= _MAX_TOPICS:
                break

    if not topic_payloads:
        raise TranscriptError("processing_failed", "The AI could not identify any topics.")

    # --- Persist topics --------------------------------------------------
    topic_rows: list[Topic] = []
    for i, payload in enumerate(topic_payloads):
        seg_ids = payload.get("segment_ids") or []
        start = payload.get("source_start_seconds")
        end = payload.get("source_end_seconds")
        row = Topic(
            lecture_id=lecture.id,
            title=payload.get("title", f"Topic {i + 1}")[:300],
            summary=(payload.get("summary") or "")[:2000],
            notes=payload.get("notes") or "",
            definitions=payload.get("definitions") or [],
            key_concepts=payload.get("key_concepts") or [],
            order_index=i,
            start_seconds=start,
            end_seconds=end,
        )
        db.add(row)
        topic_rows.append(row)
    db.flush()
    _set_status(db, lecture, "generating", "Generating notes and flashcards…", 65)

    # --- Flashcards ------------------------------------------------------
    def _source_for(topic: Topic) -> tuple[int | None, str, float | None]:
        # Find the first transcript segment within the topic's time span.
        candidates = [
            s for s in segments
            if topic.start_seconds is not None
            and s.get("start_seconds") is not None
            and s["start_seconds"] >= topic.start_seconds - 1
        ]
        seg = candidates[0] if candidates else (segments[0] if segments else None)
        if not seg:
            return None, "", None
        excerpt = (seg["text"] or "")[:400]
        return seg.get("id"), excerpt, seg.get("start_seconds")

    all_cards: list[dict] = []
    for topic in topic_rows:
        cards = validation.dedupe_flashcards(
            [c for c in llm.make_flashcards(_topic_dict(topic, segments)) ]
        )
        seg_id, excerpt, start = _source_for(topic)
        for c in cards:
            if len(all_cards) >= _MAX_CARDS:
                break
            db.add(
                Flashcard(
                    lecture_id=lecture.id,
                    topic_id=topic.id,
                    question=c["question"].strip(),
                    answer=c["answer"].strip(),
                    difficulty=c.get("difficulty", "medium"),
                    source_segment_id=seg_id,
                    source_excerpt=excerpt,
                    source_start_seconds=start,
                )
            )
            all_cards.append(c)
    db.flush()
    _set_status(db, lecture, "validating", "Validating and generating quiz…", 85)

    # --- MCQs ------------------------------------------------------------
    pool: list[str] = []
    for t in topic_rows:
        for d in (t.definitions or []):
            if d.get("definition"):
                pool.append(d["definition"])
    quiz = Quiz(lecture_id=lecture.id, title=f"{lecture.title[:200]} — Practice quiz")
    db.add(quiz)
    db.flush()

    mcq_count = 0
    for topic in topic_rows:
        mcqs = validation.validate_and_filter_mcqs(
            llm.make_mcqs(_topic_dict(topic, segments), pool)
        )
        for m in mcqs:
            if mcq_count >= _MAX_MCQS:
                break
            _, excerpt, start = _source_for(topic)
            db.add(
                Question(
                    quiz_id=quiz.id,
                    topic_id=topic.id,
                    question=m["question"].strip(),
                    options=m["options"],
                    correct_index=m["correct_index"],
                    explanation=m.get("explanation", ""),
                    difficulty=m.get("difficulty", "medium"),
                    source_excerpt=excerpt,
                    source_start_seconds=start,
                )
            )
            mcq_count += 1
    db.flush()

    if mcq_count == 0:
        # Keep a degenerate quiz out of the database.
        db.delete(quiz)

    _set_status(db, lecture, "ready", "Study material ready", 100)


def _topic_dict(topic: Topic, segments: list[dict]) -> dict:
    context = ""
    if topic.start_seconds is not None:
        relevant = [
            s["text"] for s in segments
            if s.get("start_seconds") is not None
            and topic.end_seconds is not None
            and topic.start_seconds - 1 <= s["start_seconds"] <= topic.end_seconds + 1
        ]
        context = " ".join(relevant)[:2000]
    return {
        "title": topic.title,
        "summary": topic.summary,
        "notes": topic.notes,
        "definitions": topic.definitions,
        "key_concepts": topic.key_concepts,
        "context": context,
    }
