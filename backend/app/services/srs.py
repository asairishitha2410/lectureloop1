"""Deterministic spaced-repetition scheduler (SM-2 variant).

Ratings: again | hard | good | easy. The function is pure and testable: given
the previous state and a rating it returns the next state and due date.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

_QUALITY = {"again": 1, "hard": 3, "good": 4, "easy": 5}
_MIN_EASE = 1.3


@dataclass
class Schedule:
    repetitions: int
    interval_days: float
    ease: float
    next_review_at: datetime


def schedule_next(
    rating: str,
    repetitions: int = 0,
    interval_days: float = 0.0,
    ease: float = 2.5,
    now: datetime | None = None,
) -> Schedule:
    now = now or datetime.now(timezone.utc)
    quality = _QUALITY.get(rating, 3)

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease = max(_MIN_EASE, ease)

    if quality < 3:
        repetitions = 0
        interval_days = 0.0  # relearn quickly
        next_at = now + timedelta(minutes=10)
    else:
        repetitions += 1
        if repetitions == 1:
            interval_days = 1.0
        elif repetitions == 2:
            interval_days = 6.0
        else:
            interval_days = round(max(interval_days, 1.0) * ease, 2)
        next_at = now + timedelta(days=interval_days)

    return Schedule(
        repetitions=repetitions,
        interval_days=round(interval_days, 2),
        ease=round(ease, 3),
        next_review_at=next_at,
    )
