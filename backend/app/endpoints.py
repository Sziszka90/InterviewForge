from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from .database import get_db
from .repositories import QuestionRepository
from .services import QuestionNotFoundError, QuestionService

router = APIRouter(prefix="/api")


class QuestionIn(BaseModel):
    technology: str = Field(min_length=1, max_length=40)
    phase: str = Field(min_length=1, max_length=120)
    section: str = Field(min_length=1, max_length=160)
    question: str = Field(min_length=1, max_length=600)
    answer: str = Field(min_length=1)


class QuestionOut(QuestionIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


def get_question_service(db: Session = Depends(get_db)) -> QuestionService:
    return QuestionService(QuestionRepository(db))


@router.get("/technologies")
def list_technologies(service: QuestionService = Depends(get_question_service)):
    available = service.list_technologies()
    return [
        {"id": value.lower(), "name": value, "available": value in available}
        for value in [".NET", "Angular", "Python"]
    ]


@router.get("/phases")
def list_phases(
    technology: str = Query("Python"),
    service: QuestionService = Depends(get_question_service),
):
    return service.list_phases(technology)


@router.get("/sections")
def list_sections(
    technology: str = Query("Python"),
    phase: str | None = Query(None),
    service: QuestionService = Depends(get_question_service),
):
    return service.list_sections(technology, phase)


@router.get("/questions", response_model=list[QuestionOut])
def list_questions(
    technology: str = Query("Python"),
    phase: str | None = Query(None),
    section: str | None = Query(None),
    search: str | None = Query(None, min_length=1),
    limit: int = Query(1000, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    service: QuestionService = Depends(get_question_service),
):
    return service.list_questions(technology, phase, section, search, limit, offset)


@router.post("/questions", response_model=QuestionOut, status_code=201)
def create_question(
    payload: QuestionIn,
    service: QuestionService = Depends(get_question_service),
):
    return service.create_question(payload.model_dump())


@router.put("/questions/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    payload: QuestionIn,
    service: QuestionService = Depends(get_question_service),
):
    try:
        return service.update_question(question_id, payload.model_dump())
    except QuestionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Question not found") from exc


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    service: QuestionService = Depends(get_question_service),
):
    try:
        service.delete_question(question_id)
    except QuestionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Question not found") from exc
