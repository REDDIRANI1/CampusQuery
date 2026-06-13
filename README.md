# Campus Query

Campus Query is an AI-Powered Student Course Allocation System and intelligent SQL Data Assistant built with a modern stack:
- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Pandas
- **Database**: PostgreSQL 15 (via Colima Docker)
- **AI Integration**: Google GenAI SDK (Gemini Pro/Flash)

## Prerequisites
- Node.js (v18+)
- Python 3.11+
- Colima and Docker (`brew install colima docker docker-compose`)
- Google Gemini API Key

## Setup Instructions

### 1. Database Setup
Ensure Colima is running:
```bash
colima start
```
Start the PostgreSQL database (this will automatically seed the roles and schemas):
```bash
docker compose up -d
```

### 2. Backend Setup
From the project root directory, activate the virtual environment, and run the server:
```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=. uvicorn backend.src.main:app --reload --port 8000
```
> Note: Ensure your `.env` file is present in the root directory with `GEMINI_API_KEY` and the three database connection URLs.

### 3. Frontend Setup
Navigate to the `frontend` directory, install dependencies, and run the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```

## Features
1. **Student Course Allocation**: Merit-based seat allocation with category-specific quotas (General, OBC, SC, ST).
2. **Dynamic AI SQL Assistant**: Upload any CSV/Excel file, and immediately query it using natural language. The system dynamically generates an isolated PostgreSQL table.
3. **Admin Dashboard**: Run allocation logic, view live stats, and ask AI questions about the allocation outcomes safely.
