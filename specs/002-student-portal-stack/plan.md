# Implementation Plan: Campus Query (Course Allocation & SQL Assistant)

**Branch**: `002-student-portal-stack` | **Date**: 2026-06-13 | **Spec**: [spec.md](file:///Users/salauddin/Projects/workspace/assessments/student-portal/specs/002-student-portal-stack/spec.md)

**Input**: Feature specification from `/specs/002-student-portal-stack/spec.md`

## Summary

Build an AI-powered student course allocation system and a generic natural language SQL assistant. The project consists of a Next.js frontend for user interaction (student registration, dashboards, dataset upload, and chat) and a Python/FastAPI backend for business logic, dataset processing, and Google Gemini API integration. A PostgreSQL database will handle both normalized data and dynamically generated tables.

## Technical Context

**Language/Version**: Python 3.11+, TypeScript (Node.js 20+)

**Primary Dependencies**: FastAPI, SQLAlchemy, Next.js, Tailwind CSS, Recharts (for graphs), Google GenAI SDK (Gemini), Pandas, openpyxl (for CSV/Excel parsing), ReportLab (for PDF generation)

**Storage**: PostgreSQL

**Testing**: pytest (backend), Vitest/Jest (frontend)

**Target Platform**: Web browsers

**Project Type**: Web application (frontend + backend)

**Performance Goals**: API responses < 200ms; AI query responses < 3s

**Constraints**:
- **Schema Isolation**: Core application tables must reside in the `public` schema. AI SQL Assistant tables must reside in `datasets_schema`.
- **Database Roles**:
  - `datasets_readonly_user` (for Task 2) has read-only access strictly to `datasets_schema`. It must not access the `public` schema.
  - `allocation_readonly_user` (for Task 1) has read-only access to `public` schema only.
- **Query Safeguards**: Strict sanitization of uploaded CSV headers to `^[a-z0-9_]+$`. All AI-generated SQL queries must have a statement timeout of 3s (`SET statement_timeout = 3000`) and a strict result limit of 100.
- **Failures**: Unrecognized or invalid queries must fallback to suggestions based on column schemas.

**Scale/Scope**: Two integrated sub-systems, ~10 API endpoints, ~5 screens, ~4 core database entities + dynamic tables.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. AI Integration First**: Gemini will be used for SQL conversion and analytics.
- [x] **II. Robust Database Design**: PostgreSQL chosen for robust schema support and dynamic table capabilities.
- [x] **III. Comprehensive API & Dashboard**: FastAPI for API and Next.js for dashboard chosen.
- [x] **IV. Business Rules Compliance**: Strict sorting (marks then application date) logic defined.
- [x] **V. Extensibility & Generalization**: Pandas + SQLAlchemy enable generic CSV parsing and dynamic SQL querying.

All constitution principles are met.

## Project Structure

### Documentation (this feature)

```text
specs/002-student-portal-stack/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
├── contracts/           
└── tasks.md             
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── core/           # Config, security, DB connections
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Allocation logic, AI/Gemini integration, Dataset processing
│   └── api/            # FastAPI routers
└── tests/

frontend/
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # UI components (Tailwind)
│   ├── lib/            # Utilities, API client
│   └── types/          # TS definitions
└── tests/
```

**Structure Decision**: Selected the "Web application" structure as it clearly separates the Python API backend and the Next.js React frontend, aligning with the project requirements.
