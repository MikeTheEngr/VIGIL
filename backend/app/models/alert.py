import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    time            = Column(DateTime(timezone=True), server_default=func.now())
    severity        = Column(String(20), nullable=False)
    type            = Column(String(50), nullable=False)
    title           = Column(String(200), nullable=False)
    message         = Column(Text)
    equipment_id    = Column(UUID(as_uuid=True))
    pipeline_id     = Column(UUID(as_uuid=True))
    sensor_id       = Column(UUID(as_uuid=True))
    prediction_id   = Column(UUID(as_uuid=True))
    is_acknowledged = Column(Boolean, nullable=False, default=False)
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(String(100))
    resolved        = Column(Boolean, nullable=False, default=False)
    resolved_at     = Column(DateTime(timezone=True))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
