from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Lecture, Question, Quiz, QuizAttempt, Topic, User
from ..schemas import (
    QuestionOut,
    QuizOut,
    QuizResult,
    QuizResultItem,
    QuizSubmit,
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _owned_quiz(db: Session, user: User, quiz_id: int) -> Quiz:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    lecture = db.get(Lecture, quiz.lecture_id)
    if lecture is None or lecture.user_id != user.id:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return quiz


def _serialize(db: Session, quiz: Quiz) -> QuizOut:
    out = QuizOut.model_validate(quiz)
    lecture = db.get(Lecture, quiz.lecture_id)
    out.lecture_title = lecture.title if lecture else None
    topics = {t.id: t.title for t in db.scalars(
        select(Topic).where(Topic.lecture_id == quiz.lecture_id)
    ).all()}
    for q in out.questions:
        q.topic_title = topics.get(q.topic_id)
    return out


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizOut:
    quiz = _owned_quiz(db, user, quiz_id)
    # Questions are returned without the correct answer so grading stays server-side.
    out = _serialize(db, quiz)
    return out


@router.post("/{quiz_id}/submit", response_model=QuizResult)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmit,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizResult:
    quiz = _owned_quiz(db, user, quiz_id)
    questions = db.scalars(
        select(Question).where(Question.quiz_id == quiz.id).order_by(Question.id)
    ).all()

    selected = list(payload.answers)
    if len(selected) != len(questions):
        raise HTTPException(
            status_code=422,
            detail=f"Expected {len(questions)} answers, received {len(selected)}.",
        )

    # A -1 marks a skipped question (e.g. filtered out of a practice set).
    # Only attempted questions are graded and counted.
    results = []
    detail = []
    score = 0
    answered = 0
    for question, choice in zip(questions, selected):
        if choice is None or choice < 0:
            continue
        answered += 1
        is_correct = choice == question.correct_index
        if is_correct:
            score += 1
        results.append(
            QuizResultItem(
                question_id=question.id,
                selected_index=choice,
                correct_index=question.correct_index,
                is_correct=is_correct,
                topic_id=question.topic_id,
                explanation=question.explanation,
            )
        )
        detail.append(
            {
                "question_id": question.id,
                "topic_id": question.topic_id,
                "difficulty": question.difficulty,
                "selected_index": choice,
                "is_correct": is_correct,
            }
        )

    if answered == 0:
        raise HTTPException(status_code=422, detail="Answer at least one question.")

    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz.id,
        score=score,
        total=answered,
        answers=detail,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizResult(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        score=score,
        total=answered,
        results=results,
    )
