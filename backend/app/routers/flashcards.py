from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Bookmark, Flashcard, Lecture, ReviewHistory, Topic, User
from ..schemas import DueCard, FlashcardOut, ReviewCreate, ReviewOut
from ..services import analytics, srs

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


def _owned(db: Session, user: User, flashcard_id: int) -> Flashcard:
    card = db.get(Flashcard, flashcard_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    lecture = db.get(Lecture, card.lecture_id)
    if lecture is None or lecture.user_id != user.id:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    return card


def _serialize(db: Session, user: User, card: Flashcard) -> FlashcardOut:
    out = FlashcardOut.model_validate(card)
    if card.topic_id:
        topic = db.get(Topic, card.topic_id)
        out.topic_title = topic.title if topic else None
    out.lecture_title = db.get(Lecture, card.lecture_id).title
    out.bookmarked = db.scalar(
        select(Bookmark.id).where(
            Bookmark.user_id == user.id, Bookmark.flashcard_id == card.id
        )
    ) is not None
    latest = db.scalar(
        select(ReviewHistory)
        .where(
            ReviewHistory.user_id == user.id,
            ReviewHistory.flashcard_id == card.id,
        )
        .order_by(ReviewHistory.reviewed_at.desc())
    )
    out.next_review_at = latest.next_review_at if latest else None
    return out


@router.get("", response_model=list[FlashcardOut])
def list_flashcards(
    lecture_id: int | None = None,
    topic_id: int | None = None,
    difficulty: str | None = None,
    bookmarked: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[FlashcardOut]:
    lecture_ids = list(
        db.scalars(select(Lecture.id).where(Lecture.user_id == user.id)).all()
    )
    if not lecture_ids:
        return []
    query = select(Flashcard).where(Flashcard.lecture_id.in_(lecture_ids))
    if lecture_id is not None:
        query = query.where(Flashcard.lecture_id == lecture_id)
    if topic_id is not None:
        query = query.where(Flashcard.topic_id == topic_id)
    if difficulty:
        query = query.where(Flashcard.difficulty == difficulty)
    cards = db.scalars(query.order_by(Flashcard.id)).all()

    if bookmarked:
        marked = set(
            db.scalars(
                select(Bookmark.flashcard_id).where(Bookmark.user_id == user.id)
            ).all()
        )
        cards = [c for c in cards if c.id in marked]
    return [_serialize(db, user, c) for c in cards]


@router.get("/due", response_model=list[DueCard])
def due_flashcards(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[DueCard]:
    return [DueCard(**c) for c in analytics.due_cards(db, user)]


@router.post("/{flashcard_id}/review", response_model=ReviewOut)
def review_flashcard(
    flashcard_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReviewOut:
    _owned(db, user, flashcard_id)

    prev = db.scalar(
        select(ReviewHistory)
        .where(
            ReviewHistory.user_id == user.id,
            ReviewHistory.flashcard_id == flashcard_id,
        )
        .order_by(ReviewHistory.reviewed_at.desc())
    )
    schedule = srs.schedule_next(
        payload.rating,
        repetitions=prev.repetitions if prev else 0,
        interval_days=prev.interval_days if prev else 0.0,
        ease=prev.ease if prev else 2.5,
        now=datetime.now(timezone.utc),
    )
    row = ReviewHistory(
        user_id=user.id,
        flashcard_id=flashcard_id,
        rating=payload.rating,
        repetitions=schedule.repetitions,
        interval_days=schedule.interval_days,
        ease=schedule.ease,
        next_review_at=schedule.next_review_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ReviewOut(
        flashcard_id=flashcard_id,
        rating=payload.rating,
        repetitions=row.repetitions,
        interval_days=row.interval_days,
        ease=row.ease,
        next_review_at=row.next_review_at,
    )


@router.post("/{flashcard_id}/bookmark", response_model=FlashcardOut)
def toggle_bookmark(
    flashcard_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FlashcardOut:
    card = _owned(db, user, flashcard_id)
    existing = db.scalar(
        select(Bookmark).where(
            Bookmark.user_id == user.id, Bookmark.flashcard_id == flashcard_id
        )
    )
    if existing:
        db.delete(existing)
    else:
        db.add(Bookmark(user_id=user.id, flashcard_id=flashcard_id))
    db.commit()
    return _serialize(db, user, card)
