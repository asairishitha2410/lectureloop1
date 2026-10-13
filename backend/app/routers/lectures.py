from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Flashcard, Lecture, Question, Quiz, Topic, TranscriptSegment, User
from ..schemas import (
    FlashcardOut,
    LectureCreate,
    LectureDetail,
    LectureSummary,
    QuestionOut,
    QuizOut,
    TopicOut,
    TranscriptSegmentOut,
)
from ..services.pipeline import run_pipeline
from ..services.transcript import (
    TranscriptError,
    extract_video_id,
    fetch_metadata,
    validate_url,
)

router = APIRouter(prefix="/lectures", tags=["lectures"])


def get_owned_lecture(lecture_id: int, db: Session, user: User) -> Lecture:
    lecture = db.get(Lecture, lecture_id)
    if lecture is None or lecture.user_id != user.id:
        # Do not reveal whether the resource exists for another user.
        raise HTTPException(status_code=404, detail="Lecture not found.")
    return lecture


def _to_detail(db: Session, lecture: Lecture) -> LectureDetail:
    topic_count = db.scalar(
        select(func.count(Topic.id)).where(Topic.lecture_id == lecture.id)
    ) or 0
    card_count = db.scalar(
        select(func.count(Flashcard.id)).where(Flashcard.lecture_id == lecture.id)
    ) or 0
    question_count = db.scalar(
        select(func.count(Question.id))
        .join(Quiz, Question.quiz_id == Quiz.id)
        .where(Quiz.lecture_id == lecture.id)
    ) or 0
    detail = LectureDetail.model_validate(lecture)
    detail.topic_count = topic_count
    detail.flashcard_count = card_count
    detail.quiz_question_count = question_count
    return detail


def _enqueue(background: BackgroundTasks, lecture_id: int):
    background.add_task(run_pipeline, lecture_id)


@router.post("", response_model=LectureDetail, status_code=201)
def create_lecture(
    payload: LectureCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LectureDetail:
    if not payload.youtube_url and not payload.transcript:
        raise HTTPException(
            status_code=422,
            detail="Provide a YouTube URL or paste/upload a transcript.",
        )

    source = "youtube"
    youtube_id = None
    meta = {}

    if payload.youtube_url:
        try:
            youtube_id = validate_url(payload.youtube_url)
        except TranscriptError as exc:
            raise HTTPException(status_code=422, detail=exc.message) from exc
        meta = fetch_metadata(payload.youtube_url)
    else:
        source = "upload"

    lecture = Lecture(
        user_id=user.id,
        youtube_url=payload.youtube_url or "",
        youtube_id=youtube_id,
        title=(meta.get("title") or ("Uploaded transcript" if source == "upload" else "Untitled lecture")),
        channel=meta.get("channel"),
        thumbnail_url=meta.get("thumbnail_url"),
        language=payload.language,
        difficulty=payload.difficulty,
        source=source,
        status="queued",
        stage_message="Queued",
        pending_transcript=payload.transcript if source == "upload" else None,
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    _enqueue(background, lecture.id)
    return _to_detail(db, lecture)


@router.get("", response_model=list[LectureDetail])
def list_lectures(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[LectureDetail]:
    rows = db.scalars(
        select(Lecture)
        .where(Lecture.user_id == user.id)
        .order_by(Lecture.created_at.desc())
    ).all()
    return [_to_detail(db, r) for r in rows]


@router.delete("/{lecture_id}", status_code=204)
def delete_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    lecture = get_owned_lecture(lecture_id, db, user)
    db.delete(lecture)
    db.commit()
    return None


@router.get("/{lecture_id}", response_model=LectureDetail)
def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LectureDetail:
    lecture = get_owned_lecture(lecture_id, db, user)
    return _to_detail(db, lecture)


@router.post("/{lecture_id}/generate", response_model=LectureDetail)
def regenerate(
    lecture_id: int,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LectureDetail:
    lecture = get_owned_lecture(lecture_id, db, user)
    if not lecture.pending_transcript:
        # Clear previous generated content before regenerating.
        for model in (Flashcard, Topic):
            for row in db.scalars(select(model).where(model.lecture_id == lecture.id)).all():
                db.delete(row)
        for quiz in db.scalars(select(Quiz).where(Quiz.lecture_id == lecture.id)).all():
            db.delete(quiz)
        for seg in db.scalars(
            select(TranscriptSegment).where(TranscriptSegment.lecture_id == lecture.id)
        ).all():
            db.delete(seg)
    lecture.status = "queued"
    lecture.stage_message = "Queued"
    lecture.progress = 0
    lecture.error_code = None
    lecture.error_message = None
    db.commit()
    _enqueue(background, lecture.id)
    return _to_detail(db, lecture)


@router.get("/{lecture_id}/transcript", response_model=list[TranscriptSegmentOut])
def get_transcript(
    lecture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TranscriptSegmentOut]:
    get_owned_lecture(lecture_id, db, user)
    rows = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.lecture_id == lecture_id)
        .order_by(TranscriptSegment.seq)
    ).all()
    return [TranscriptSegmentOut.model_validate(r) for r in rows]


@router.get("/{lecture_id}/notes", response_model=list[TopicOut])
def get_notes(
    lecture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TopicOut]:
    get_owned_lecture(lecture_id, db, user)
    rows = db.scalars(
        select(Topic).where(Topic.lecture_id == lecture_id).order_by(Topic.order_index)
    ).all()
    return [TopicOut.model_validate(r) for r in rows]


@router.get("/{lecture_id}/flashcards", response_model=list[FlashcardOut])
def get_flashcards(
    lecture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[FlashcardOut]:
    get_owned_lecture(lecture_id, db, user)
    rows = db.scalars(
        select(Flashcard).where(Flashcard.lecture_id == lecture_id).order_by(Flashcard.id)
    ).all()
    titles = {t.id: t.title for t in db.scalars(
        select(Topic).where(Topic.lecture_id == lecture_id)
    ).all()}
    out = []
    for r in rows:
        card = FlashcardOut.model_validate(r)
        card.topic_title = titles.get(r.topic_id)
        card.lecture_title = db.get(Lecture, lecture_id).title
        out.append(card)
    return out


@router.get("/{lecture_id}/quiz", response_model=QuizOut | None)
def get_quiz(
    lecture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizOut | None:
    get_owned_lecture(lecture_id, db, user)
    quiz = db.scalar(select(Quiz).where(Quiz.lecture_id == lecture_id))
    if not quiz:
        return None
    topics = {t.id: t.title for t in db.scalars(
        select(Topic).where(Topic.lecture_id == lecture_id)
    ).all()}
    out = QuizOut.model_validate(quiz)
    out.lecture_title = db.get(Lecture, lecture_id).title
    for q in out.questions:
        q.topic_title = topics.get(q.topic_id)
    return out
