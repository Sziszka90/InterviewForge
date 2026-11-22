# InterviewForge

An Angular flashcard app backed by a FastAPI API and SQLAlchemy database. Python interview questions are loaded from the supplied question bank on first backend startup; answers are stored in the database with each question.

The backend is split by responsibility: `models/` defines database entities, `endpoints.py` handles HTTP routes and schemas, `services/` holds application operations, and `repositories/` contains SQLAlchemy queries and persistence.

## Run locally

From the repository root, you can start both servers with the helper script:

```bash
./run.sh
```

It creates the Python virtual environment and installs dependencies on first run, installs frontend packages when needed, then serves the app at <http://localhost:4200>. Press Ctrl+C to stop both servers. You can also start each server manually:

Start the API:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Start the Angular app in another terminal:

```bash
cd frontend
npm install
npm start
```

Open <http://localhost:4200>. The Angular dev server proxies `/api` requests to FastAPI at port 8000. API docs are at <http://localhost:8000/docs>.

## Database selection

SQLite is the default and creates `backend/interviewforge.db`. For a generic SQLAlchemy-supported database, set `DB_PROVIDER=url` and `DATABASE_URL` in `backend/.env`.

```bash
DB_PROVIDER=url
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/interviewforge
```

### Azure SQL Database

The backend can use the supplied Azure SQL database. Copy `backend/.env.example` to `backend/.env`, set `DB_PROVIDER=azure_sql`, and configure authentication. For SQL authentication, set `SQL_AUTH_MODE=sql_password`, `SQL_USER`, and `SQL_PASSWORD`. For local interactive Microsoft Entra authentication, set `SQL_AUTH_MODE=entra_interactive`.

Install the Python requirements with `./run.sh` or `pip install -r backend/requirements.txt`, and install Microsoft's ODBC Driver 18 for SQL Server on macOS. Microsoft documents the Homebrew installation steps [here](https://learn.microsoft.com/en-us/sql/connect/odbc/linux-mac/install-microsoft-odbc-driver-sql-server-macos). The Azure SQL server firewall must allow your machine's public IP, and the login needs permission to create and update the app's tables on first startup. Keep `backend/.env` private; it is gitignored.

The schema is created and Python seed questions are inserted on startup; existing question records are retained. SQLAlchemy database URLs also support PostgreSQL, MySQL, SQL Server, and other dialects when their DBAPI driver is installed.

## API

- `GET /api/technologies` — track choices and availability
- `GET /api/sections?technology=Python` — topic filters
- `GET /api/questions?technology=Python&section=...` — flashcards
- `POST /api/questions` — add a question and answer
- `PUT /api/questions/{id}` — edit a question
- `DELETE /api/questions/{id}` — remove a question
