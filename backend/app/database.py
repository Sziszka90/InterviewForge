import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def make_database_engine():
    provider = os.getenv("DB_PROVIDER", "url" if os.getenv("DATABASE_URL") else "sqlite").lower()

    if provider == "azure_sql":
        server = os.environ["SQL_SERVER"]
        database = os.environ["SQL_DATABASE"]
        url = URL.create(
            "mssql+mssqlpython",
            username=os.getenv("SQL_USER", ""),
            password=os.getenv("SQL_PASSWORD"),
            host=server,
            port=1433,
            database=database,
            query={
                "authentication": os.getenv("SQL_AUTHENTICATION", "ActiveDirectoryMSI"),
                "encrypt": "yes",
            },
        )
        return create_engine(url, pool_pre_ping=True)

    if provider == "url":
        database_url = os.environ["DATABASE_URL"]
    elif provider == "sqlite":
        database_url = os.getenv("DATABASE_URL", "sqlite:///./interviewforge.db")
    else:
        raise ValueError("DB_PROVIDER must be 'sqlite', 'url', or 'azure_sql'.")

    engine_options = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=engine_options, pool_pre_ping=True)


engine = make_database_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
