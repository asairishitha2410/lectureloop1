"""End-to-end smoke test for the LectureLoop API.

Run with:  python smoke_test.py
Uses an isolated temporary SQLite database and exercises the full flow:
register -> submit transcript -> process -> notes/flashcards/quiz ->
review -> quiz submit -> analytics.
"""
import os
import tempfile

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TRANSCRIPT = """00:00 A database is an organized collection of data.
00:20 Data redundancy is the unnecessary repetition of data across a database.
00:45 A functional dependency is a relationship between two attributes.
01:10 Normalization refers to the process of organizing data to reduce redundancy.
01:40 First Normal Form requires that each column contains atomic values.
02:05 Second Normal Form removes partial dependencies on a composite key.
02:30 Third Normal Form removes transitive dependencies between non key attributes.
02:55 Boyce Codd Normal Form is a stronger version of the third normal form.
"""


def run(client: TestClient) -> None:
    assert client.get("/health").json()["status"] == "ok"

    reg = client.post(
        "/auth/register",
        json={"name": "Asha", "email": "asha@example.com", "password": "secret123"},
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a lecture from an uploaded transcript.
    created = client.post(
        "/lectures",
        json={"transcript": TRANSCRIPT, "language": "en", "difficulty": "medium"},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    lecture_id = created.json()["id"]

    detail = client.get(f"/lectures/{lecture_id}", headers=headers).json()
    assert detail["status"] == "ready", detail
    assert detail["topic_count"] >= 1, detail
    assert detail["flashcard_count"] >= 1, detail
    print("lecture:", detail["title"], "| topics:", detail["topic_count"],
          "| cards:", detail["flashcard_count"], "| questions:", detail["quiz_question_count"])

    notes = client.get(f"/lectures/{lecture_id}/notes", headers=headers).json()
    assert notes and notes[0]["title"]

    cards = client.get(f"/lectures/{lecture_id}/flashcards", headers=headers).json()
    assert cards and cards[0]["question"] and cards[0]["answer"]

    # Review a card.
    reviewed = client.post(
        f"/flashcards/{cards[0]['id']}/review", json={"rating": "good"}, headers=headers
    )
    assert reviewed.status_code == 200, reviewed.text
    assert reviewed.json()["repetitions"] == 1

    # Bookmark a card.
    bm = client.post(f"/flashcards/{cards[0]['id']}/bookmark", headers=headers)
    assert bm.status_code == 200 and bm.json()["bookmarked"] is True

    quiz = client.get(f"/lectures/{lecture_id}/quiz", headers=headers).json()
    assert quiz and quiz["questions"], "expected generated questions"
    q = quiz["questions"][0]
    assert len(q["options"]) == 4, q

    answers = [0] * len(quiz["questions"])
    result = client.post(
        f"/quizzes/{quiz['id']}/submit", json={"answers": answers}, headers=headers
    )
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["total"] == len(quiz["questions"])
    print("quiz score:", body["score"], "/", body["total"])

    stats = client.get("/analytics", headers=headers).json()
    assert stats["total_lectures"] == 1
    assert stats["total_flashcards"] >= 1
    assert stats["quizzes_completed"] == 1
    print("analytics:", {k: stats[k] for k in (
        "total_lectures", "total_flashcards", "total_reviews",
        "quizzes_completed", "average_quiz_score")})

    # Authorization: a second user cannot read the first user's lecture.
    client.post(
        "/auth/register",
        json={"name": "Bob", "email": "bob@example.com", "password": "secret123"},
    )
    login = client.post(
        "/auth/login", json={"email": "bob@example.com", "password": "secret123"}
    ).json()
    other_headers = {"Authorization": f"Bearer {login['access_token']}"}
    forbidden = client.get(f"/lectures/{lecture_id}", headers=other_headers)
    assert forbidden.status_code == 404, forbidden.text

    # Invalid URL handling.
    bad = client.post("/lectures", json={"youtube_url": "not-a-url"}, headers=headers)
    assert bad.status_code == 422, bad.text

    print("ALL CHECKS PASSED")


def main() -> None:
    # A context manager is required so the app lifespan (which creates tables) runs.
    with TestClient(app) as client:
        run(client)


if __name__ == "__main__":
    main()
