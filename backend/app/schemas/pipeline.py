from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class PipelineBase(BaseModel):
    name: str
    segment_code: Optional[str] = None
    material: Optional[str] = None
    diameter_mm: Optional[float] = None
    length_km: Optional[float] = None
    location: Optional[str] = None
    status: str = "normal"


class PipelineCreate(PipelineBase):
    pass


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None


class PipelineResponse(PipelineBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    updated_at: datetime


class PipelineDetailResponse(PipelineResponse):
    created_at: datetime
