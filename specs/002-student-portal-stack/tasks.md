# Tasks: Campus Query (Course Allocation & SQL Assistant)

**Input**: Design documents from `/specs/002-student-portal-stack/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api-endpoints.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan (frontend and backend dirs)
- [X] T002 Initialize FastAPI project with dependencies in backend/
- [X] T003 Initialize Next.js project with Tailwind CSS in frontend/
- [X] T004 [P] Configure linting and formatting tools for both frontend/ and backend/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Setup backend boilerplate (FastAPI + SQLAlchemy) in backend/src/main.py and backend/src/core/database.py (Include THREE database connection engines: `app_user`, `allocation_readonly_user`, and `datasets_readonly_user`)
- [X] T006 [P] Configure base SQLAlchemy models in backend/src/models/base.py
- [X] T007 [P] Configure FastAPI routing, CORS, and error handling in backend/src/main.py
- [X] T008 [P] Configure Next.js API client setup in frontend/src/lib/api.ts
- [X] T009 Setup environment configuration management in backend/src/core/config.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Apply for Courses (Priority: P1) 🎯 MVP

**Goal**: Students can apply for multiple courses with marks, category, and up to 3 preferences.

**Independent Test**: Submit a registration payload to `/api/v1/students` and verify records in DB.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create Course model (with seat constraints) and SystemState model in backend/src/models/course.py
- [X] T010a [US1] Implement Course Management API (GET/POST /api/v1/courses) in backend/src/api/routers/courses.py
- [ ] T010b [US1] Create Course Management UI for Admins in frontend/src/app/admin/courses/page.tsx
- [X] T011 [P] [US1] Create Student and Preferences models in backend/src/models/student.py
- [X] T012 [US1] Implement Student Registration endpoint POST /api/v1/students in backend/src/api/routers/students.py
- [X] T012a [US1] Implement Student Preference Update endpoint PUT /api/v1/students/{id}/preferences in backend/src/api/routers/students.py
- [X] T012b [US1] Implement Student Allocation Status endpoint GET /api/v1/students/{id}/allocation in backend/src/api/routers/students.py
- [ ] T013 [P] [US1] Create Student Registration Form component in frontend/src/components/RegistrationForm.tsx
- [ ] T014 [US1] Integrate Registration Form with API in frontend/src/app/apply/page.tsx
- [ ] T014a [US1] Add Preference Update capability to frontend interface
- [ ] T014b [US1] Create Student Dashboard UI for students to view their allocated course status

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Automated Course Allocation (Priority: P1)

**Goal**: Administrators can trigger the automated allocation process which assigns students based on rules.

**Independent Test**: POST to `/api/v1/allocation/run` and verify allocation statistics response.

### Implementation for User Story 2

- [X] T015 [US2] Implement Allocation Algorithm service in backend/src/services/allocation.py (Idempotent run reset; Process Student-by-Student by merit; top reserved students consume General seats; compute rejection counts)
- [X] T016 [US2] Implement Allocation endpoint POST /api/v1/allocation/run in backend/src/api/routers/allocation.py (MUST use SELECT FOR UPDATE atomic lock on system_state to prevent race conditions)
- [ ] T017 [P] [US2] Create Admin Action button component in frontend/src/components/AdminAllocationControl.tsx
- [ ] T018 [US2] Integrate Admin Control in frontend/src/app/admin/page.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 5 - AI SQL Assistant (Priority: P1)

**Goal**: Users can upload datasets and query them with natural language.

**Independent Test**: Upload CSV to `/api/v1/datasets/upload`, then query it via `/api/v1/datasets/{id}/query`.

### Implementation for User Story 5

- [X] T019 [P] [US5] Create UploadedDataset and DatasetQuery models in backend/src/models/dataset.py
- [X] T020 [US5] Implement Pandas CSV/Excel parser and dynamic table creator in backend/src/services/dataset_service.py (Must use openpyxl, strict regex header sanitization, isolate in `datasets_schema`, MUST use run_in_threadpool or sync def to prevent asyncio event loop blocking from Pandas)
- [X] T020a [US5] Ensure default privileges are configured so `datasets_readonly_user` automatically gets SELECT on dynamically created tables in `datasets_schema` (using ALTER DEFAULT PRIVILEGES)
- [X] T021 [US5] Implement Gemini SQL generation and execution service in backend/src/services/ai_sql_service.py (Inject dynamic table DDL into prompt context, explicitly parse/strip markdown ```sql wrapping from LLM output, enforce SQL LIMIT 100, enforce 3s statement timeout, execute using `datasets_readonly_user` connection, generate AI insights/chart configs)
- [ ] T021a [US5] Implement exponential backoff and retry logic for Gemini API rate limits
- [ ] T021b [US5] Implement fallback logic to suggest sample queries when prompts are vague/unrecognized
- [X] T022 [US5] Implement Upload endpoint POST /api/v1/datasets/upload in backend/src/api/routers/datasets.py
- [X] T023 [US5] Implement Query endpoint POST /api/v1/datasets/{dataset_id}/query in backend/src/api/routers/datasets.py
- [X] T023a [US5] Implement Export endpoint GET /api/v1/datasets/{dataset_id}/export in backend/src/api/routers/datasets.py
- [ ] T024 [P] [US5] Create Dataset Upload UI in frontend/src/components/DatasetUpload.tsx
- [ ] T025 [P] [US5] Create AI Chat UI for querying datasets in frontend/src/components/AIChat.tsx (Include skeleton loaders, Recharts graphs, export buttons, and React Error Boundaries)
- [ ] T025a [P] [US5] Create Query History Sidebar component to track past AI interactions in frontend/src/components/QueryHistory.tsx
- [ ] T026 [US5] Integrate Dataset and Chat components in frontend/src/app/sql-assistant/page.tsx

**Checkpoint**: At this point, User Story 5 should be fully functional independently

---

## Phase 6: User Story 3 - Administrative Dashboard (Priority: P2)

**Goal**: Admins can view a dashboard displaying allocated students, seats, and stats.

**Independent Test**: View `/admin` page and see rendered charts/stats.

### Implementation for User Story 3

- [X] T027 [US3] Implement Stats endpoint GET /api/v1/allocation/stats in backend/src/api/routers/allocation.py
- [X] T027a [US3] Implement Student List endpoint GET /api/v1/allocations in backend/src/api/routers/allocation.py
- [ ] T028 [P] [US3] Create Stats Card components in frontend/src/components/StatsCards.tsx
- [ ] T029 [US3] Integrate Dashboard Data in frontend/src/app/admin/page.tsx

---

## Phase 7: User Story 4 - AI Assistant for Allocation Analytics (Priority: P2)

**Goal**: Admins can ask AI questions about allocation results.

**Independent Test**: POST to `/api/v1/allocation/ask` and receive an accurate AI response.

### Implementation for User Story 4

- [X] T030 [US4] Implement Allocation AI Assistant service in backend/src/services/ai_allocation_service.py (Inject public schema DDL into prompt context)
- [X] T031 [US4] Implement Ask AI endpoint POST /api/v1/allocation/ask in backend/src/api/routers/allocation.py
- [ ] T032 [P] [US4] Create Allocation AI Chat interface in frontend/src/components/AllocationChat.tsx
- [ ] T033 [US4] Integrate Allocation AI Chat in frontend/src/app/admin/page.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T034 [P] Setup specific AI readonly PostgreSQL roles via script in backend/scripts/init_db.sql (Create `allocation_readonly_user` for `public` schema and `datasets_readonly_user` for `datasets_schema`)
- [ ] T035 [P] Deliverable: Generate Database Schema (PostgreSQL schema.sql dump or ER diagram)
- [ ] T036 [P] Deliverable: Write README File with setup instructions to run the project
- [ ] T037 [P] Deliverable: Generate API Documentation detailing the API endpoints developed
- [ ] T038 [P] Deliverable: Prepare Sample Dataset(s) used for testing or demonstrating the applications
- [ ] T039 [P] Deliverable: Capture Screenshots or Demo Video as visual proof of the working applications
- [ ] T040 [P] Deliverable: Write Brief Architecture Document explaining Architecture Design, Database Design Decisions, AI Integration Approach, Security Considerations, and Challenges Faced and Solutions Implemented
- [ ] T041 Code cleanup and refactoring
- [ ] T042 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion

### User Story Dependencies

- **US1 (P1)**: Independent.
- **US2 (P1)**: Depends on US1 (needs student records to allocate).
- **US5 (P1)**: Independent of other user stories.
- **US3 (P2)**: Depends on US2 (needs allocations to display stats).
- **US4 (P2)**: Depends on US2 (needs allocations to query).

### Parallel Opportunities

- All models (T010, T011, T019) can be created in parallel after Foundational Phase.
- Frontend UI components (T013, T017, T024, T025, T028, T032) can be built in parallel.
- US5 can be developed completely in parallel with US1-US4.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test US1 independently

### Incremental Delivery

1. Complete Setup + Foundational
2. Add US1 → Test independently
3. Add US2 → Test independently
4. Add US5 → Test independently
5. Add US3 & US4 → Polish
