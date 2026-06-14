-- T034: Setup schemas and specific AI readonly PostgreSQL roles

-- 1. Create schemas
CREATE SCHEMA IF NOT EXISTS datasets_schema;

-- 2. Create roles (ensure passwords are secure in production)
-- Replace 'password' with secure passwords configured via environment variables usually,
-- but for local setup we use these defaults.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'allocation_readonly_user') THEN
    CREATE ROLE allocation_readonly_user WITH LOGIN PASSWORD 'alloc_readonly_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'datasets_readonly_user') THEN
    CREATE ROLE datasets_readonly_user WITH LOGIN PASSWORD 'data_readonly_password';
  END IF;
END
$$;

-- 3. Grant schema usage
GRANT USAGE, CREATE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA public TO allocation_readonly_user;


GRANT USAGE, CREATE ON SCHEMA datasets_schema TO app_user;
GRANT USAGE ON SCHEMA datasets_schema TO datasets_readonly_user;

-- 4. Grant table privileges (existing tables)
-- app_user gets full CRUD
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA datasets_schema TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA datasets_schema TO app_user;

-- allocation_readonly_user gets SELECT on public
GRANT SELECT ON ALL TABLES IN SCHEMA public TO allocation_readonly_user;

-- datasets_readonly_user gets SELECT on datasets_schema
GRANT SELECT ON ALL TABLES IN SCHEMA datasets_schema TO datasets_readonly_user;

-- 5. Default Privileges (Future tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA datasets_schema GRANT ALL ON TABLES TO app_user;

-- For tables created by postgres:
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO allocation_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA datasets_schema GRANT SELECT ON TABLES TO datasets_readonly_user;

-- For tables created by app_user:
ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA public GRANT SELECT ON TABLES TO allocation_readonly_user;
ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA datasets_schema GRANT SELECT ON TABLES TO datasets_readonly_user;

-- Restrict datasets_readonly_user from public schema
REVOKE ALL ON SCHEMA public FROM datasets_readonly_user;
