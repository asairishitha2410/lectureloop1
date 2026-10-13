from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import analytics, auth, flashcards, lectures, quizzes, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="LectureLoop API",
    version="1.0.0",
    description=(
        "Transform educational YouTube lectures into source-linked notes, "
        "flashcards, quizzes and personalised revision schedules."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lectures.router)
app.include_router(flashcards.router)
app.include_router(quizzes.router)
app.include_router(analytics.router)


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "llm_enabled": settings.llm_enabled}


@app.get("/", tags=["system"])
def root() -> dict:
    return {"name": "LectureLoop API", "docs": "/docs", "health": "/health"}
