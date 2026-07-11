from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class EquipmentBase(BaseModel):
    name: str
    type: str
    location: Optional[str] = None
    serial_number: Optional[str] = None
    status: str = "active"


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    health_score: Optional[float] = None
    rul_days: Optional[int] = None


class EquipmentResponse(EquipmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    health_score: Optional[float] = None
    rul_days: Optional[int] = None
    updated_at: datetime


class EquipmentDetailResponse(EquipmentResponse):
    created_at: datetime
