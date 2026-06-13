from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from uuid import UUID
from typing import List

from src.core.database import get_db
from src.models.course import Course

router = APIRouter(prefix="/courses", tags=["Courses"])

class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1)
    general_seats: int = Field(..., ge=0)
    obc_seats: int = Field(..., ge=0)
    sc_seats: int = Field(..., ge=0)
    st_seats: int = Field(..., ge=0)

class CourseResponse(CourseCreate):
    id: UUID
    total_seats: int
    rejection_count: int

    class Config:
        from_attributes = True

@router.post("/", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    total_seats = course.general_seats + course.obc_seats + course.sc_seats + course.st_seats
    db_course = Course(
        name=course.name,
        general_seats=course.general_seats,
        obc_seats=course.obc_seats,
        sc_seats=course.sc_seats,
        st_seats=course.st_seats,
        total_seats=total_seats
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()
