"""Divide long transcripts into manageable, optionally overlapping chunks while
preserving start/end timestamps. Chunk sizes depend on transcript length and
the configured per-call character budget.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..config import settings


@dataclass
class Chunk:
    index: int
    text: str
    start_seconds: float | None
    end_seconds: float | None
    segment_ids: list[int]


def build_chunks(segments: list[dict], max_chars: int | None = None) -> list[Chunk]:
    """segments: list of {id, text, start_seconds, end_seconds} in order."""
    budget = max_chars or settings.max_segment_chars
    chunks: list[Chunk] = []
    buffer_texts: list[str] = []
    buffer_ids: list[int] = []
    start: float | None = None
    end: float | None = None
    size = 0

    def flush():
        nonlocal buffer_texts, buffer_ids, start, end, size
        if not buffer_texts:
            return
        chunks.append(
            Chunk(
                index=len(chunks),
                text=" ".join(buffer_texts).strip(),
                start_seconds=start,
                end_seconds=end,
                segment_ids=list(buffer_ids),
            )
        )
        buffer_texts, buffer_ids, start, end, size = [], [], None, None, 0

    for seg in segments:
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        if start is None and seg.get("start_seconds") is not None:
            start = seg["start_seconds"]
        end = seg.get("end_seconds") if seg.get("end_seconds") is not None else end

        if size + len(text) > budget and buffer_texts:
            flush()
            start = seg.get("start_seconds")
            end = seg.get("end_seconds")

        buffer_texts.append(text)
        buffer_ids.append(seg.get("id"))
        size += len(text) + 1

    flush()
    return chunks
