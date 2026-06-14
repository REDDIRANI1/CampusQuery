from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field, constr
from uuid import UUID
from typing import List, Optional

from backend.src.core.database import get_db
from backend.src.models.student import Student, StudentPreference, CategoryEnum, AllocationStatusEnum
from backend.src.models.course import SystemState

router = APIRouter(prefix="/students", tags=["Students"])

class PreferenceCreate(BaseModel):
    course_id: UUID
    priority: int = Field(..., ge=1, le=3)

class StudentCreate(BaseModel):
    student_id_str: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    marks: float = Field(..., ge=0, le=100)
    category: CategoryEnum
    preferences: List[PreferenceCreate] = Field(..., max_length=3)

class PreferenceResponse(BaseModel):
    course_id: UUID
    priority: int
    course_name: Optional[str] = None
    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    id: UUID
    student_id_str: str
    name: str
    marks: float
    category: CategoryEnum
    allocation_status: AllocationStatusEnum
    allocated_course_id: Optional[UUID] = None
    allocated_course_name: Optional[str] = None
    allocated_quota: Optional[CategoryEnum] = None
    preferences: List[PreferenceResponse]

    class Config:
        from_attributes = True

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def register_student(student: StudentCreate, db: Session = Depends(get_db)):
    # Check if locked
    state = db.query(SystemState).first()
    if state and state.is_allocation_locked:
        raise HTTPException(status_code=400, detail="Registration is locked because allocation has run.")
        
    if db.query(Student).filter(Student.student_id_str == student.student_id_str).first():
        raise HTTPException(status_code=400, detail="Student ID already registered.")

    db_student = Student(
        student_id_str=student.student_id_str,
        name=student.name,
        marks=student.marks,
        category=student.category
    )
    db.add(db_student)
    db.flush() # get id
    
    # Validate duplicate priorities and courses
    priorities = set()
    course_ids = set()
    for pref in student.preferences:
        if pref.priority in priorities:
            raise HTTPException(status_code=400, detail="Duplicate priorities in preferences are not allowed.")
        if pref.course_id in course_ids:
            raise HTTPException(status_code=400, detail="Duplicate courses in preferences are not allowed.")
        priorities.add(pref.priority)
        course_ids.add(pref.course_id)
        
        db_pref = StudentPreference(
            student_id=db_student.id,
            course_id=pref.course_id,
            priority=pref.priority
        )
        db.add(db_pref)
        
    db.commit()
    return db.query(Student).options(
        joinedload(Student.preferences).joinedload(StudentPreference.course),
        joinedload(Student.allocated_course)
    ).filter(Student.id == db_student.id).first()

@router.put("/{student_id}/preferences")
def update_preferences(student_id: UUID, preferences: List[PreferenceCreate], db: Session = Depends(get_db)):
    state = db.query(SystemState).first()
    if state and state.is_allocation_locked:
        raise HTTPException(status_code=400, detail="Preferences locked because allocation has run.")
        
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Validate duplicate priorities and courses
    priorities = set()
    course_ids = set()
    for pref in preferences:
        if pref.priority in priorities:
            raise HTTPException(status_code=400, detail="Duplicate priorities in preferences are not allowed.")
        if pref.course_id in course_ids:
            raise HTTPException(status_code=400, detail="Duplicate courses in preferences are not allowed.")
        priorities.add(pref.priority)
        course_ids.add(pref.course_id)

    # Delete old, insert new
    db.query(StudentPreference).filter(StudentPreference.student_id == student.id).delete()
    for pref in preferences:
        db_pref = StudentPreference(
            student_id=student.id,
            course_id=pref.course_id,
            priority=pref.priority
        )
        db.add(db_pref)
        
    db.commit()
    return {"message": "Preferences updated successfully"}

@router.get("/{student_id}/allocation", response_model=StudentResponse)
def get_student_allocation(student_id: UUID, db: Session = Depends(get_db)):
    student = db.query(Student).options(
        joinedload(Student.preferences).joinedload(StudentPreference.course),
        joinedload(Student.allocated_course)
    ).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
