# Quickstart Guide

## Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Google Gemini API Key

## Database Setup
1. Create a PostgreSQL database (e.g., `student_portal_db`).
2. Create schemas:
   ```sql
   CREATE SCHEMA datasets_schema;
   ```
3. Create standard app role and read-only roles:
   ```sql
   -- Create standard application user (runs CRUD and migrations)
   CREATE ROLE app_user WITH LOGIN PASSWORD 'app_pass';
   GRANT ALL PRIVILEGES ON DATABASE student_portal_db TO app_user;
   GRANT ALL ON SCHEMA public TO app_user;
   GRANT ALL ON SCHEMA datasets_schema TO app_user;

   -- Create read-only role for Task 1 (Allocation AI)
   CREATE ROLE allocation_readonly_user WITH LOGIN PASSWORD 'alloc_readonly_pass';
   GRANT CONNECT ON DATABASE student_portal_db TO allocation_readonly_user;
   GRANT USAGE ON SCHEMA public TO allocation_readonly_user;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO allocation_readonly_user;
   -- Set default privileges so future tables in public are readable by allocation_readonly_user
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO allocation_readonly_user;

   -- Create read-only role for Task 2 (AI SQL Assistant)
   CREATE ROLE datasets_readonly_user WITH LOGIN PASSWORD 'datasets_readonly_pass';
   GRANT CONNECT ON DATABASE student_portal_db TO datasets_readonly_user;
   GRANT USAGE ON SCHEMA datasets_schema TO datasets_readonly_user;
   -- Set default privileges so future tables in datasets_schema are readable by datasets_readonly_user
   ALTER DEFAULT PRIVILEGES IN SCHEMA datasets_schema GRANT SELECT ON TABLES TO datasets_readonly_user;
   ```

## Backend Setup (FastAPI)
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install requirements: `pip install -r requirements.txt` (once generated)
5. Set `.env` variables:
   ```
   DATABASE_URL=postgresql://app_user:app_pass@localhost:5432/student_portal_db
   ALLOCATION_AI_DATABASE_URL=postgresql://allocation_readonly_user:alloc_readonly_pass@localhost:5432/student_portal_db
   DATASETS_AI_DATABASE_URL=postgresql://datasets_readonly_user:datasets_readonly_pass@localhost:5432/student_portal_db
   GEMINI_API_KEY=your_api_key
   ```
6. Run server: `uvicorn src.main:app --reload`

## Frontend Setup (Next.js)
1. `cd frontend`
2. Install dependencies: `npm install`
3. Set `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run dev server: `npm run dev`
