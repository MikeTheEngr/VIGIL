from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.models.sensor import Sensor
from app.schemas.sensor import SensorResponse

router = APIRouter()


@router.get("/", response_model=List[SensorResponse])
def get_sensors(
    equipment_id: Optional[UUID] = Query(None),
    pipeline_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Sensor).filter(Sensor.is_active == True)
    if equipment_id:
        query = query.filter(Sensor.equipment_id == equipment_id)
    if pipeline_id:
        query = query.filter(Sensor.pipeline_id == pipeline_id)
    return query.all()


@router.get("/{sensor_id}/readings")
def get_sensor_readings(
    sensor_id: UUID,
    hours: int = Query(24, le=720),
    db: Session = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(hours=hours)
    rows = db.execute(text("""
        SELECT time, value, quality FROM sensor_readings
        WHERE sensor_id = :sensor_id AND time >= :since
        ORDER BY time ASC
    """), {"sensor_id": str(sensor_id), "since": since}).fetchall()

    return {
        "sensor_id": str(sensor_id),
        "hours": hours,
        "count": len(rows),
        "readings": [{"time": r.time, "value": r.value, "quality": r.quality} for r in rows],
    }


@router.get("/{sensor_id}/latest")
def get_latest_reading(sensor_id: UUID, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT time, value, quality FROM sensor_readings
        WHERE sensor_id = :sensor_id ORDER BY time DESC LIMIT 1
    """), {"sensor_id": str(sensor_id)}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="No readings found")
    return {"time": row.time, "value": row.value, "quality": row.quality}


@router.post("/readings/ingest", status_code=201)
def ingest_readings(
    readings: List[dict] = Body(
        ...,
        example=[{"sensor_id": "uuid-here", "time": "2026-06-30T12:00:00Z", "value": 487.2}],
    ),
    db: Session = Depends(get_db),
):
    """
    Bulk ingest sensor readings — used by the simulator / real IoT gateway.
    Expected: [{ "sensor_id": "...", "time": "ISO8601", "value": 98.4 }, ...]
    """
    if not readings:
        return {"ingested": 0}

    for r in readings:
        db.execute(text("""
            INSERT INTO sensor_readings (time, sensor_id, value)
            VALUES (:time, :sensor_id, :value)
            ON CONFLICT DO NOTHING
        """), {"time": r["time"], "sensor_id": r["sensor_id"], "value": r["value"]})

    db.commit()
    return {"ingested": len(readings)}
