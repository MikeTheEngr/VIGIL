import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Sensor(Base):
    __tablename__ = "sensors"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    type          = Column(String(50), nullable=False)
    unit          = Column(String(20))
    equipment_id  = Column(UUID(as_uuid=True))
    pipeline_id   = Column(UUID(as_uuid=True))
    is_active     = Column(Boolean, nullable=False, default=True)
    min_threshold = Column(Float)
    max_threshold = Column(Float)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
