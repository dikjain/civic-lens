# CivicLens AI: Smart Civic Issue Detection System

Citizens report civic issues (pothole, garbage, water leak) with a photo; AI classifies them, suggests an
explainable priority, and authorities triage on a dashboard. See `product.md` (what) and `plan.md` (how).

## Run
```
./run.sh        # backend http://localhost:8000 (docs at /docs), frontend http://localhost:3000
```
Demo logins: `citizen@demo.com / citizen123`, `officer@demo.com / officer123`, `admin@demo.com / admin123`.
First start seeds 24 simulated complaints.

## What is real vs simulated
| Part | Status |
|---|---|
| Auth (JWT, roles), complaint API, priority engine, status history, analytics, admin, upload validation | Real |
| Next.js citizen portal, officer dashboard, analytics, admin page, Hindi UI, Leaflet maps | Real |
| Image classifier | **Real** MobileNetV2 trained on 1,000 cleaned public images (`ml/model.keras`): 85.5% accuracy / macro-F1 0.848 on 138 held-out images; see `docs/model_card.md`. Falls back to a colour-heuristic stub only if the model file is missing |
| Duplicate detection | Real (location + image hash) |
| Notifications | In-app are real; the "email" is **simulated** (printed in the server log) |
| OTP email verification | Logic is real; delivery is **simulated** (demo mode shows the code on screen) |
| Seed complaints and photos | Simulated demo data (24 complaints on first start) |
| DB | SQLite by default; set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db` for PostgreSQL (tests pass on Postgres 16) |
| AWS deployment, S3 | **Not done** (left to the team) |

## Tests
`cd backend && .venv/bin/python -m pytest -q` (backend) and `node tests/e2e/e2e.mjs` (browser, needs `npm i -g playwright` and the app running)

## Docs
`docs/final_report.md`, `docs/diagrams.md` (5 diagrams), `docs/model_card.md`, `docs/test_report.md`, `docs/demo.webm` (demo video), `docs/screenshots/`.

## Neon (current database)
`neon init` + `neon deploy` created `neon.ts` and `.env.local` (gitignored) with `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`. The backend loads `.env.local` automatically: pooled URL for requests, unpooled for table creation. `./run.sh` then uses Neon with no other setup. Tests always use a local SQLite file.

## Live deployment
- Frontend: https://civic-lens-web.onrender.com
- Backend API: https://civic-lens-api-5k0s.onrender.com (`/health`, `/docs`)
- Both run on Render's free plan in Singapore with Neon Postgres, and sleep after ~15 min idle (first request takes 30-60 s). Browser tests against the live site: `BASE_URL=https://civic-lens-web.onrender.com node tests/e2e/e2e.mjs`.

## Deploy (Render backend + Vercel frontend)
**Backend (Render Web Service):** Language Python, Region Singapore, Root Directory `backend`, Build `pip install -r requirements.txt`, Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, Free plan. Env vars: `PYTHON_VERSION=3.12.8`, `DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (Neon direct), `SECRET_KEY` (any long random string), `CORS_ORIGINS` (the Vercel URL). The deployed backend runs the 9 MB TFLite model (`backend/model/model.tflite`, no TensorFlow) and keeps uploaded images in the database.
**Frontend (Vercel):** Root Directory `frontend`, env `NEXT_PUBLIC_API_URL` = the Render backend URL.
To regenerate the TFLite model after retraining, convert `ml/model.keras` with `tf.lite.TFLiteConverter.from_keras_model`.

## Use your own Postgres
`DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db ./run.sh` (tables and demo data are created on first start; there are no migrations, so use a fresh database when the schema changes).

## Retrain the model
`cd ml && .venv/bin/python prepare_data.py && .venv/bin/python train.py && .venv/bin/python evaluate.py` (the cleaning step used for the shipped model is described in `docs/model_card.md`; `prepare_data.py` alone gives the noisier first dataset) (Python 3.12 venv with TensorFlow already set up in `ml/.venv`).
