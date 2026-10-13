"""LLM integration with a deterministic offline fallback.

If ``LLM_API_KEY`` is configured we call an OpenAI-compatible chat completions
endpoint and ask for structured JSON. Otherwise we synthesise structured study
material locally so the whole pipeline runs without any external dependency.
The offline path is deliberately simple and deterministic so it is testable.
"""
from __future__ import annotations

import json
import re
from collections import Counter

import httpx

from ..config import settings

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "of", "to", "in",
    "on", "for", "with", "as", "by", "at", "from", "is", "are", "was", "were",
    "be", "been", "being", "it", "its", "this", "that", "these", "those", "we",
    "you", "they", "he", "she", "i", "so", "not", "no", "yes", "can", "could",
    "will", "would", "should", "may", "might", "must", "do", "does", "did",
    "have", "has", "had", "there", "here", "when", "where", "which", "who",
    "what", "why", "how", "all", "any", "each", "some", "such", "than", "too",
    "very", "just", "about", "into", "over", "after", "before", "between",
    "also", "like", "one", "two", "three", "using", "use", "used", "because",
    "them", "their", "our", "your", "his", "her", "out", "up", "down", "more",
    "most", "other", "only", "well", "example", "examples", "thing", "things",
    "basically", "actually", "okay", "right", "now", "get", "got", "see",
}

_DIFFICULTIES = ["easy", "medium", "hard"]


# --------------------------------------------------------------------- helpers
def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 25]


def _keywords(text: str, top: int = 8) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z\-]{2,}", text.lower())
    counts = Counter(w for w in words if w not in _STOPWORDS)
    return [w for w, _ in counts.most_common(top)]


def _title_case(term: str) -> str:
    return " ".join(w.capitalize() for w in term.split())


def _clip(text: str, limit: int = 240) -> str:
    text = text.strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _safe_json(raw: str):
    if not raw:
        return None
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned, flags=re.MULTILINE).strip()
    for opener, closer in (("{", "}"), ("[", "]")):
        start = cleaned.find(opener)
        end = cleaned.rfind(closer)
        if start != -1 and end != -1 and end > start:
            candidate = cleaned[start : end + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                continue
    return None


def _chat(system: str, user: str) -> str:
    resp = httpx.post(
        f"{settings.llm_base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {settings.llm_api_key}"},
        json={
            "model": settings.llm_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        timeout=90,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _definitions(sentences: list[str]) -> list[dict]:
    defs = []
    pattern = re.compile(
        r"^(.{2,60}?)\s+(?:is|are|refers to|means|is defined as|is called)\s+(.{15,})",
        re.IGNORECASE,
    )
    for s in sentences:
        m = pattern.match(s)
        if m:
            term = m.group(1).strip(" ,.;:").strip()
            if 1 < len(term.split()) <= 6:
                defs.append({"term": _title_case(term), "definition": _clip(s, 300)})
    # de-duplicate by term
    seen, unique = set(), []
    for d in defs:
        key = d["term"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(d)
    return unique[:6]


# ---------------------------------------------------------------- offline path
def _offline_topics(text: str, chunk_start, chunk_end, segment_ids) -> list[dict]:
    sentences = _sentences(text)
    if not sentences:
        sentences = [text.strip()] if text.strip() else []
    if not sentences:
        return []

    kws = _keywords(text, top=6)
    title = _title_case(" ".join(kws[:2])) if len(kws) >= 2 else "Lecture segment"
    summary = _clip(" ".join(sentences[:2]), 320)

    notes_lines = [f"- {_clip(s, 200)}" for s in sentences[:8]]
    defs = _definitions(sentences)

    return [
        {
            "title": title,
            "summary": summary,
            "notes": "\n".join(notes_lines),
            "definitions": defs,
            "key_concepts": [_title_case(k) for k in kws[:6]],
            "source_start_seconds": chunk_start,
            "source_end_seconds": chunk_end,
            "segment_ids": segment_ids,
        }
    ]


def _offline_cards(topic: dict) -> list[dict]:
    cards: list[dict] = []
    defs = topic.get("definitions") or []
    for d in defs[:3]:
        cards.append(
            {
                "question": f"What is {d['term']}?",
                "answer": d["definition"],
                "difficulty": "easy" if len(d["definition"]) < 140 else "medium",
            }
        )
    summary = topic.get("summary") or ""
    if summary:
        cards.append(
            {
                "question": f"Summarise the key idea of “{topic['title']}”.",
                "answer": summary,
                "difficulty": "medium",
            }
        )
    for concept in (topic.get("key_concepts") or [])[:2]:
        cards.append(
            {
                "question": f"Why is {concept} important in this lecture?",
                "answer": _clip(
                    f"{concept} is a recurring idea within {topic['title']}. "
                    + (topic.get("summary") or ""),
                    300,
                ),
                "difficulty": "hard",
            }
        )
    return cards


def _offline_mcqs(topic: dict, distractor_pool: list[str]) -> list[dict]:
    mcqs: list[dict] = []
    defs = topic.get("definitions") or []
    pool = [p for p in distractor_pool if p]

    for d in defs[:2]:
        correct = d["definition"]
        distractors = [p for p in pool if p != correct][:3]
        if len(distractors) < 3:
            continue
        options = [correct, *distractors]
        # Deterministic rotation so the correct answer is not always first.
        shift = len(d["term"]) % 4
        options = options[shift:] + options[:shift]
        mcqs.append(
            {
                "question": f"Which statement best describes {d['term']}?",
                "options": [_clip(o, 180) for o in options],
                "correct_index": options.index(correct),
                "explanation": f"According to the lecture: {_clip(correct, 200)}",
                "difficulty": "medium",
            }
        )

    concepts = topic.get("key_concepts") or []
    if concepts and len(pool) >= 3:
        target = concepts[0]
        correct = topic.get("summary") or f"{target} is central to {topic['title']}."
        distractors = [p for p in pool if p != correct][:3]
        if len(distractors) == 3:
            options = [correct, *distractors]
            shift = len(target) % 4
            options = options[shift:] + options[:shift]
            mcqs.append(
                {
                    "question": f"What best captures the role of {target}?",
                    "options": [_clip(o, 180) for o in options],
                    "correct_index": options.index(correct),
                    "explanation": f"The lecture links {target} to {topic['title']}.",
                    "difficulty": "hard",
                }
            )
    return mcqs


# ------------------------------------------------------------------- public API
_SYS_TOPICS = (
    "You are an expert instructional designer. Given a transcript chunk from an "
    "educational lecture, return JSON: {\"topics\":[{\"title\":str,\"summary\":str,"
    "\"notes\":str,\"definitions\":[{\"term\":str,\"definition\":str}],"
    "\"key_concepts\":[str]}]}. Base everything ONLY on the transcript. "
    "Do not invent facts. Merge closely related ideas."
)


def analyze_chunk(
    text: str, segment_ids: list[int], start, end
) -> list[dict]:
    if settings.llm_enabled:
        try:
            raw = _chat(
                _SYS_TOPICS,
                f"Transcript chunk:\n\n{text}\n\nReturn the JSON now.",
            )
            data = _safe_json(raw) or {}
            topics = data.get("topics", []) if isinstance(data, dict) else []
            for t in topics:
                t.setdefault("definitions", [])
                t.setdefault("key_concepts", [])
                t["source_start_seconds"] = start
                t["source_end_seconds"] = end
                t["segment_ids"] = segment_ids
            if topics:
                return topics
        except (httpx.HTTPError, KeyError, ValueError):
            pass  # fall through to offline
    return _offline_topics(text, start, end, segment_ids)


_SYS_CARDS = (
    "You are a study-coach. Given a topic from a lecture, return JSON: "
    "{\"flashcards\":[{\"question\":str,\"answer\":str,\"difficulty\":\"easy|medium|hard\"}]}. "
    "Questions must be answerable from the given material only."
)


def make_flashcards(topic: dict) -> list[dict]:
    if settings.llm_enabled:
        try:
            raw = _chat(_SYS_CARDS, json.dumps(topic))
            data = _safe_json(raw) or {}
            cards = data.get("flashcards", []) if isinstance(data, dict) else []
            if cards:
                return cards
        except (httpx.HTTPError, KeyError, ValueError):
            pass
    return _offline_cards(topic)


_SYS_MCQ = (
    "You are an exam author. Given a topic, return JSON: "
    "{\"mcqs\":[{\"question\":str,\"options\":[str,str,str,str],\"correct_index\":int,"
    "\"explanation\":str,\"difficulty\":\"easy|medium|hard\"}]}. Exactly one option is "
    "correct and it must be supported by the material."
)


def make_mcqs(topic: dict, distractor_pool: list[str]) -> list[dict]:
    if settings.llm_enabled:
        try:
            payload = {"topic": topic, "other_statements": distractor_pool[:6]}
            raw = _chat(_SYS_MCQ, json.dumps(payload))
            data = _safe_json(raw) or {}
            mcqs = data.get("mcqs", []) if isinstance(data, dict) else []
            if mcqs:
                return mcqs
        except (httpx.HTTPError, KeyError, ValueError):
            pass
    return _offline_mcqs(topic, distractor_pool)
