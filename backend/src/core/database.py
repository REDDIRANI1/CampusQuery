from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings
from src.models.base import Base
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. Allocation Readonly Engine (Public Schema)
allocation_readonly_engine = create_engine(
    settings.ALLOCATION_READONLY_DATABASE_URL,
    pool_pre_ping=True
)
AllocationReadonlySession = sessionmaker(autocommit=False, autoflush=False, bind=allocation_readonly_engine)

# 3. Datasets Readonly Engine (Datasets Schema)
datasets_readonly_engine = create_engine(
    settings.DATASETS_READONLY_DATABASE_URL,
    pool_pre_ping=True
)
DatasetsReadonlySession = sessionmaker(autocommit=False, autoflush=False, bind=datasets_readonly_engine)

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_allocation_readonly_db():
    db = AllocationReadonlySession()
    try:
        yield db
    finally:
        db.close()

def get_datasets_readonly_db():
    db = DatasetsReadonlySession()
    try:
        yield db
    finally:
        db.close()
