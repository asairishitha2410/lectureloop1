# LectureLoop

**Turn every lecture into a learning system.**

LectureLoop is a full-stack AI learning platform that transforms educational
lectures into **source-linked notes, flashcards, quizzes and personalised
revision schedules**, helping students understand concepts, test their
knowledge, and remember what they learn.

```
Watch -> Understand -> Practice -> Remember -> Improve
```

---

## Overview

A student submits a YouTube URL (or uploads a transcript). The backend validates
the source, retrieves permitted captions or accepts a user-provided transcript,
organises the content into topics, and uses an LLM to generate structured study
material:

- Topic-wise notes and summaries
- Question-and-answer flashcards
- MCQs with options, the correct answer, and an explanation
- Difficulty labels and timestamp links back to the lecture
- Spaced-repetition review schedules
- Learning analytics and weak-topic recommendations

**Design principle:** use an LLM to generate and explain learning content, but use
**deterministic backend logic** for quiz scoring, review scheduling and progress
calculations. This keeps the app testable and dependable. If no LLM API key is
configured, a deterministic offline generator is used, so the entire pipeline
runs end-to-end with zero external dependencies.

### Responsible use

- Prefer authorised caption access or a transcript the user provides.
- Process audio only when the source and method are permitted.
- If a transcript is unavailable, explain the issue clearly and offer transcript
  upload instead.
- Respect copyright, platform terms and privacy requirements.

---

## Architecture

```
                     Web client (Next.js + React + Tailwind)
                                    |
                               REST API (JSON)
                                    |
                        FastAPI backend (Python)
        +----------------+----------+---------+-----------------+
        |                |                    |                 |
  Transcript        AI content           Learning           Analytics
  pipeline          generation           services           service
        |                |                    |                 |
  captions /        LLM (or offline      SM-2 review        topic accuracy
  user transcript   generator) ->        scheduler          weak topics
        |           notes/cards/MCQs         |                 |
        +----------------+----------+---------+-----------------+
                                    |
                       SQLAlchemy -> PostgreSQL (or SQLite)
        Users · Lectures · Transcripts · Topics · Flashcards
             Quizzes · Questions · Attempts · Reviews
```

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Frontend         | Next.js (App Router), React 19                          |
| Styling          | Tailwind CSS v4 (shared design tokens)                  |
| Charts           | Recharts                                                |
| Backend          | Python, FastAPI, SQLAlchemy 2                           |
| Database         | PostgreSQL (SQLite by default for local dev)            |
| Transcript       | Accessible captions (`youtube-transcript-api`) or upload |
| AI generation    | Any OpenAI-compatible LLM, with a built-in offline fallback |
| Auth             | JWT bearer tokens, PBKDF2-HMAC-SHA256 password hashing  |
| Background jobs  | FastAPI `BackgroundTasks` (swap for Celery + Redis later) |

---

## Project structure

```
lectureloop/
  backend/
    app/
      main.py              FastAPI app + CORS + lifespan
      config.py            Settings (env-driven)
      database.py          Engine, session, init_db
      models.py            SQLAlchemy models
      schemas.py           Pydantic request/response models
      security.py          Password hashing + JWT
      deps.py              Auth dependency
      routers/             auth, users, lectures, flashcards, quizzes, analytics
      services/
        transcript.py      URL validation, metadata, captions, upload parsing
        segmenter.py       Transcript chunking with timestamps
        llm.py             LLM client + deterministic offline generator
        validation.py      Output quality checks and de-duplication
        srs.py             SM-2 spaced-repetition scheduler
        analytics.py       Progress metrics + weak-topic detection
        pipeline.py        End-to-end processing orchestration
    requirements.txt
    .env.example
    smoke_test.py          End-to-end API test
    seed_demo.py           Seed a demo account + DBMS lecture
  frontend/
    app/                   Landing + auth + in-app pages
    components/            Reusable UI (AppSidebar, Topbar, Flashcard, ...)
    lib/                   API client, theme tokens, formatters
```

---

## Getting started

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env      # then edit SECRET_KEY etc.
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs · Health: http://localhost:8000/health

By default it uses a local SQLite file, so no database server is required. To use
PostgreSQL, set `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql+psycopg2://lectureloop:password@localhost:5432/lectureloop
```

### 2. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                                # http://localhost:3000
```

### 3. Optional: enable real LLM generation

Leave `LLM_API_KEY` empty to use the offline generator. To use an
OpenAI-compatible endpoint, set in `backend/.env`:

```
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### 4. Seed a demo account (optional)

```powershell
cd backend
.\.venv\Scripts\python.exe seed_demo.py
```

Creates `demo@lectureloop.app` / `demo1234` with a ready DBMS lecture so the
demonstration script below can run immediately.

---

## API blueprint

| Method | Endpoint                     | Function                                  |
| ------ | ---------------------------- | ----------------------------------------- |
| POST   | `/auth/register`             | Create an account                         |
| POST   | `/auth/login`                | Authenticate a user                       |
| GET    | `/auth/me`                   | Current user                              |
| PATCH  | `/users/me`                  | Update profile and study preferences      |
| POST   | `/lectures`                  | Submit a YouTube URL or transcript        |
| GET    | `/lectures`                  | List the user's lectures                  |
| GET    | `/lectures/{id}`             | Lecture details and processing status     |
| POST   | `/lectures/{id}/generate`    | Re-run material generation                |
| GET    | `/lectures/{id}/transcript`  | Timestamped transcript segments           |
| GET    | `/lectures/{id}/notes`       | Topic-wise notes                          |
| GET    | `/lectures/{id}/flashcards`  | Flashcards                                |
| GET    | `/lectures/{id}/quiz`        | Quiz for the lecture                      |
| GET    | `/flashcards`                | All flashcards (filters: lecture/topic/difficulty/bookmarked) |
| GET    | `/flashcards/due`            | Cards due for review                      |
| POST   | `/flashcards/{id}/review`    | Save a recall rating and schedule next review |
| POST   | `/flashcards/{id}/bookmark`  | Toggle bookmark                           |
| POST   | `/quizzes/{id}/submit`       | Submit and grade an attempt (server-side) |
| GET    | `/analytics`                 | Learning progress, weak topics, due counts |
| GET    | `/revision/due`              | Revision calendar data                    |

### Processing statuses

`queued -> processing -> generating -> validating -> ready`

Failure states: `invalid_url`, `transcript_unavailable`, `empty_transcript`,
`processing_failed` — each with a clear recovery message in the UI.

---

## Pages

- **Landing** — hero, workflow, features, product preview
- **Student Dashboard** — metrics, recent lectures, revision due, topic strength
- **Generate Study Material** — URL or transcript, language/difficulty, status stepper
- **Lecture Workspace** — topic nav, notes, definitions, source/timestamp panel
- **Flashcard Study Mode** — reveal, Again/Hard/Good/Easy, bookmarks, progress
- **Quiz Center** — MCQs, filters, results with mistake explanations
- **Revision Calendar** — due, overdue, upcoming reviews, workload estimate
- **Progress Analytics** — score trend, topic/difficulty accuracy, weak topics
- **Settings** — profile, study preferences, notifications, privacy

---

## Design system

The UI deliberately reuses the **LegalAI** visual language: a premium, light
enterprise-SaaS look with a warm ivory canvas, restrained purple-to-blue
gradients, soft lavender/sage surfaces, glass cards and Inter typography. All
colors live as shared tokens in `frontend/app/globals.css` and
`frontend/lib/theme.js` — no page hardcodes its own palette.

| Token          | Hex       | Use                                   |
| -------------- | --------- | ------------------------------------- |
| Royal purple   | `#7C3AED` | Primary actions, active navigation    |
| Lavender       | `#A855F7` | Gradient accents, highlights          |
| Electric blue  | `#2563EB` | Links, secondary series               |
| Deep navy      | `#0F172A` | Headings, primary text                |
| Warm ivory     | `#FAF8F5` | Page background                       |
| Light lavender | `#F6F2FF` | Tinted panels, selected cards         |
| Soft sage      | `#F3FAF5` | Progress and success panels           |
| Emerald        | `#22C55E` | Success, completed tasks              |
| Mint           | `#86EFAC` | Soft progress accents                 |
| Cyan           | `#06B6D4` | Small chart accents                   |
| Indigo         | `#6366F1` | Secondary chart series                |

Accessibility: keyboard navigation, visible focus rings, semantic headings,
accessible contrast, and `prefers-reduced-motion` support.

---

## Testing

```powershell
cd backend
.\.venv\Scripts\python.exe smoke_test.py
```

Covers: registration/login, transcript ingestion, the full pipeline, notes /
flashcards / quiz retrieval, flashcard review scheduling, bookmarking, quiz
grading, analytics, cross-user authorization (404 for another user's lecture),
and invalid-URL rejection.

Manual checklist highlights: valid vs invalid URL, missing transcript, empty and
long transcripts, malformed AI output rejection, duplicate flashcard removal,
MCQs with exactly one correct answer, mobile layout, and review-date consistency.

---

## Demonstration script

Using the seeded DBMS lecture (or any systems/DS lecture):

1. Log in and open **Generate Material**, paste a YouTube URL (or upload a transcript).
2. Show the processing status advance `Queued -> Ready`.
3. Open the **Lecture Workspace** and read the topic-wise notes.
4. Study a **flashcard**, reveal the answer, and click the timestamp to revisit the source.
5. Take an **MCQ quiz**, answer one question incorrectly.
6. See the topic flagged under **Weak topics**.
7. Open the **Revision Calendar** to show the scheduled review and due items.

This shows the app does more than generate text — it supports the whole learning
loop.

---

## Scope note

The core workflow (transcript -> notes + flashcards -> database -> study page)
is complete and reliable. Quizzes, timestamps, review scheduling and analytics
build on top of it. Optional extensions (concept map, exam mode, multiple
languages) are intentionally left for later so the core stays dependable.
