from sqlalchemy import Integer, Unicode, UnicodeText, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (UniqueConstraint("technology", "section", "question", name="uq_question"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    technology: Mapped[str] = mapped_column(Unicode(40), index=True)
    phase: Mapped[str] = mapped_column(Unicode(120))
    section: Mapped[str] = mapped_column(Unicode(120), index=True)
    question: Mapped[str] = mapped_column(Unicode(600))
    answer: Mapped[str] = mapped_column(UnicodeText)
