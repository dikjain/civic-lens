#!/usr/bin/env bash
# Starts backend (:8000) and frontend (:3000). First run installs dependencies.
set -e
cd "$(dirname "$0")"
[ -d backend/.venv ] || { /opt/homebrew/bin/python3.12 -m venv backend/.venv && backend/.venv/bin/pip install -q -r backend/requirements.txt -r backend/requirements-ml.txt; }
[ -d frontend/node_modules ] || (cd frontend && npm install)
(cd backend && .venv/bin/uvicorn app.main:app --port 8000) &
(cd frontend && npm run dev) &
trap 'kill 0' EXIT
wait
