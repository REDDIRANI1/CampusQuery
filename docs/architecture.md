# Architecture Document: Campus Query

## 1. Architecture Design
Campus Query adopts a strict decoupling between the client interface and core logic, utilizing a modern Client-Server architecture:
- **Frontend**: Next.js 16 App Router providing a reactive, client-side rendered UI utilizing Tailwind CSS for styling.
- **Backend**: FastAPI serving RESTful JSON APIs, leveraging Python's async capabilities.
- **Database**: PostgreSQL 15, containerized via Colima Docker for guaranteed local environment consistency.

## 2. Database Design Decisions
The system implements a **Schema-Isolated Multi-Role DB Architecture**:
- `public` schema: Houses core application tables (`courses`, `students`, `student_preferences`, `system_state`).
- `datasets_schema`: Houses dynamically generated tables from user-uploaded CSV/Excel datasets.

We enforce strict security at the database connection level by utilizing three distinct connection engines:
1. `app_user`: Full CRUD access to all schemas (used by standard APIs).
2. `allocation_readonly_user`: Strict `SELECT` access to `public` schema only. Used by the Allocation AI Assistant to prevent hallucinated destructive queries.
3. `datasets_readonly_user`: Strict `SELECT` access to `datasets_schema` only. Used by the Dynamic AI SQL Assistant to prevent cross-schema contamination.

## 3. AI Integration Approach
Google Gemini (via GenAI SDK) is integrated as a secure SQL synthesis engine.
- **Task 1 (Allocation AI)**: The schema DDL for `courses` and `students` is statically injected into the prompt. The AI generates a `SELECT` query, which is sanitized, stripped of markdown, and executed via the `allocation_readonly_user` pool.
- **Task 2 (Dataset AI)**: Dynamic table DDL is fetched via SQLAlchemy reflection. We use `gemini-1.5-pro` for SQL synthesis and a subsequent `gemini-1.5-flash` call on the returned data slice for rapid insights.

## 4. Security Considerations
- **SQL Injection**: Prevented by utilizing secure connections, regex sanitization of uploaded dataset headers, and ensuring `SELECT` prefixes.
- **Database Privilege Separation**: The AI execution services simply cannot drop tables or insert data due to PostgreSQL role-level restrictions.
- **Race Conditions**: The Allocation Engine utilizes a `SELECT FOR UPDATE` atomic lock on the `system_state` table to ensure the idempotent algorithm never overlaps.

## 5. Challenges Faced and Solutions Implemented
- **Challenge**: Pandas `read_csv` blocks the FastAPI asynchronous event loop, causing server starvation during large uploads.
- **Solution**: Delegated the dataset processing pipeline to a background thread pool (`run_in_threadpool` from Starlette concurrency).
- **Challenge**: LLMs sporadically returning markdown-wrapped queries (````sql ... ````).
- **Solution**: Implemented strict python-side string stripping before passing queries to SQLAlchemy `text()`.
