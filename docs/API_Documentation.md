# API Documentation

The backend utilizes FastAPI which automatically serves interactive OpenAPI documentation.
Once the backend is running, you can view and test all endpoints via the Swagger UI at:
**http://localhost:8000/docs**

Below is a summary of the key endpoints implemented:

## Courses API
- `POST /api/v1/courses/`
  Creates a new course with specified capacities for General, OBC, SC, and ST quotas.
- `GET /api/v1/courses/`
  Retrieves a list of all courses and their capacities.

## Students API
- `POST /api/v1/students/`
  Registers a new student along with their top 3 course preferences. Validates for duplicate IDs and duplicate preferences.
- `PUT /api/v1/students/{student_id}/preferences`
  Updates the preferences of a specific student. Locked if allocation has been finalized.
- `GET /api/v1/students/{student_id}/allocation`
  Retrieves a specific student's allocation status, allocated course, and quota.

## Allocation API
- `POST /api/v1/allocation/run`
  Triggers the Merit-First algorithm. Uses an idempotent reset and `SELECT FOR UPDATE` atomic lock.
- `GET /api/v1/allocation/stats`
  Returns allocation statistics (Total Students, Allocated, Rejected).
- `GET /api/v1/allocation/students`
  Returns a comprehensive list of all students and their allocation status.
- `POST /api/v1/allocation/ask`
  Accepts a natural language question about the `public` schema and returns an AI-generated SQL query and insights.

## Datasets AI API
- `POST /api/v1/datasets/upload`
  Accepts a `multipart/form-data` CSV/Excel upload. Dynamically creates an isolated SQL table and streams data via Pandas.
- `GET /api/v1/datasets/`
  Lists all uploaded datasets.
- `POST /api/v1/datasets/{dataset_id}/query`
  Accepts a natural language question about a specific dataset, generates SQL, executes it securely in `datasets_schema`, and returns the dataset slice and insights.
- `GET /api/v1/datasets/{dataset_id}/queries`
  Retrieves the history of AI queries for a given dataset.
- `GET /api/v1/datasets/{dataset_id}/export`
  Exports the dataset or specific query results back to CSV.
