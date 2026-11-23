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

Copy `backend/.env.example` to `backend/.env` and configure `DB_PROVIDER=azure_sql`, `SQL_SERVER=projects-server-sziszka90.database.windows.net`, and `SQL_DATABASE=InterviewForgeDB`. Install the updated requirements with `pip install -r backend/requirements.txt`.

In Azure Container Apps, the driver defaults to `ActiveDirectoryMSI` and uses the app's system-assigned identity. Enable that identity and create a database user for it. For local development, sign in with `az login` and set `SQL_AUTHENTICATION=ActiveDirectoryDefault`. The SQL server firewall must allow your connection, and the database identity needs the necessary permissions for the app to create tables and seed data on startup. See Microsoft's [driver documentation](https://learn.microsoft.com/en-us/sql/connect/python/mssql-python/sqlalchemy-integration).

The schema is created and Python seed questions are inserted on startup; existing question records are retained. SQLAlchemy database URLs also support PostgreSQL, MySQL, SQL Server, and other dialects when their DBAPI driver is installed.

## API

- `GET /api/technologies` — track choices and availability
- `GET /api/sections?technology=Python` — topic filters
- `GET /api/questions?technology=Python&section=...` — flashcards
- `POST /api/questions` — add a question and answer
- `PUT /api/questions/{id}` — edit a question
- `DELETE /api/questions/{id}` — remove a question

## GitHub deployment

`.github/workflows/deploy.yml` deploys on pushes to `main` and can also be started manually. It builds the backend image and pushes it to GitHub Container Registry, then updates the existing Azure Container App in the `projects` resource group. It builds Angular and publishes the files to the existing Azure Static Web App. Static Web Apps hosts static files rather than a frontend container. Angular's output is `dist/interviewforge/browser`.

The frontend deployment uses the Static Web App's GitHub authorization policy and passes a GitHub identity token to the deployment action.

Set these repository **variables** under GitHub Settings → Secrets and variables → Actions → Variables:

- `BACKEND_API_URL`: the backend's HTTPS origin, without `/api` (for example, `https://interview-forge-backend.grayisland-b17ef594.polandcentral.azurecontainerapps.io`).

Set these repository **secrets** under Actions → Secrets:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_BRAVE_SAND_02D0B4103`: the deployment token from the Static Web App's **Manage deployment token** page.
- `INTERVIEWFORGEBACKEND_AZURE_CLIENT_ID`, `INTERVIEWFORGEBACKEND_AZURE_TENANT_ID`, and `INTERVIEWFORGEBACKEND_AZURE_SUBSCRIPTION_ID`: the client, tenant, and subscription IDs for an Azure identity configured for GitHub Actions OpenID Connect. Configure a federated credential for this repository's `main` branch and grant the identity permission to update the backend Container App, such as Contributor scoped to that app.

The Container App must be able to pull `ghcr.io/<github-owner>/interviewforge-backend`. Make the package public or configure the app's GHCR registry credentials before deployment. Configure the app's ingress target port as `8000`, and set its database environment variables as described above. Set `CORS_ORIGINS` on the backend to the Static Web App's HTTPS origin (no trailing slash); use a comma-separated list to allow additional origins.

The Azure portal may have created a separate Static Web Apps workflow when the frontend resource was created. Remove or disable that workflow if it deploys the same resource, to avoid duplicate deployments. GitHub must have Actions enabled for the repository.
