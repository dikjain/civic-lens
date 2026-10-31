# CivicLens AI: Design Diagrams (Mermaid)

Render in GitHub, VS Code (Mermaid preview) or https://mermaid.live.

## 1. Context diagram
```mermaid
flowchart LR
  C[Citizen] -- "report issue (image, details)" --> S((CivicLens AI))
  S -- "status updates, reference" --> C
  A[Municipal Authority] -- "review, assign, update status" --> S
  S -- "classified reports, priority, analytics" --> A
  M[Map / Location services] <--> S
```

## 2. Data-flow diagram (level 0)
```mermaid
flowchart LR
  C[Citizen] --> V[1. Validate upload]
  V --> AI[2. AI classification]
  AI --> P[3. Priority engine]
  P --> DB[(PostgreSQL + image store)]
  DB --> D[4. Authority dashboard]
  D --> O[Officer]
  O -- "review / assign / status" --> DB
  DB --> T[5. Tracking page] --> C
  DB --> AN[6. Analytics] --> O
```

## 3. Use-case diagram
```mermaid
flowchart LR
  Cz((Citizen)) --- U1[Register / Login]
  Cz --- U2[Submit complaint]
  Cz --- U3[Track status]
  Cz --- U4[View my complaints]
  Of((Officer)) --- U5[View queue and filters]
  Of --- U6[Review / correct AI result]
  Of --- U7[Assign department]
  Of --- U8[Update status]
  Of --- U9[View analytics]
  Ad((Admin)) --- U10[Manage users and roles]
  Ad --- U11[Manage departments]
  U2 -. include .-> U12[Classify with AI]
  U2 -. include .-> U13[Compute priority]
```

## 4. Architecture diagram
```mermaid
flowchart TB
  subgraph Client
    W[Next.js app: citizen portal + authority dashboard]
  end
  subgraph Server["FastAPI backend"]
    AUTH[Auth / JWT / roles]
    CS[Complaint service]
    PR[Priority engine]
    AN[Analytics]
    ML[Classifier interface]
  end
  K[(Keras MobileNetV2 model, or heuristic stub)]
  DB[(PostgreSQL / SQLite)]
  FS[(Image storage: local disk, S3 in prod)]
  W -- "HTTPS + JWT" --> AUTH
  W --> CS
  W --> AN
  CS --> ML --> K
  CS --> PR
  CS --> DB
  CS --> FS
  AN --> DB
```

## 5. ER diagram
```mermaid
erDiagram
  USERS ||--o{ COMPLAINTS : submits
  COMPLAINTS ||--o{ IMAGES : has
  COMPLAINTS ||--o{ PREDICTIONS : "classified as"
  COMPLAINTS ||--o{ ASSIGNMENTS : "assigned to"
  COMPLAINTS ||--o{ STATUS_HISTORY : tracks
  DEPARTMENTS ||--o{ ASSIGNMENTS : receives
  USERS ||--o{ ASSIGNMENTS : "assigned by"
  USERS { int id PK string name string email string role string password_hash }
  DEPARTMENTS { int id PK string name string categories }
  COMPLAINTS { int id PK string ref UK int user_id FK string title float lat float lng string category float confidence bool needs_review string priority string status }
  IMAGES { int id PK int complaint_id FK string filename bool is_primary }
  PREDICTIONS { int id PK int complaint_id FK string category float confidence string model_version }
  ASSIGNMENTS { int id PK int complaint_id FK int authority_id FK int department_id FK }
  STATUS_HISTORY { int id PK int complaint_id FK string status string comment int updated_by FK }
```
