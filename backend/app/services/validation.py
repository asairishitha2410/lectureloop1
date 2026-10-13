"""Quality checks applied to AI output before anything is stored or shown.

We drop material that cannot be trusted (missing options, multiple intended
answers, empty/duplicate content) rather than presenting it as certain.
"""
from __future__ import annotations


def validate_flashcard(card: dict) -> tuple[bool, str]:
    q = (card.get("question") or "").strip()
    a = (card.get("answer") or "").strip()
    if not q or not a:
        return False, "empty_question_or_answer"
    if len(q) < 8 or len(a) < 8:
        return False, "too_short"
    if q.lower() == a.lower():
        return False, "question_equals_answer"
    difficulty = card.get("difficulty", "medium")
    if difficulty not in ("easy", "medium", "hard"):
        card["difficulty"] = "medium"
    return True, "ok"


def dedupe_flashcards(cards: list[dict]) -> list[dict]:
    seen: set[str] = set()
    result = []
    for c in cards:
        ok, _ = validate_flashcard(c)
        if not ok:
            continue
        key = (c.get("question") or "").strip().lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(c)
    return result


def validate_mcq(mcq: dict) -> tuple[bool, str]:
    options = mcq.get("options") or []
    if len(options) != 4:
        return False, "needs_four_options"
    cleaned = [str(o).strip() for o in options]
    if any(not o for o in cleaned):
        return False, "empty_option"
    if len(set(o.lower() for o in cleaned)) != 4:
        return False, "duplicate_options"
    idx = mcq.get("correct_index")
    if not isinstance(idx, int) or not (0 <= idx < 4):
        return False, "invalid_correct_index"
    if not (mcq.get("question") or "").strip():
        return False, "empty_question"
    if not (mcq.get("explanation") or "").strip():
        mcq["explanation"] = "See the supporting excerpt from the lecture."
    difficulty = mcq.get("difficulty", "medium")
    if difficulty not in ("easy", "medium", "hard"):
        mcq["difficulty"] = "medium"
    mcq["options"] = cleaned
    return True, "ok"


def validate_and_filter_mcqs(mcqs: list[dict]) -> list[dict]:
    seen: set[str] = set()
    result = []
    for m in mcqs:
        ok, _ = validate_mcq(m)
        if not ok:
            continue
        key = (m.get("question") or "").strip().lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(m)
    return result
