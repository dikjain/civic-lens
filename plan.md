# CivicLens AI: Execution Plan

Companion to `product.md`. 12 weeks, 3 people. Dates assume a start of early October 2026.

## 1. Roles
| Person | Primary | Secondary |
|---|---|---|
| Aditya | Frontend (citizen portal, authority dashboard) | UI design, usability tests |
| Dikshit | Backend, DB, auth, AWS deploy | Priority engine, API tests |
| Aryan | ML (data, training, evaluation) | Inference integration, analytics |

Rituals: a 15-min sync twice a week, a weekly demo to the guide, and a branch-per-feature workflow with PR review (Git, `main` always runnable).

## 2. Repo structure
```
civic lens/
├── product.md, plan.md, README.md
├── docs/            diagrams, model_card.md, test report, final report
├── frontend/        Next.js (App Router, TypeScript, Tailwind)
├── backend/         FastAPI, SQLAlchemy, Alembic, pytest
│   └── app/{api,core,models,schemas,services,ml}
├── ml/              notebooks, data scripts, train.py, evaluate.py, model.keras
├── infra/           docker-compose.yml, Dockerfiles, AWS notes
└── .github/workflows/ci.yml
```

## 3. Tech decisions
- Frontend: Next.js + TypeScript + Tailwind, Leaflet (maps), Recharts (charts).
- Backend: FastAPI, SQLAlchemy 2, Alembic, PyJWT, Pydantic.
- DB: PostgreSQL (SQLite for quick local tests only).
- ML: TensorFlow/Keras (MobileNetV2 or EfficientNet-B0). Use Python 3.11 or 3.12 for TensorFlow compatibility, and keep the ML code behind the `classify()` interface.
- Storage: local disk in dev, S3 in prod.
- Deploy: Docker; AWS EC2 or App Runner + RDS + S3.
- CI: GitHub Actions running lint, backend tests and the frontend build.

## 4. Phase plan

### Month 1: Foundation (weeks 1–4)
**Week 1: Requirements and design**
- Freeze categories (4 classes), roles and the MVP feature list.
- Produce the 5 diagrams (context, DFD, use case, architecture, ER) and the UI wireframes (report, track, queue, detail, analytics).
- Set up the repo, branching, CI skeleton and `.env` conventions.
- *Done when:* the guide approves the design, and the repo and CI are green.

**Week 2: Skeletons**
- Backend: project layout, config, DB models plus the first Alembic migration, `/health`, register/login with JWT and roles.
- Frontend: app shell, auth pages, layout, API client.
- ML: collect datasets, clean and dedupe, and write the labelling and split scripts.
- *Done when:* a user can register and log in from the UI against a real DB.

**Week 3: Baseline model and complaint API**
- ML: baseline classifier trained, with first metrics and a confusion matrix.
- Backend: `POST /complaints` (validation, storage, stub classifier), `GET /complaints/{ref}`.
- Frontend: report form (upload, preview, description).
- *Done when:* a complaint can be submitted and stored end to end with the stubbed classifier.

**Week 4: Integrate the baseline and milestone review**
- Load the real model into the backend, store predictions with the model version, and apply the confidence threshold.
- Frontend: location pick (GPS + map pin), result screen with reference.
- Month 1 demo and guide review.
- *Done when:* the citizen flow works with the real model.

### Month 2: Core product (weeks 5–8)
**Week 5: Priority engine and tracking**
- Implement the rule-based priority with reasons, and unit-test it thoroughly.
- Status history, the tracking page and a "My complaints" list.

**Week 6: Authority dashboard**
- `GET /complaints` with filters, sorting and pagination, plus `PATCH /complaints/{id}`.
- Queue, detail view, assign, status update and override (all logged).

**Week 7: Review workflow and departments**
- Review-queue tab for low-confidence cases, with correction logging.
- Departments with a category → department mapping, and admin pages for users and departments.
- ML: improve the model (more data, fine-tuning, error analysis).

**Week 8: Hardening and Month 2 review**
- Security pass (authorization on every route, upload validation, rate limiting).
- Integration tests for upload → inference → store → dashboard.
- Month 2 demo. *Done when:* the full citizen-to-authority loop works with all roles.

### Month 3: Polish, evaluate, ship (weeks 9–12)
**Week 9: Analytics**
- Backend summary and hotspot endpoints; frontend charts and Leaflet hotspot map.
- Stretch (only if on schedule): duplicate detection by proximity plus image similarity.

**Week 10: Testing and evaluation**
- Final model evaluation (accuracy, precision, recall, F1, confusion matrix, error analysis) and the model card.
- Usability tests with 5+ users and timed triage vs a manual baseline.
- Bug bash, with UI polish and mobile checks.

**Week 11: Deployment**
- Dockerize, set up RDS and S3, deploy to AWS, add a budget alert, and seed demo data.
- Smoke tests on the deployed app.

**Week 12: Documentation and defense**
- Final report, test report, demo video, slides and README (setup, run, screenshots).
- Dry runs of the defense. Freeze the code.

## 5. Task checklist
**Backend**
- [ ] Config, DB session, models, Alembic migrations
- [ ] Auth (register, login, JWT, roles)
- [ ] Upload validation, EXIF strip, storage abstraction (local/S3)
- [ ] Classifier interface plus Keras implementation plus stub
- [ ] Priority engine plus unit tests
- [ ] Complaint CRUD, filters, status history
- [ ] Analytics endpoints
- [ ] Admin endpoints, rate limiting, audit log
- [ ] pytest suite (unit plus integration)

**Frontend**
- [ ] Auth pages, protected routes by role
- [ ] Report flow (upload, camera, map, result)
- [ ] Tracking and "My complaints"
- [ ] Authority queue, detail, actions
- [ ] Review tab, admin pages
- [ ] Analytics charts and hotspot map
- [ ] Responsive and accessibility pass

**ML**
- [ ] Dataset collection, cleaning, dedupe, split
- [ ] Augmentation pipeline
- [ ] Baseline, then fine-tuned model
- [ ] Evaluation script, confusion matrix, error analysis
- [ ] Export `.keras`, then the model card

**DevOps and docs**
- [ ] Dockerfiles and docker-compose
- [ ] CI on GitHub Actions
- [ ] AWS deployment and budget alert
- [ ] Diagrams, final report, demo video

## 6. Testing strategy
| Level | What | Tool |
|---|---|---|
| Unit | Priority rules, validators, status transitions | pytest |
| Integration | Upload → inference → DB → API | pytest and httpx |
| Model | Metrics on the held-out set, robustness to lighting and blur | evaluate.py |
| UI | Key flows (report, triage) | Playwright (optional) |
| Security | Authorization bypass, bad files, SQL injection attempts | manual checklist plus tests |
| Usability | 5+ users, task completion | observation sheet |

## 7. Definition of done
A feature counts as done when it is merged via PR, has tests, passes CI, is documented in the README or docs, and has been demoed.

## 8. Milestones and demo scripts
- **M1 (end of week 4):** register → report with photo → AI result → reference.
- **M2 (end of week 8):** the officer sees the queue → corrects → assigns → the citizen sees updated status.
- **M3 (end of week 12):** a deployed system with analytics, the evaluation report and a polished demo.

## 9. Risk watchlist
| Risk | Trigger | Response |
|---|---|---|
| Dataset too small or poor | Macro-F1 < 75% in week 4 | Add data, merge classes, lean on the "other" class and human review |
| TensorFlow install issues | Python version mismatch | Pin Python 3.11/3.12, use Docker for ML |
| Schedule slip | A milestone is missed by more than 3 days | Cut stretch goals (duplicates, Hindi, notifications) |
| AWS cost or complexity | Budget alert fires | Fall back to a single EC2 or a local demo |
| Merge conflicts | Frequent breakage | Small PRs, feature branches, CI gate |

## 10. First 7 steps to start
1. Create the GitHub repo and add the 3 collaborators.
2. Commit `product.md`, `plan.md` and the folder structure.
3. Agree on the 4 categories and collect sample datasets.
4. Draw the 5 diagrams and the wireframes.
5. Set up the backend skeleton with Postgres in Docker.
6. Set up the Next.js app and the API client.
7. Run the first weekly demo with the guide.

---
## Status (end of build)
Done: backend, frontend, admin, analytics, Leaflet maps, Hindi UI, duplicate detection, notifications, simulated OTP, real model (macro-F1 0.848), tests (backend + 24-step browser E2E), diagrams, model card, test report, final report, demo video.
Left for the team: AWS/S3 deployment, real email/SMS delivery, usability sessions with real users, and pointing `DATABASE_URL` at the team's own Postgres.
