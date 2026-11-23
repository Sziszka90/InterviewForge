#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required. Install Python 3.10 or newer and try again." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required. Install Node.js and npm, then try again." >&2
  exit 1
fi

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  echo "Creating backend virtual environment…"
  python3 -m venv "$VENV_DIR"
fi

if ! "$VENV_DIR/bin/python" -c 'import fastapi, sqlalchemy, uvicorn, dotenv; import importlib.metadata as m; m.version("pyodbc"); m.version("azure-identity")' >/dev/null 2>&1; then
  echo "Installing backend dependencies…"
  "$VENV_DIR/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies…"
  (cd "$FRONTEND_DIR" && npm install)
fi

# Angular CLI may ask about anonymous telemetry on first launch. Keep startup unattended.
export NG_CLI_ANALYTICS=false

BACKEND_PID=""
FRONTEND_PID=""
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "$FRONTEND_PID" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  if [[ -n "$BACKEND_PID" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [[ -n "$FRONTEND_PID" ]]; then wait "$FRONTEND_PID" 2>/dev/null || true; fi
  if [[ -n "$BACKEND_PID" ]]; then wait "$BACKEND_PID" 2>/dev/null || true; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Starting FastAPI at http://localhost:8000 …"
(cd "$BACKEND_DIR" && "$VENV_DIR/bin/uvicorn" app.main:app --reload --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

echo "Starting Angular at http://localhost:4200 …"
(cd "$FRONTEND_DIR" && npm start -- --host 127.0.0.1) &
FRONTEND_PID=$!

echo "Starting servers. Open http://localhost:4200 after Angular reports that it is ready. Press Ctrl+C to stop both."
while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    wait "$BACKEND_PID" || true
    echo "Error: FastAPI stopped unexpectedly." >&2
    exit 1
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    wait "$FRONTEND_PID" || true
    echo "Error: Angular stopped unexpectedly." >&2
    exit 1
  fi
  sleep 1
done
