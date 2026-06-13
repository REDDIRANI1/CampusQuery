import socket
# Force IPv4 to prevent macOS IPv6 hostname resolution/connection hang
orig_getaddrinfo = socket.getaddrinfo
def my_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = my_getaddrinfo

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.core.logging import setup_logging
from src.api.routers import courses, students, allocation, datasets
from src.core.database import engine
from src.models.base import Base
import logging

# Import models to ensure they are registered on the Base before metadata.create_all is called
from src.models.course import Course, SystemState
from src.models.student import Student, StudentPreference
from src.models.dataset import UploadedDataset, DatasetQuery

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Create all core application tables in the public schema on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred."}
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
