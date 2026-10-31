# Test report

| Level | What was run | Result |
|---|---|---|
| Backend integration (pytest, `backend/tests`) | register/login, upload + classify + priority, invalid file (400), role checks (403), assign + history, analytics, hotspots, admin APIs, self-demotion blocked, duplicate detection, notifications, OTP verify (wrong/right code), real model beats chance on held-out images | 4 tests pass on SQLite and on a fresh PostgreSQL 16 database (the tests assume an empty DB) |
| Browser E2E (Playwright, headless Chromium; `node tests/e2e/e2e.mjs`) | Citizen login/report/track, officer queue + filters + review + assign, citizen sees update, role blocking, admin page, registration, bad upload, unknown ref, wrong password, **real model classifies a real pothole photo**, duplicate flagged, Leaflet map + pin move, notification bell, OTP verification, Hindi toggle persists, hotspot map, logout | 24/24 steps pass. Console errors seen are only the expected 400/401/404 from the negative tests |
| Model evaluation | `ml/evaluate.py` on 138 held-out images | Accuracy 85.5%, macro-F1 0.848 on 138 held-out images (target 0.85; see `model_card.md`) |
| Demo | `node tests/e2e/demo.mjs` records `docs/demo.webm` and `docs/screenshots/` | Done |
| Not tested | Usability sessions with real users, load/performance, mobile devices, deployed AWS environment | Pending |

Note: the E2E suite assumes seeded demo data and a running app (`./run.sh`). Its "real model" steps use fixtures the model classifies confidently; the model is ~79% accurate overall, so it will sometimes misclassify other photos. The browser suite was last run against the live Render deployment (frontend + backend + Neon): 24/24 pass.
