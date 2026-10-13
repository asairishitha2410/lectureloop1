"""Deterministic progress analytics and weak-topic detection.

All numbers are derived from stored quiz attempts and review history so the
figures are reproducible and testable.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import (
    Flashcard,
    Lecture,
    Question,
    QuizAttempt,
    ReviewHistory,
    Topic,
    User,
)

WEAK_TOPIC_THRESHOLD = 0.6
WEAK_TOPIC_MIN_ATTEMPTS = 2


def _lecture_ids(db: Session, user: User) -> list[int]:
    return list(
        db.scalars(select(Lecture.id).where(Lecture.user_id == user.id)).all()
    )


def latest_reviews(db: Session, user: User) -> dict[int, ReviewHistory]:
    rows = db.scalars(
        select(ReviewHistory)
        .where(ReviewHistory.user_id == user.id)
        .order_by(ReviewHistory.reviewed_at.asc())
    ).all()
    latest: dict[int, ReviewHistory] = {}
    for r in rows:
        latest[r.flashcard_id] = r
    return latest


def compute_analytics(db: Session, user: User) -> dict:
    lecture_ids = _lecture_ids(db, user)

    total_lectures = len(lecture_ids)
    total_flashcards = (
        db.scalar(
            select(func.count(Flashcard.id)).where(Flashcard.lecture_id.in_(lecture_ids))
        )
        if lecture_ids
        else 0
    ) or 0

    reviews = db.scalars(
        select(ReviewHistory).where(ReviewHistory.user_id == user.id)
    ).all()
    total_reviews = len(reviews)

    attempts = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.created_at.asc())
    ).all()

    scores = [a.score / a.total for a in attempts if a.total]
    average_quiz_score = round(sum(scores) / len(scores) * 100, 1) if scores else 0.0

    # Topic / difficulty accuracy from stored answer detail.
    topic_stats: dict[int | None, dict] = defaultdict(lambda: {"correct": 0, "total": 0})
    diff_stats: dict[str, dict] = defaultdict(lambda: {"correct": 0, "total": 0})
    for a in attempts:
        for ans in a.answers or []:
            t = ans.get("topic_id")
            d = ans.get("difficulty", "medium")
            correct = 1 if ans.get("is_correct") else 0
            topic_stats[t]["correct"] += correct
            topic_stats[t]["total"] += 1
            diff_stats[d]["correct"] += correct
            diff_stats[d]["total"] += 1

    topic_titles = {
        t.id: t.title
        for t in db.scalars(
            select(Topic).where(Topic.lecture_id.in_(lecture_ids))
        ).all()
    } if lecture_ids else {}

    topic_accuracy = []
    weak_topics = []
    for topic_id, stat in topic_stats.items():
        if not stat["total"]:
            continue
        acc = stat["correct"] / stat["total"]
        entry = {
            "topic_id": topic_id,
            "topic_title": topic_titles.get(topic_id, "General"),
            "accuracy": round(acc * 100, 1),
            "attempts": stat["total"],
        }
        topic_accuracy.append(entry)
        if acc < WEAK_TOPIC_THRESHOLD and stat["total"] >= WEAK_TOPIC_MIN_ATTEMPTS:
            weak_topics.append(entry)

    topic_accuracy.sort(key=lambda x: x["accuracy"])
    weak_topics.sort(key=lambda x: x["accuracy"])

    difficulty_accuracy = {
        d: {
            "accuracy": round(stat["correct"] / stat["total"] * 100, 1),
            "attempts": stat["total"],
        }
        for d, stat in diff_stats.items()
        if stat["total"]
    }

    score_trend = [
        {
            "date": a.created_at.strftime("%b %d"),
            "score": round(a.score / a.total * 100, 1) if a.total else 0,
        }
        for a in attempts
    ]

    # Due / overdue
    latest = latest_reviews(db, user)
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    due_today = 0
    overdue = 0
    for r in latest.values():
        nr = r.next_review_at
        if nr.tzinfo is None:
            nr = nr.replace(tzinfo=timezone.utc)
        if nr <= now:
            due_today += 1
            if nr < today_start:
                overdue += 1

    streak_days = _compute_streak(reviews, now)

    return {
        "total_lectures": total_lectures,
        "total_flashcards": total_flashcards,
        "total_reviews": total_reviews,
        "quizzes_completed": len(attempts),
        "average_quiz_score": average_quiz_score,
        "due_today": due_today,
        "overdue": overdue,
        "streak_days": streak_days,
        "weak_topics": weak_topics,
        "topic_accuracy": topic_accuracy,
        "difficulty_accuracy": difficulty_accuracy,
        "score_trend": score_trend[-14:],
        "recommended_topics": [t["topic_title"] for t in weak_topics][:5],
    }


def _compute_streak(reviews: list[ReviewHistory], now: datetime) -> int:
    if not reviews:
        return 0
    days = set()
    for r in reviews:
        d = r.reviewed_at
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        days.add(d.date())
    streak = 0
    cursor = now.date()
    if cursor not in days:
        cursor = cursor - timedelta(days=1)
        if cursor not in days:
            return 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def due_cards(db: Session, user: User, limit: int = 200) -> list[dict]:
    latest = latest_reviews(db, user)
    if not latest:
        return []
    now = datetime.now(timezone.utc)
    card_ids = [cid for cid, r in latest.items()
                if (r.next_review_at.replace(tzinfo=timezone.utc)
                    if r.next_review_at.tzinfo is None else r.next_review_at) <= now]
    if not card_ids:
        return []
    cards = db.scalars(select(Flashcard).where(Flashcard.id.in_(card_ids))).all()
    lecture_titles = {
        l.id: l.title
        for l in db.scalars(
            select(Lecture).where(Lecture.id.in_([c.lecture_id for c in cards]))
        ).all()
    }
    topics = {
        t.id: t.title
        for t in db.scalars(
            select(Topic).where(Topic.id.in_([c.topic_id for c in cards if c.topic_id]))
        ).all()
    }
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    out = []
    for c in cards:
        r = latest[c.id]
        nr = r.next_review_at
        if nr.tzinfo is None:
            nr = nr.replace(tzinfo=timezone.utc)
        out.append(
            {
                "flashcard_id": c.id,
                "question": c.question,
                "lecture_title": lecture_titles.get(c.lecture_id),
                "topic_title": topics.get(c.topic_id),
                "next_review_at": nr,
                "overdue": nr < today_start,
            }
        )
    out.sort(key=lambda x: x["next_review_at"])
    return out[:limit]
