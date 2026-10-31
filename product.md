# CivicLens AI: Product Document

Smart Civic Issue Detection System. B.Tech minor project (7th sem, 2026–27), MAIT.
Team: Aditya Bansal, Dikshit Mahanot, Aryan Gupta. Guide: Dr. Madhukar Chhimwal.

## 1. Vision
A citizen photographs a civic problem, and CivicLens identifies it, estimates urgency, and routes it to the right authority. The AI assists a human reviewer; it never makes the final decision.

**Tagline:** From citizen voices to cleaner cities.
**SDGs:** 11 (primary), 9, 16.

## 2. Problem
- Citizens don't know which department handles what, or where to report.
- Complaints arrive as calls, messages, social posts and web forms, so they are hard to compare or follow up.
- Staff read each complaint by hand, categorize it, judge urgency and forward it. This is slow and inconsistent.

## 3. Users and personas
| Persona | Goal | Key needs |
|---|---|---|
| Citizen (Riya, 24) | Report a pothole in 30 seconds | Photo-first form, auto location, tracking number, status updates |
| Authority officer (Mr. Sharma) | Clear the queue fairly and fast | Sorted queue, AI category and confidence, explainable priority, assign and update |
| Admin | Keep the system healthy | Manage users, departments, categories and thresholds, audit the AI's mistakes |

## 4. Scope
**In (MVP):** potholes, garbage accumulation, water leakage, "other". Image upload, AI classification, priority, tracking, authority dashboard, analytics, human review.
**Out:** guaranteed physical resolution, direct control of govt work orders, city-wide production rollout.
**Stretch:** duplicate detection, multilingual UI (Hindi), hotspot clustering, mobile PWA, notifications (email/SMS), feedback and rating.

## 5. Core features
### 5.1 Citizen portal
1. Register or log in (email/OTP optional).
2. Report: upload or capture photo, description, location (GPS auto-fill plus a draggable map pin).
3. Instant result: predicted category, confidence, suggested priority, complaint reference (e.g. `CL-2026-000123`).
4. Track by reference: status timeline (Submitted → Under review → Assigned → In progress → Resolved/Rejected).
5. "My complaints" list. The citizen can correct the category before submit.

### 5.2 AI engine
- Image classifier (transfer learning, MobileNetV2/EfficientNet-B0) returning `{category, confidence}`.
- Confidence below the threshold (default 0.6) sets `needs_review = true`.
- Model version stored with every prediction. Human corrections are stored as future training data.

### 5.3 Priority engine (explainable rule-based)
`score = category base + keyword boost + repeat-location boost + confidence note`, mapped to High / Medium / Low. It returns the **reasons** as text (e.g. "Water leak: base 3; keyword 'school': +2"). Reviewers can override it, and the override is logged.

### 5.4 Authority dashboard
- Queue with filters (status, category, priority, date, needs-review) and search by reference.
- Detail view: image, map, AI result, priority reasons, history.
- Actions: confirm or correct the category, set priority, assign a department or officer, change status with a comment.
- Review-queue tab for low-confidence cases.

### 5.5 Analytics
Counts by category, status and priority; average resolution time; complaints per day; hotspot map (Leaflet markers/heat); model accuracy vs human corrections.

### 5.6 Admin
Manage users and roles, departments (category → department mapping), threshold and priority config, and an audit log.

## 6. User flows
**Report:** open portal → login → upload photo → location auto-detected → add description → submit → backend validates → model predicts → priority computed → saved → reference shown.
**Triage:** officer opens queue → sorts by priority → opens complaint → reviews AI result → corrects if needed → assigns a department → updates status → the citizen sees the change.

## 7. Architecture
```
Next.js (citizen + authority UI)
   │ HTTPS / JWT
FastAPI ── Auth · Complaint service · Priority engine · Analytics
   │            │
   │       ML inference module (TensorFlow/Keras model loaded at startup)
   ├── PostgreSQL (RDS)
   └── Object storage (S3) for images
Deployed on AWS (EC2 or App Runner + RDS + S3).
```
Design rules: the ML module sits behind a `classify(image) -> (category, confidence)` interface so the model can be swapped or stubbed. Images are served only through authorized URLs.

## 8. Data model
`users(id, name, email, phone, role, password_hash, created_at)`
`departments(id, name, categories)`
`complaints(id, ref, user_id, title, description, lat, lng, category, confidence, needs_review, priority, priority_reasons, status, created_at, updated_at)`
`images(id, complaint_id, url, is_primary, uploaded_at)`
`predictions(id, complaint_id, category, confidence, model_version, created_at)`
`assignments(id, complaint_id, authority_id, department_id, assigned_at)`
`status_history(id, complaint_id, status, comment, updated_by, updated_at)`

## 9. API surface
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | /auth/register, /auth/login | public | Account and token |
| POST | /complaints | citizen | Upload, classify, prioritize, save |
| GET | /complaints/{ref} | owner/staff | Details and timeline |
| GET | /complaints/mine | citizen | Own complaints |
| GET | /complaints | staff | Queue with filters |
| PATCH | /complaints/{id} | staff | Assign, status, override category or priority |
| GET | /analytics/summary, /analytics/hotspots | staff | Dashboard data |
| CRUD | /admin/users, /admin/departments | admin | Management |

## 10. ML plan
- **Classes:** pothole, garbage, water_leak, other (clean roads, buildings, random scenes).
- **Data:** public datasets (Kaggle pothole, garbage and waste sets, Roboflow/TrashNet-style sets), supplemented with self-taken photos. Target 500+ images per class, with a 70/15/15 split and no leakage.
- **Training:** augmentation (flip, rotate, brightness, crop), freeze the backbone, train the head, then fine-tune the top layers.
- **Evaluation:** accuracy, precision, recall, F1, confusion matrix, and performance by lighting and angle. Target ≥ 85% macro-F1 on the test set.
- **Safety net:** threshold-based human review, plus an "other" class so non-civic images don't get forced into a category.
- **Export:** `.keras` model with a preprocessing layer, plus a `model_card.md` documenting data, metrics and limits.

## 11. Non-functional requirements
- **Security:** JWT auth, role-based access, hashed passwords, file type and size validation (JPEG/PNG/WebP, ≤ 8 MB), re-encoding images, rate limiting, parameterized queries.
- **Privacy:** collect minimal data, strip EXIF except GPS, avoid storing faces and number plates (optional blur), restrict image access.
- **Performance:** prediction under 3 s on CPU, and the queue page loads under 2 s for 1k complaints.
- **Reliability:** DB migrations, backups, health endpoint, structured logs.
- **Usability:** mobile-first, accessible (WCAG AA basics), reporting in ≤ 3 taps/steps.

## 12. Success metrics
- Macro-F1 ≥ 85% on the held-out test set.
- ≥ 90% of test complaints submitted end to end without errors.
- Median triage time in the demo reduced against a manual baseline (timed).
- Usability: 5+ test users complete a report without help.

## 13. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Small or biased dataset | Transfer learning, augmentation, own photos, honest limits in the report |
| Wrong AI prediction | Confidence threshold, human review, correction logging |
| Cloud cost | Deploy only for the demo, set budget alerts, run locally by default |
| Location inaccuracy | Draggable map pin and manual address |
| Abuse or spam reports | Rate limits, reject and escalate flow |
| Scope creep | Freeze the MVP; stretch goals only after Month 3, week 2 |

## 14. Deliverables
Working prototype (portal, dashboard, API, model), source repo, the 5 design diagrams, trained model plus model card, test and evaluation report, final report, demo video and presentation.
