import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from src.models.base import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    total_seats = Column(Integer, nullable=False)
    general_seats = Column(Integer, nullable=False)
    obc_seats = Column(Integer, nullable=False)
    sc_seats = Column(Integer, nullable=False)
    st_seats = Column(Integer, nullable=False)
    rejection_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class SystemState(Base):
    __tablename__ = "system_state"

    id = Column(Integer, primary_key=True, default=1)
    is_allocation_locked = Column(Boolean, default=False)
