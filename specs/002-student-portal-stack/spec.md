# Feature Specification: Student Portal and SQL Assistant

**Feature Branch**: `002-student-portal-stack`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "Ruby: Nextjs Python+fastapi   Typescript  Tailwindcss and we are plannign use gmeini pau key PostgreSQL" (referencing [assigment.md](file:///Users/salauddin/Projects/workspace/assessments/student-portal/assigment.md))

## Clarifications

### Session 2026-06-13
- Q: Resolving Allocation Ties → A: Strictly use application date priority (any identical timestamps handled via standard DB ordering/randomly)
- Q: Updating Course Preferences → A: Allow students to update preferences until allocation runs.
- Q: Handling AI API Errors → A: Retry automatically with exponential backoff, then show a graceful error if still failing.
- Q: Preventing Destructive SQL Execution → A: Execute all AI-generated queries using a strict read-only database user/role.
- Q: Handling Unrecognized SQL Prompts → A: Return a graceful error message indicating the prompt could not be parsed into a read-only query.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply for Courses (Priority: P1)

Students can apply for multiple courses by providing their details, marks, reservation category, and up to 3 course preferences.

**Why this priority**: Core functionality of the allocation system; without applicants, there is no allocation.

**Independent Test**: Can be fully tested by submitting a student application and verifying it is saved accurately in the database.

**Acceptance Scenarios**:

1. **Given** a student with valid marks and preferences, **When** they submit their application, **Then** the application is recorded with the current application date.
2. **Given** a student applies for a course, **When** they select their preferences, **Then** they can specify up to 3 prioritized choices.

---

### User Story 2 - Automated Course Allocation (Priority: P1)

Administrators can trigger the automated allocation process which assigns students to courses based on marks, reservation rules, application date, and preferences.

**Why this priority**: The core business logic of the assignment relies on accurately allocating students according to the strict priority and reservation rules.

**Independent Test**: Can be fully tested by providing a mock dataset of students and courses, running the allocation, and verifying the outputs match expected rules.

**Acceptance Scenarios**:

1. **Given** multiple students applying for the same course, **When** allocation runs, **Then** the student with higher marks is prioritized.
2. **Given** two students with the same marks, **When** allocation runs, **Then** the student with the earlier application date is prioritized.
3. **Given** category-specific reserved seats, **When** allocation runs, **Then** seats are appropriately reserved and filled by the respective category applicants.
4. **Given** a student whose first preference is full, **When** allocation runs, **Then** their second preference is evaluated.

---

### User Story 3 - Administrative Dashboard (Priority: P2)

Administrators can view a dashboard displaying allocated students, available seats, course statistics, and category-wise allocation.

**Why this priority**: Essential for administrators to monitor the results of the allocation and overall system status.

**Independent Test**: Can be tested by verifying that the dashboard accurately reflects the current state of the database.

**Acceptance Scenarios**:

1. **Given** completed allocations, **When** the admin views the dashboard, **Then** they see accurate counts of allocated students and available seats per course.
2. **Given** completed allocations, **When** the admin views the dashboard, **Then** they see a category-wise allocation summary.

---

### User Story 4 - AI Assistant for Allocation Analytics (Priority: P2)

Administrators can ask an AI assistant natural language questions about the allocation results.

**Why this priority**: Delivers the required AI integration for the allocation system analytics.

**Independent Test**: Can be tested by submitting predefined questions and verifying the AI returns correct data based on the database.

**Acceptance Scenarios**:

1. **Given** completed allocations, **When** an admin asks "Which students did not receive their first preference?", **Then** the system returns the correct list of students.
2. **Given** completed allocations, **When** an admin asks "How many students were allocated to each course?", **Then** the system returns the correct count per course.

---

### User Story 5 - AI SQL Assistant (Priority: P1)

Users can upload any CSV/Excel dataset and query it using natural language, which the system converts to SQL, executes, and returns results.

**Why this priority**: This is Task 2 of the assessment, requiring a standalone generic platform for natural language data analysis.

**Independent Test**: Can be tested by uploading a dummy CSV, asking a natural language question, and verifying the returned data matches a manual SQL query.

**Acceptance Scenarios**:

1. **Given** a CSV file, **When** a user uploads it, **Then** the system automatically detects the schema and creates a database table dynamically.
2. **Given** an uploaded dataset, **When** the user asks a natural language question, **Then** the system converts it to SQL, executes it, and displays the results.

### Edge Cases and Detailed Business Logic

#### 1. Detailed Course Allocation & Reservation Logic (Merit-First with General Spillover)
The allocation algorithm runs on a merit-first basis to ensure fairness and legal compliance.
1. **Sorting**: All registered students are sorted in a single global list by `marks DESC, application_date ASC, id ASC`.
2. **Allocation Pass**: For each student in the sorted list, the system evaluates their preferences in priority order (1st, then 2nd, then 3rd):
   - **General Seats Check**: If the student qualifies for a General/Open seat in the preferred course (i.e., `general_seats` remaining > 0), they are allocated to that course as a `General` seat. This applies to **all** students, including those belonging to reserved categories (OBC/SC/ST), who qualify on pure merit.
   - **Category Seats Check**: If `general_seats` are exhausted (0 remaining) and the student belongs to a reserved category (OBC, SC, or ST), the system checks the corresponding category quota for that course. If category-specific seats (e.g., `obc_seats` remaining > 0) are available, the student is allocated to that course under their reserved category quota.
   - **Preference Escalation**: If both General and the student's category-specific seats are exhausted for the current preference, the system moves to the student's next preference (2nd, then 3rd).
   - **Rejection**: If a student cannot be allocated to any of their 3 preferences, their allocation status is set to `Rejected`.

#### 2. Rejection Rate Definition and Calculation
The system calculates the "rejection rate" for a course as a simple rejection count: the number of times a student evaluated the course as a preference but was denied due to lack of seats. This provides a straightforward metric for course popularity versus availability.

#### 3. CSV Dataset Upload and Schema Detection Fallbacks
- **Header Sanitization**: Uploaded CSV/Excel headers are sanitized using regex: lowercase, replace spaces/hyphens/special characters with `_`, and match `^[a-z0-9_]+$`. Missing headers are auto-filled with `col_1`, `col_2`, etc.
- **Type Inference**: Column types are inferred by scanning data: Integer -> Float -> Date/DateTime -> Boolean -> Text. Any cells with corrupted or mixed types default to the `Text` representation.
- **Upload Limit**: The file size is strictly limited to 50MB.

#### 4. Secure Execution and Multi-Role Database Architecture
- **Schema Isolation**: Core application tables reside in the `public` schema. Dynamic tables created from user CSVs reside exclusively in the `datasets_schema`.
- **User Roles & Connections**:
  - `app_user`: Owns `public` schema and has `CREATE/USAGE` rights on `datasets_schema`. Used for standard CRUD and table creation.
  - `datasets_readonly_user`: Used for executing SQL generated by the **AI SQL Assistant (Task 2)**. Has `USAGE` on `datasets_schema` and `SELECT` on tables in `datasets_schema` only. It has **no** access to the `public` schema. Default privileges ensure new tables in `datasets_schema` are automatically readable.
  - `allocation_readonly_user`: Used for the **Allocation AI Assistant (Task 1)**. Has `USAGE/SELECT` on the `public` schema only. It has **no** access to `datasets_schema`.
- **Query Safeguards**: AI queries must be appended with a strict `LIMIT 100`. A database-level statement timeout (`SET statement_timeout = 3000`) is executed before running AI SQL.

#### 5. AI API Failure & Fallback Policies
- **Rate-Limits & Timeouts**: Gemini API calls timeout at 3 seconds. The system implements a maximum of 3 retries with exponential backoff (initial delay 1s, backoff factor 2, max delay 10s).
- **Vague Prompts & Recovery**: If a prompt is vague, cannot be converted to SQL, or SQL execution fails, the system returns a standard JSON error prompting the user to rephrase.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow students to register with their ID, Name, Marks, Category, and up to 3 Preferred Courses.
- **FR-002**: System MUST manage Course details including Course Name, Total Seats, and Reserved Seats by Category (General/OBC/SC/ST).
- **FR-003**: System MUST execute the allocation algorithm using the merit-first with General spillover logic.
- **FR-004**: System MUST ensure a student is allocated to a maximum of one course.
- **FR-005**: System MUST provide a dashboard displaying allocated students, available seats, course stats, and category summaries.
- **FR-006**: System MUST integrate an Allocation AI Assistant capable of answering natural language questions using the `allocation_readonly_user` connection.
- **FR-007**: System MUST allow users to upload CSV or Excel files up to 50MB.
- **FR-008**: System MUST automatically detect the schema and sanitize headers of uploaded datasets and create corresponding tables dynamically in `datasets_schema`.
- **FR-009**: System MUST convert natural language questions into valid SQL queries against the dynamic tables.
- **FR-010**: System MUST securely execute the generated SQL queries using `datasets_readonly_user` and display the results.
- **FR-011**: System MUST allow students to update their course preferences after submission, provided the allocation process has not yet been executed.
- **FR-012**: System MUST enforce query security by enforcing read-only database connections, statement timeouts, and query limits.
- **FR-013**: System MUST gracefully handle unrecognized natural language prompts by asking the user to rephrase.
- **FR-014**: System MUST calculate course rejection rates by tracking preference denials.
- **FR-015**: System MUST explicitly track student allocation status (`Pending`, `Allocated`, `Rejected`) to differentiate between unallocated and rejected students.
- **FR-016**: System MUST allow users to export query results.
- **FR-017**: System MUST track and display query history of past AI interactions in a sidebar.

### Key Entities *(include if feature involves data)*

- **Student**: Represents an applicant (ID, Name, Marks, Category, Application Date, Preferences, Allocation Status).
- **Course**: Represents an available program (Name, Total Seats, Reserved Seats by Category).
- **Dataset**: Represents an uploaded CSV/Excel file in the AI SQL Assistant.
- **DatasetQuery**: Represents a natural language prompt, the generated SQL, and its execution result.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The allocation algorithm correctly processes 100% of students without violating any business rules (marks priority, reservations, max 1 course).
- **SC-002**: The AI SQL Assistant successfully detects schema and imports data for 95% of standard CSV/Excel structures.
- **SC-003**: The AI SQL Assistant correctly converts natural language to valid SQL for at least 90% of standard analytical questions (e.g., aggregations, top-N, filtering).
- **SC-004**: All AI-generated SQL queries are executed securely without allowing destructive operations (DROP, DELETE, UPDATE) on the dynamically created tables.

## Assumptions

- Users have modern web browsers to access the dashboard and AI Assistant.
- Uploaded CSV/Excel files are under 50MB for synchronous processing.
- The AI LLM service is highly available and responds within acceptable latency.
- Authentication/Authorization is assumed to be out-of-scope or minimal unless specifically required.
- The project will be built using Next.js (frontend), Python/FastAPI (backend), PostgreSQL (database), Tailwind CSS (styling), and Gemini API (AI).
