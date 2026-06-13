# Data Model

## Core Entities (Campus Query)

### 1. `courses`
Represents the available courses and seat capacities (these represent total capacity limits, available seats are calculated dynamically by subtracting allocated students).
- `id`: UUID (Primary Key)
- `name`: String (Unique)
- `total_seats`: Integer
- `general_seats`: Integer
- `obc_seats`: Integer
- `sc_seats`: Integer
- `st_seats`: Integer
- `created_at`: DateTime
- **Constraint**: `total_seats == general_seats + obc_seats + sc_seats + st_seats`

### 2. `students`
Represents student applicants.
- `id`: UUID (Primary Key)
- `student_id_str`: String (Unique, user-facing ID)
- `name`: String
- `marks`: Float
- `category`: Enum (General, OBC, SC, ST)
- `application_date`: DateTime
- `allocation_status`: Enum ('Pending', 'Allocated', 'Rejected') (Default 'Pending')
- `allocated_course_id`: UUID (Nullable, Foreign Key to `courses`)
- `allocated_quota`: String (Nullable, 'General', 'OBC', 'SC', 'ST')
- `created_at`: DateTime

### 3. `student_preferences`
Represents the 1st, 2nd, and 3rd choices for a student.
- `id`: UUID (Primary Key)
- `student_id`: UUID (Foreign Key to `students`)
- `course_id`: UUID (Foreign Key to `courses`)
- `priority`: Integer (1, 2, or 3)

### 4. `system_state`
Represents global application flags.
- `id`: Integer (Primary Key)
- `is_allocation_locked`: Boolean (Default false, prevents preference updates after algorithm runs)
- *Constraint*: A student can have max 3 preferences, priorities must be unique per student.

## AI SQL Assistant Entities

### 4. `uploaded_datasets`
Tracks datasets uploaded by users.
- `id`: UUID (Primary Key)
- `filename`: String
- `table_name`: String (The dynamically generated table name in Postgres)
- `uploaded_at`: DateTime

### 5. `dataset_queries`
Tracks natural language queries and their generated SQL.
- `id`: UUID (Primary Key)
- `dataset_id`: UUID (Foreign Key to `uploaded_datasets`)
- `prompt`: String
- `generated_sql`: String
- `status`: Enum (Success, Failed)
- `error_message`: String (Nullable)
- `created_at`: DateTime
