from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.alert import Alert

router = APIRouter()


@router.get("/")
def get_alerts(
    severity: Optional[str] = Query(None),
    resolved: bool = Query(False),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(Alert).filter(Alert.resolved == resolved)
    if severity:
        query = query.filter(Alert.severity == severity)
    rows = query.order_by(Alert.time.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": str(a.id), "time": a.time, "severity": a.severity, "type": a.type,
            "title": a.title, "message": a.message,
            "equipment_id": str(a.equipment_id) if a.equipment_id else None,
            "pipeline_id": str(a.pipeline_id) if a.pipeline_id else None,
            "is_acknowledged": a.is_acknowledged, "resolved": a.resolved,
        }
        for a in rows
    ]


@router.get("/count")
def get_alert_count(db: Session = Depends(get_db)):
    critical = db.query(Alert).filter(Alert.severity == "critical", Alert.resolved == False).count()
    warning = db.query(Alert).filter(Alert.severity == "warning", Alert.resolved == False).count()
    total = db.query(Alert).filter(Alert.resolved == False).count()
    return {"total": total, "critical": critical, "warning": warning}


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: UUID, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return {"status": "acknowledged"}


@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: UUID, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"status": "resolved"}


@router.delete("/resolved", status_code=204)
def clear_resolved_alerts(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.resolved == True).delete()
    db.commit()
