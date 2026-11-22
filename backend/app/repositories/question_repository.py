from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Question


class QuestionRepository:
    """SQLAlchemy queries and persistence operations for question records."""

    def __init__(self, db: Session):
        self.db = db

    def list_questions(
        self,
        technology: str,
        phase: str | None = None,
        section: str | None = None,
        search: str | None = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> list[Question]:
        query = select(Question).where(Question.technology.ilike(technology))
        if phase:
            query = query.where(Question.phase == phase)
        if section:
            query = query.where(Question.section == section)
        if search:
            query = query.where(Question.question.ilike(f"%{search}%"))
        query = query.order_by(Question.id).offset(offset).limit(limit)
        return list(self.db.scalars(query).all())

    def list_technologies(self) -> set[str]:
        values = self.db.scalars(select(Question.technology).distinct()).all()
        return set(values)

    def list_phases(self, technology: str) -> list[str]:
        query = (
            select(Question.phase)
            .where(Question.technology.ilike(technology))
            .group_by(Question.phase)
            .order_by(func.min(Question.id))
        )
        return list(self.db.execute(query).scalars().all())

    def list_sections(self, technology: str, phase: str | None = None) -> list[str]:
        query = select(Question.section).where(Question.technology.ilike(technology))
        if phase:
            query = query.where(Question.phase == phase)
        query = query.group_by(Question.section).order_by(func.min(Question.id))
        return list(self.db.execute(query).scalars().all())

    def get(self, question_id: int) -> Question | None:
        return self.db.get(Question, question_id)

    def exists(self, technology: str, section: str, question: str) -> bool:
        query = select(Question.id).where(
            Question.technology == technology,
            Question.section == section,
            Question.question == question,
        )
        return self.db.scalar(query) is not None

    def add(self, question: Question) -> Question:
        self.db.add(question)
        self.db.flush()
        return question

    def delete(self, question: Question) -> None:
        self.db.delete(question)

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def refresh(self, question: Question) -> None:
        self.db.refresh(question)
