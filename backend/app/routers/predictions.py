from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID

from app.database import get_db
from app.services.prediction_service import run_equipment_prediction, run_pipeline_prediction

router = APIRouter()


@router.get("/equipment/{equipment_id}")
def get_equipment_prediction(equipment_id: UUID, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT time, health_score, rul_days, confidence FROM predictions
        WHERE equipment_id = :id AND model_type = 'predictive_maintenance'
        ORDER BY time DESC LIMIT 1
    """), {"id": str(equipment_id)}).fetchone()

    if not row:
        return {}
    return {"time": row.time, "health_score": row.health_score, "rul_days": row.rul_days, "confidence": row.confidence}


@router.get("/equipment/{equipment_id}/history")
def get_equipment_prediction_history(equipment_id: UUID, days: int = Query(30, le=90), db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT time, health_score, rul_days, confidence FROM predictions
        WHERE equipment_id = :id AND model_type = 'predictive_maintenance'
        AND time >= NOW() - (:days || ' days')::interval
        ORDER BY time ASC
    """), {"id": str(equipment_id), "days": days}).fetchall()

    return {
        "equipment_id": str(equipment_id),
        "days": days,
        "history": [
            {"time": r.time, "health_score": r.health_score, "rul_days": r.rul_days, "confidence": r.confidence}
            for r in rows
        ],
    }


@router.get("/pipeline/{pipeline_id}")
def get_pipeline_prediction(pipeline_id: UUID, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT time, anomaly_score, is_anomaly, confidence FROM predictions
        WHERE pipeline_id = :id AND model_type = 'leak_detection'
        ORDER BY time DESC LIMIT 1
    """), {"id": str(pipeline_id)}).fetchone()

    if not row:
        return {}
    return {"time": row.time, "anomaly_score": row.anomaly_score, "is_anomaly": row.is_anomaly, "confidence": row.confidence}


# ── Manual trigger endpoints for testing the ML models live ──

@router.post("/equipment/{equipment_id}/run")
def trigger_equipment_prediction(
    equipment_id: UUID,
    sensor_features: dict = Body(..., description="Engineered feature dict matching the maintenance model's feature list"),
    db: Session = Depends(get_db),
):
    """Manually run the maintenance model against a supplied feature vector and persist it."""
    try:
        result = run_equipment_prediction(db, str(equipment_id), sensor_features)
        return {"status": "complete", "result": result}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/pipeline/{pipeline_id}/run")
def trigger_pipeline_prediction(
    pipeline_id: UUID,
    sensor_readings: dict = Body(..., example={
        "pressure_inlet": 8.5, "pressure_outlet": 6.1,
        "flow_rate": 95, "temperature": 22,
        "acoustic_db": 71, "vibration_mms": 2.6
    }),
    db: Session = Depends(get_db),
):
    """Manually run the leak detection model against supplied sensor readings and persist it."""
    try:
        result = run_pipeline_prediction(db, str(pipeline_id), sensor_readings)
        return {"status": "complete", "result": result}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
