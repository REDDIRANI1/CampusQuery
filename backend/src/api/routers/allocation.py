from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from src.core.database import get_db, get_allocation_readonly_db
from src.services.allocation import run_allocation, get_allocation_stats
from src.api.routers.students import StudentResponse
from src.models.student import Student
from src.api.routers.courses import CourseResponse
from src.models.course import Course

router = APIRouter(prefix="/allocation", tags=["Allocation"])

class AllocationStats(BaseModel):
    total_students: int
    allocated_students: int
    rejected_students: int
    total_available_seats: int
    course_statistics: List[Dict[str, Any]]
    category_wise_allocation: Dict[str, int]

@router.post("/run", response_model=AllocationStats)
def trigger_allocation(db: Session = Depends(get_db)):
    try:
        run_allocation(db)
        return get_allocation_stats(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=AllocationStats)
def fetch_stats(db: Session = Depends(get_db)):
    return get_allocation_stats(db)

@router.get("/students", response_model=List[StudentResponse])
def get_allocated_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Returns all students with their allocations
    from src.models.student import StudentPreference
    return db.query(Student).options(
        joinedload(Student.preferences).joinedload(StudentPreference.course),
        joinedload(Student.allocated_course)
    ).offset(skip).limit(limit).all()

# T031 Ask AI Endpoint (placeholder for now)
class AIQuery(BaseModel):
    question: str

class AIResponse(BaseModel):
    answer: str
    sql: Optional[str] = None

@router.post("/ask", response_model=AIResponse)
def ask_allocation_ai(query: AIQuery, db: Session = Depends(get_allocation_readonly_db)):
    # Placeholder: connect to ai_allocation_service
    from src.services.ai_allocation_service import ask_allocation_question
    return ask_allocation_question(query.question, db)
