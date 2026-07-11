import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Equipment(Base):
    __tablename__ = "equipment"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    type          = Column(String(50), nullable=False)
    location      = Column(String(100))
    serial_number = Column(String(100), unique=True)
    installed_at  = Column(DateTime(timezone=True))
    status        = Column(String(20), nullable=False, default="active")
    health_score  = Column(Float)
    rul_days      = Column(Integer)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now())
