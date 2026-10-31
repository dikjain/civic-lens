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

## Use your own Postgres
`DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db ./run.sh` (tables and demo data are created on first start; there are no migrations, so use a fresh database when the schema changes).

## Retrain the model
`cd ml && .venv/bin/python prepare_data.py && .venv/bin/python train.py && .venv/bin/python evaluate.py` (the cleaning step used for the shipped model is described in `docs/model_card.md`; `prepare_data.py` alone gives the noisier first dataset) (Python 3.12 venv with TensorFlow already set up in `ml/.venv`).
