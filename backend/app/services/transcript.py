"""Transcript acquisition: URL validation, permitted metadata, and caption
retrieval (best-effort) plus parsing of user-provided transcripts.

We never assume a video can be downloaded or transcribed. We first try
authorised captions; if unavailable we surface a clear error so the UI can
offer transcript upload instead.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

import httpx

from ..config import settings

_URL_PATTERNS = [
    re.compile(r"(?:youtube\.com/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtu\.be/)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtube\.com/embed/)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtube\.com/shorts/)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtube\.com/live/)([A-Za-z0-9_-]{11})"),
]

_TIMESTAMP_RE = re.compile(
    r"^\s*[\[\(]?\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.\d+)?\s*[\]\)]?\s*[-–]?\s*(.*)$"
)


@dataclass
class TranscriptResult:
    segments: list[dict] = field(default_factory=list)  # {text, start_seconds, end_seconds}


class TranscriptError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def extract_video_id(url: str) -> str | None:
    if not url:
        return None
    for pattern in _URL_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    # Bare 11-char id
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url.strip()):
        return url.strip()
    return None


def validate_url(url: str) -> str:
    video_id = extract_video_id(url)
    if not video_id:
        raise TranscriptError(
            "invalid_url",
            "That does not look like a supported YouTube URL. "
            "Paste a youtube.com/watch, youtu.be, or /shorts link.",
        )
    return video_id


def fetch_metadata(url: str) -> dict:
    """Fetch permitted metadata via the public oEmbed endpoint."""
    meta: dict = {}
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                "https://www.youtube.com/oembed",
                params={"url": url, "format": "json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                meta = {
                    "title": data.get("title"),
                    "channel": data.get("author_name"),
                    "thumbnail_url": data.get("thumbnail_url"),
                }
    except httpx.HTTPError:
        pass
    return meta


def fetch_youtube_transcript(video_id: str) -> TranscriptResult:
    if not settings.enable_youtube_captions:
        raise TranscriptError(
            "captions_disabled", "Caption retrieval is disabled on this server."
        )
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        raise TranscriptError(
            "captions_unavailable",
            "Caption support is not installed. Upload a transcript instead.",
        )

    raw = None
    try:
        try:
            api = YouTubeTranscriptApi()
            fetched = api.fetch(video_id)
            raw = [
                {"text": s.text, "start": s.start, "duration": s.duration}
                for s in fetched
            ]
        except AttributeError:
            raw = YouTubeTranscriptApi.get_transcript(video_id)
    except Exception as exc:  # noqa: BLE001 - upstream raises many types
        raise TranscriptError(
            "transcript_unavailable",
            "No accessible captions were found for this video. "
            "You can upload a transcript file instead.",
        ) from exc

    if not raw:
        raise TranscriptError(
            "transcript_unavailable",
            "The caption track for this video is empty. Upload a transcript instead.",
        )

    segments = []
    for item in raw:
        text = (item.get("text") or "").replace("\n", " ").strip()
        if not text:
            continue
        start = float(item.get("start", 0) or 0)
        duration = float(item.get("duration", 0) or 0)
        segments.append(
            {"text": text, "start_seconds": start, "end_seconds": start + duration}
        )
    if not segments:
        raise TranscriptError("transcript_unavailable", "Transcript had no usable text.")
    return TranscriptResult(segments=segments)


def _parse_timestamp(h: str | None, m: str, s: str) -> float:
    hours = int(h) if h else 0
    return hours * 3600 + int(m) * 60 + int(s)


def parse_user_transcript(text: str) -> TranscriptResult:
    """Parse a pasted/uploaded transcript.

    Supports timestamped lines (``00:12 Some text`` / ``[1:02:03] ...``)
    and plain prose (chunked by paragraph, without timestamps).
    """
    text = (text or "").strip()
    if not text:
        raise TranscriptError("empty_transcript", "The transcript is empty.")

    lines = text.splitlines()
    segments: list[dict] = []
    current_start: float | None = None

    for line in lines:
        if not line.strip():
            continue
        match = _TIMESTAMP_RE.match(line)
        if match:
            h, m, s, content = match.groups()
            current_start = _parse_timestamp(h, m, s)
            if content.strip():
                segments.append(
                    {"text": content.strip(), "start_seconds": current_start, "end_seconds": None}
                )
        else:
            if segments and current_start is not None and segments[-1]["end_seconds"] is None:
                segments[-1]["text"] += " " + line.strip()
            else:
                segments.append(
                    {"text": line.strip(), "start_seconds": None, "end_seconds": None}
                )

    if not segments:
        # Fall back to paragraph chunking for prose without timestamps.
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        segments = [
            {"text": p, "start_seconds": None, "end_seconds": None} for p in paragraphs
        ]

    # Close open end times using the next segment's start where possible.
    for i, seg in enumerate(segments):
        if seg["end_seconds"] is None:
            nxt = segments[i + 1]["start_seconds"] if i + 1 < len(segments) else None
            seg["end_seconds"] = nxt

    return TranscriptResult(segments=segments)
