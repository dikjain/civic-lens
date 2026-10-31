# CivicLens AI: Smart Civic Issue Detection System
**Minor Project Report, B.Tech CST, Maharaja Agrasen Institute of Technology, 2026–27**
Team: Aditya Bansal (03714812723), Dikshit Mahanot (05914812723), Aryan Gupta (07114812723). Guide: Dr. Madhukar Chhimwal.

## Abstract
CivicLens AI lets citizens report civic issues (potholes, garbage, water leaks) with a photo. A computer-vision model classifies the image, an explainable rule suggests a priority, duplicates are flagged, and an authority dashboard supports review, assignment, status tracking and analytics. The AI assists a human reviewer; low-confidence cases go to a review queue.

## 1. Problem statement
Citizens do not know which department to contact, and complaints arrive in inconsistent formats. Staff must read, categorize, prioritize and forward each complaint by hand, which is slow and inconsistent (synopsis §1).

## 2. Objectives
Automate issue classification; simplify citizen reporting; prioritize critical issues with explanations; store a complete history; give authorities a dashboard and analytics; evaluate honestly (synopsis §3).

## 3. Related work
Sukel et al. [10] show multimodal (image + text + location) classification of urban micro-events beats single modality. Shama et al. [11] (CitySolution) classify municipal complaints from images for authorities. Vrabie [12] studies AI image analysis for e-government and notes scalability and data-quality challenges. CivicLens combines these ideas in one student-scale system with explainable priority, human review and privacy controls.

## 4. System design
Diagrams: `docs/diagrams.md` (context, DFD, use case, architecture, ER).
- **Frontend:** Next.js + TypeScript, Leaflet maps, English/Hindi UI.
- **Backend:** FastAPI, SQLAlchemy, JWT auth with citizen/authority/admin roles.
- **Database:** PostgreSQL (SQLite for local default). Tables: users, departments, complaints, images, predictions, assignments, status_history, notifications, otps.
- **AI:** MobileNetV2 transfer learning behind a `classify()` interface (`backend/app/classifier.py`).

## 5. Implementation
**Complaint pipeline** (`POST /complaints`): validate type/size/image → re-encode (strips EXIF) → classify → low confidence ⇒ `needs_review` → priority → duplicate check → store image, prediction, history → notify.
**Priority engine** (`backend/app/priority.py`): category base score + urgent-keyword boost + repeat-location boost, mapped to high/medium/low with the reasons stored and shown. Officers can override; overrides are logged.
**Duplicate detection:** same category, open, within ~30 m, or within ~100 m with a near-identical image (difference hash, Hamming distance ≤ 8).
**Dashboard:** filters (status, category, priority, needs-review, search), review screen to correct category/priority, assign department, change status with comment.
**Analytics:** totals, by category/status/priority/day, average resolution time, AI-human agreement, hotspot map.
**Admin:** user roles, departments, system config.
**Notifications and OTP:** in-app notifications on submission and every officer update. Email delivery and OTP code delivery are **simulated** (logged to the server console; demo mode returns the OTP in the response).
**Hindi UI:** toggle in the navigation bar for citizen-facing pages and badges (officer/admin screens are English).

## 6. Dataset and model
1,000 cleaned images from Hugging Face datasets and Wikimedia Commons (see `docs/model_card.md`), 70/15/15 split, MobileNetV2 with class weights. Web-scraped labels were cleaned with a CLIP zero-shot filter plus manual review; this lifted macro-F1 from 0.763 (raw data) to 0.848.
**Held-out test results (138 images):** accuracy 85.5%, macro-F1 0.848. Pothole F1 0.94, water leak 0.86, garbage 0.85, other 0.75. The 0.85 target is met within rounding. The test set is small and the images are web photos rather than local ones, so real-world accuracy is likely lower; the confidence threshold and human review exist to contain this error.

## 7. Testing
See `docs/test_report.md`: 4 backend tests (SQLite and PostgreSQL), 24 browser E2E steps, model evaluation. Usability sessions with real users have not been run.

## 8. Privacy, fairness and safety
Minimal data collected; EXIF removed from stored images; access to images requires a valid token and ownership/staff role; role-based API access; passwords hashed (PBKDF2); AI results are advisory; corrections are recorded; abusive-report escalation is a documented future item (reject status exists).

## 9. Limitations
Small dataset (1,000 images) and 85.5% test accuracy on web photos; single image may not show severity or department; location depends on user input; demo email/OTP delivery is simulated; image storage is local disk and not yet S3; no load testing; not deployed.

## 10. Conclusion and future scope
The prototype demonstrates the full loop from citizen photo to resolved complaint, with explainable priority and measurable limits. Future work: a larger city-specific dataset and a stronger backbone; real email/SMS; S3 storage and AWS deployment; multi-image reports; geospatial clustering; municipal system integration; learning from logged human corrections.

## References
See synopsis references [1]–[12].

## Appendix: running the project
See `README.md`. Demo video: `docs/demo.webm`; screenshots: `docs/screenshots/`.
