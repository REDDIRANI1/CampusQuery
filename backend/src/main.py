from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.core.config import settings
from backend.src.api.routers import courses, students, allocation, datasets
from backend.src.core.database import engine
from backend.src.models.base import Base
# Import models to ensure they are registered on the Base before metadata.create_all is called
from backend.src.models.course import Course, SystemState
from backend.src.models.student import Student, StudentPreference
from backend.src.models.dataset import UploadedDataset, DatasetQuery

# Create all core application tables in the public schema on startup
Base.metadata.create_all(bind=engine)


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
