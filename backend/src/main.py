import socket
# Force IPv4 to prevent macOS IPv6 hostname resolution/connection hang
orig_getaddrinfo = socket.getaddrinfo
def my_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = my_getaddrinfo

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.core.config import settings
from backend.src.api.routers import courses, students, allocation, datasets
from sqlalchemy import text
from backend.src.core.database import engine
from backend.src.models.base import Base
# Import models to ensure they are registered on the Base before metadata.create_all is called
from backend.src.models.course import Course, SystemState
from backend.src.models.student import Student, StudentPreference
from backend.src.models.dataset import UploadedDataset, DatasetQuery

# Create all core application tables in the public schema on startup
Base.metadata.create_all(bind=engine)

# Ensure readonly roles have access to the tables created by app_user (for robustness / self-healing)
try:
    with engine.connect() as conn:
        conn.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA public TO allocation_readonly_user"))
        conn.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO allocation_readonly_user"))
        conn.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA datasets_schema TO datasets_readonly_user"))
        conn.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA datasets_schema TO datasets_readonly_user"))
        conn.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO allocation_readonly_user"))
        conn.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA datasets_schema GRANT SELECT ON TABLES TO datasets_readonly_user"))
        conn.commit()
except Exception as e:
    import logging
    logging.warning(f"Could not apply startup database permission configuration: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(courses.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(allocation.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to Campus Query API"}
