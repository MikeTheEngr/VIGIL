import uuid
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Pipeline(Base):
    __tablename__ = "pipelines"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    segment_code  = Column(String(50), unique=True)
    material      = Column(String(50))
    diameter_mm   = Column(Float)
    length_km     = Column(Float)
    location      = Column(String(150))
    status        = Column(String(20), nullable=False, default="normal")
    installed_at  = Column(DateTime(timezone=True))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now())
