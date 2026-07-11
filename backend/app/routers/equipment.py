from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.equipment import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentResponse, EquipmentDetailResponse

router = APIRouter()


@router.get("/", response_model=List[EquipmentResponse])
def get_all_equipment(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(Equipment)
    if status:
        query = query.filter(Equipment.status == status)
    if type:
        query = query.filter(Equipment.type == type)
    return query.offset(offset).limit(limit).all()


@router.get("/summary")
def get_equipment_summary(db: Session = Depends(get_db)):
    total = db.query(Equipment).count()
    critical = db.query(Equipment).filter(Equipment.health_score < 30).count()
    warning = db.query(Equipment).filter(
        Equipment.health_score >= 30, Equipment.health_score < 60
    ).count()
    nominal = db.query(Equipment).filter(Equipment.health_score >= 60).count()
    return {"total": total, "critical": critical, "warning": warning, "nominal": nominal}


@router.get("/{equipment_id}", response_model=EquipmentDetailResponse)
def get_equipment(equipment_id: UUID, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return eq


@router.post("/", response_model=EquipmentResponse, status_code=201)
def create_equipment(payload: EquipmentCreate, db: Session = Depends(get_db)):
    eq = Equipment(**payload.model_dump())
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq


@router.patch("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(equipment_id: UUID, payload: EquipmentUpdate, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(eq, field, value)
    db.commit()
    db.refresh(eq)
    return eq


@router.delete("/{equipment_id}", status_code=204)
def delete_equipment(equipment_id: UUID, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(eq)
    db.commit()
