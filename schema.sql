-- Database Schema for Campus Query

CREATE TYPE categoryenum AS ENUM ('General', 'OBC', 'SC', 'ST');
CREATE TYPE allocationstatusenum AS ENUM ('Pending', 'Allocated', 'Rejected');

CREATE TABLE courses (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    general_seats INTEGER NOT NULL,
    obc_seats INTEGER NOT NULL,
    sc_seats INTEGER NOT NULL,
    st_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    rejection_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE system_state (
    id INTEGER PRIMARY KEY,
    is_allocation_locked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE students (
    id UUID PRIMARY KEY,
    student_id_str VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    marks FLOAT NOT NULL,
    category categoryenum NOT NULL,
    application_date TIMESTAMP WITH TIME ZONE,
    allocation_status allocationstatusenum NOT NULL DEFAULT 'Pending',
    allocated_course_id UUID REFERENCES courses(id),
    allocated_quota categoryenum,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE student_preferences (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id),
    priority INTEGER NOT NULL
);

CREATE TABLE uploaded_datasets (
    id UUID PRIMARY KEY,
    filename VARCHAR NOT NULL,
    dynamic_table_name VARCHAR NOT NULL UNIQUE,
    row_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE dataset_queries (
    id UUID PRIMARY KEY,
    dataset_id UUID,
    natural_language_query TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    execution_time_ms VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
);
