# Quickstart Guide

## Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Google Gemini API Key

## Database Setup
1. Ensure Colima and Docker are installed and running:
   ```bash
   colima start
   ```
2. Start the PostgreSQL database container:
   ```bash
   docker compose up -d
   ```
   This command starts the database and automatically runs the initialization script (`backend/scripts/init_db.sql`) to create the `datasets_schema` schema, as well as the standard database roles and permissions.

## Backend Setup (FastAPI)
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install requirements: `pip install -r requirements.txt` (once generated)
5. Set `.env` variables:
   ```
   DATABASE_URL=postgresql://app_user:app_password@localhost:5432/student_portal_db
   ALLOCATION_READONLY_DATABASE_URL=postgresql://allocation_readonly_user:alloc_readonly_password@localhost:5432/student_portal_db
   DATASETS_READONLY_DATABASE_URL=postgresql://datasets_readonly_user:data_readonly_password@localhost:5432/student_portal_db
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
