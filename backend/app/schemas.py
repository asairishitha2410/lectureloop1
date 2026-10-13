from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------- Auth / user
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    preferred_language: str
    default_difficulty: str
    notifications_enabled: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    name: str | None = None
    preferred_language: str | None = None
    default_difficulty: str | None = None
    notifications_enabled: bool | None = None


# -------------------------------------------------------------------- Lectures
class LectureCreate(BaseModel):
    youtube_url: str | None = None
    transcript: str | None = None
    language: str = "en"
    difficulty: str = "medium"


class TranscriptSegmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    seq: int
    text: str
    start_seconds: float | None
    end_seconds: float | None


class LectureSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    youtube_url: str
    youtube_id: str | None
    title: str
    channel: str | None
    duration_seconds: int | None
    thumbnail_url: str | None
    status: str
    stage_message: str
    error_code: str | None
    error_message: str | None
    progress: int
    language: str
    difficulty: str
    source: str
    created_at: datetime
    updated_at: datetime


class LectureDetail(LectureSummary):
    topic_count: int = 0
    flashcard_count: int = 0
    quiz_question_count: int = 0


# ---------------------------------------------------------------------- Topics
class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    summary: str
    notes: str
    definitions: list
    key_concepts: list
    order_index: int
    start_seconds: float | None
    end_seconds: float | None


# ------------------------------------------------------------------ Flashcards
class FlashcardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lecture_id: int
    topic_id: int | None
    topic_title: str | None = None
    lecture_title: str | None = None
    question: str
    answer: str
    difficulty: str
    source_excerpt: str
    source_start_seconds: float | None
    bookmarked: bool = False
    next_review_at: datetime | None = None


class ReviewCreate(BaseModel):
    rating: str = Field(pattern="^(again|hard|good|easy)$")


class ReviewOut(BaseModel):
    flashcard_id: int
    rating: str
    repetitions: int
    interval_days: float
    ease: float
    next_review_at: datetime


# ------------------------------------------------------------------- Quizzes
class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    topic_id: int | None
    topic_title: str | None = None
    question: str
    options: list
    explanation: str
    difficulty: str
    source_excerpt: str
    source_start_seconds: float | None


class QuizOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lecture_id: int
    lecture_title: str | None = None
    title: str
    questions: list[QuestionOut]


class QuizSubmit(BaseModel):
    answers: list[int]


class QuizResultItem(BaseModel):
    question_id: int
    selected_index: int
    correct_index: int
    is_correct: bool
    topic_id: int | None
    explanation: str


class QuizResult(BaseModel):
    attempt_id: int
    quiz_id: int
    score: int
    total: int
    results: list[QuizResultItem]


# ------------------------------------------------------------------ Analytics
class TopicAccuracy(BaseModel):
    topic_id: int | None
    topic_title: str
    accuracy: float
    attempts: int


class AnalyticsOut(BaseModel):
    total_lectures: int
    total_flashcards: int
    total_reviews: int
    quizzes_completed: int
    average_quiz_score: float
    due_today: int
    overdue: int
    streak_days: int
    weak_topics: list[TopicAccuracy]
    topic_accuracy: list[TopicAccuracy]
    difficulty_accuracy: dict
    score_trend: list[dict]
    recommended_topics: list[str]


class DueCard(BaseModel):
    flashcard_id: int
    question: str
    lecture_title: str | None
    topic_title: str | None
    next_review_at: datetime
    overdue: bool
