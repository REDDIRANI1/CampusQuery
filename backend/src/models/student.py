import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.src.models.base import Base
import enum

class CategoryEnum(str, enum.Enum):
    General = "General"
    OBC = "OBC"
    SC = "SC"
    ST = "ST"

class AllocationStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Allocated = "Allocated"
    Rejected = "Rejected"

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id_str = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    marks = Column(Float, nullable=False)
    category = Column(Enum(CategoryEnum), nullable=False)
    application_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    allocation_status = Column(Enum(AllocationStatusEnum), default=AllocationStatusEnum.Pending)
    allocated_course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id'), nullable=True)
    allocated_quota = Column(Enum(CategoryEnum), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    preferences = relationship("StudentPreference", back_populates="student", cascade="all, delete-orphan")
    allocated_course = relationship("Course", foreign_keys=[allocated_course_id])

    @property
    def allocated_course_name(self):
        return self.allocated_course.name if self.allocated_course else None

class StudentPreference(Base):
    __tablename__ = "student_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id'), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id'), nullable=False)
    priority = Column(Integer, nullable=False)

    student = relationship("Student", back_populates="preferences")
    course = relationship("Course")

    @property
    def course_name(self) -> str:
        return self.course.name if self.course else ""
