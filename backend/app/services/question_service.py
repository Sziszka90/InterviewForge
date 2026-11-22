from ..models import Question
from ..repositories import QuestionRepository


class QuestionNotFoundError(LookupError):
    pass


class QuestionService:
    """Application rules for browsing and maintaining interview questions."""

    def __init__(self, repository: QuestionRepository):
        self.repository = repository

    def list_questions(
        self,
        technology: str,
        phase: str | None = None,
        section: str | None = None,
        search: str | None = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> list[Question]:
        return self.repository.list_questions(technology, phase, section, search, limit, offset)

    def list_technologies(self) -> set[str]:
        return self.repository.list_technologies()

    def list_phases(self, technology: str) -> list[str]:
        return self.repository.list_phases(technology)

    def list_sections(self, technology: str, phase: str | None = None) -> list[str]:
        return self.repository.list_sections(technology, phase)

    def create_question(self, data: dict) -> Question:
        question = Question(**data)
        try:
            self.repository.add(question)
            self.repository.commit()
            self.repository.refresh(question)
            return question
        except Exception:
            self.repository.rollback()
            raise

    def update_question(self, question_id: int, data: dict) -> Question:
        question = self.repository.get(question_id)
        if question is None:
            raise QuestionNotFoundError(question_id)
        try:
            for key, value in data.items():
                setattr(question, key, value)
            self.repository.commit()
            self.repository.refresh(question)
            return question
        except Exception:
            self.repository.rollback()
            raise

    def delete_question(self, question_id: int) -> None:
        question = self.repository.get(question_id)
        if question is None:
            raise QuestionNotFoundError(question_id)
        try:
            self.repository.delete(question)
            self.repository.commit()
        except Exception:
            self.repository.rollback()
            raise
