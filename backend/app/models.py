from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    preferred_language: Mapped[str] = mapped_column(String(16), default="en")
    default_difficulty: Mapped[str] = mapped_column(String(16), default="medium")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    lectures: Mapped[list["Lecture"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    youtube_url: Mapped[str] = mapped_column(String(512), nullable=False)
    youtube_id: Mapped[str | None] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(512), default="Untitled lecture")
    channel: Mapped[str | None] = mapped_column(String(255))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    thumbnail_url: Mapped[str | None] = mapped_column(String(512))

    # queued | processing | generating | validating | ready | failed
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True)
    stage_message: Mapped[str] = mapped_column(String(255), default="Queued")
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    progress: Mapped[int] = mapped_column(Integer, default=0)

    language: Mapped[str] = mapped_column(String(16), default="en")
    difficulty: Mapped[str] = mapped_column(String(16), default="medium")
    source: Mapped[str] = mapped_column(String(32), default="youtube")  # youtube | upload
    # Temporary storage for a user-provided transcript until it is segmented.
    pending_transcript: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    owner: Mapped["User"] = relationship(back_populates="lectures")
    segments: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan", order_by="TranscriptSegment.seq"
    )
    topics: Mapped[list["Topic"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan", order_by="Topic.order_index"
    )
    flashcards: Mapped[list["Flashcard"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan"
    )
    quizzes: Mapped[list["Quiz"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan"
    )


class TranscriptSegment(Base):
    __tablename__ = "transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(
        ForeignKey("lectures.id", ondelete="CASCADE"), index=True, nullable=False
    )
    seq: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    start_seconds: Mapped[float | None] = mapped_column(Float)
    end_seconds: Mapped[float | None] = mapped_column(Float)

    lecture: Mapped["Lecture"] = relationship(back_populates="segments")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(
        ForeignKey("lectures.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    definitions: Mapped[list] = mapped_column(JSON, default=list)
    key_concepts: Mapped[list] = mapped_column(JSON, default=list)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    start_seconds: Mapped[float | None] = mapped_column(Float)
    end_seconds: Mapped[float | None] = mapped_column(Float)

    lecture: Mapped["Lecture"] = relationship(back_populates="topics")
    flashcards: Mapped[list["Flashcard"]] = relationship(
        back_populates="topic", cascade="all, delete-orphan"
    )


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(
        ForeignKey("lectures.id", ondelete="CASCADE"), index=True, nullable=False
    )
    topic_id: Mapped[int | None] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(16), default="medium")

    source_segment_id: Mapped[int | None] = mapped_column(
        ForeignKey("transcripts.id", ondelete="SET NULL")
    )
    source_excerpt: Mapped[str] = mapped_column(Text, default="")
    source_start_seconds: Mapped[float | None] = mapped_column(Float)

    lecture: Mapped["Lecture"] = relationship(back_populates="flashcards")
    topic: Mapped["Topic"] = relationship(back_populates="flashcards")


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "flashcard_id", name="uq_bookmark"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    flashcard_id: Mapped[int] = mapped_column(
        ForeignKey("flashcards.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(
        ForeignKey("lectures.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), default="Lecture quiz")

    lecture: Mapped["Lecture"] = relationship(back_populates="quizzes")
    questions: Mapped[list["Question"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"), index=True, nullable=False
    )
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSON, default=list)
    correct_index: Mapped[int] = mapped_column(Integer, default=0)
    explanation: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[str] = mapped_column(String(16), default="medium")
    source_excerpt: Mapped[str] = mapped_column(Text, default="")
    source_start_seconds: Mapped[float | None] = mapped_column(Float)

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    answers: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    flashcard_id: Mapped[int] = mapped_column(
        ForeignKey("flashcards.id", ondelete="CASCADE"), index=True
    )
    rating: Mapped[str] = mapped_column(String(16))  # again | hard | good | easy
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    interval_days: Mapped[float] = mapped_column(Float, default=0)
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    next_review_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
