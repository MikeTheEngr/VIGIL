from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SensorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    unit: Optional[str] = None
    equipment_id: Optional[UUID] = None
    pipeline_id: Optional[UUID] = None
    is_active: bool


class SensorReadingResponse(BaseModel):
    time: datetime
    value: float
    quality: str
