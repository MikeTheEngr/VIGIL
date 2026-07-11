from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.pipeline import Pipeline
from app.schemas.pipeline import PipelineCreate, PipelineUpdate, PipelineResponse, PipelineDetailResponse

router = APIRouter()


@router.get("/", response_model=List[PipelineResponse])
def get_all_pipelines(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(Pipeline)
    if status:
        query = query.filter(Pipeline.status == status)
    return query.offset(offset).limit(limit).all()


@router.get("/summary")
def get_pipeline_summary(db: Session = Depends(get_db)):
    total = db.query(Pipeline).count()
    critical = db.query(Pipeline).filter(Pipeline.status == "critical").count()
    warning = db.query(Pipeline).filter(Pipeline.status == "warning").count()
    normal = db.query(Pipeline).filter(Pipeline.status == "normal").count()
    return {"total": total, "critical": critical, "warning": warning, "normal": normal}


@router.get("/{pipeline_id}", response_model=PipelineDetailResponse)
def get_pipeline(pipeline_id: UUID, db: Session = Depends(get_db)):
    pl = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pl


@router.post("/", response_model=PipelineResponse, status_code=201)
def create_pipeline(payload: PipelineCreate, db: Session = Depends(get_db)):
    pl = Pipeline(**payload.model_dump())
    db.add(pl)
    db.commit()
    db.refresh(pl)
    return pl


@router.patch("/{pipeline_id}", response_model=PipelineResponse)
def update_pipeline(pipeline_id: UUID, payload: PipelineUpdate, db: Session = Depends(get_db)):
    pl = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pl, field, value)
    db.commit()
    db.refresh(pl)
    return pl
