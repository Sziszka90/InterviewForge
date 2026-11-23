from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .endpoints import router
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_database()
    yield


app = FastAPI(title="InterviewForge API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
