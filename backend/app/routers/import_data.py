"""
Data import endpoints — operators upload CSV files to onboard their
real equipment, pipeline, sensor, and reading data into Vigil.
"""
import io
import uuid
import csv
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter()


def parse_csv(file_bytes: bytes) -> list[dict]:
    content = file_bytes.decode("utf-8-sig")  # handle BOM from Excel
    reader = csv.DictReader(io.StringIO(content))
    return [row for row in reader]


# ── GET /import/templates ─────────────────────────────────────────────
# Returns info about expected CSV formats
@router.get("/templates")
def get_templates():
    return {
        "equipment": {
            "description": "Upload your equipment list",
            "required_columns": ["name", "type", "location", "serial_number"],
            "optional_columns": ["installed_at", "health_score", "rul_days"],
            "type_values": ["turbine", "compressor", "pump", "motor", "generator", "valve"],
            "example_row": {
                "name": "Turbine-01",
                "type": "turbine",
                "location": "Plant A - Bay 1",
                "serial_number": "GT-001",
                "installed_at": "2021-01-15"
            }
        },
        "pipelines": {
            "description": "Upload your pipeline segments",
            "required_columns": ["name", "segment_code", "material"],
            "optional_columns": ["diameter_mm", "length_km", "location", "installed_at"],
            "material_values": ["steel", "hdpe", "cast_iron", "copper", "pvc"],
            "example_row": {
                "name": "PL-North",
                "segment_code": "PL-N-001",
                "material": "steel",
                "diameter_mm": "48",
                "length_km": "12.4",
                "location": "North Corridor"
            }
        },
        "sensors": {
            "description": "Upload sensor definitions",
            "required_columns": ["name", "type", "equipment_serial_or_pipeline_code"],
            "optional_columns": ["unit", "min_threshold", "max_threshold"],
            "type_values": ["temperature", "pressure", "vibration", "rpm", "flow_rate", "acoustic"],
            "example_row": {
                "name": "Turbine-01 Temp",
                "type": "temperature",
                "unit": "°C",
                "equipment_serial_or_pipeline_code": "GT-001",
                "min_threshold": "300",
                "max_threshold": "550"
            }
        },
        "readings": {
            "description": "Upload historical sensor readings",
            "required_columns": ["sensor_name", "time", "value"],
            "optional_columns": ["quality"],
            "example_row": {
                "sensor_name": "Turbine-01 Temp",
                "time": "2026-01-15T10:30:00Z",
                "value": "487.3",
                "quality": "good"
            }
        }
    }


# ── POST /import/equipment ─────────────────────────────────────────────
@router.post("/equipment")
async def import_equipment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    rows = parse_csv(await file.read())
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    inserted = 0
    skipped = 0
    errors = []

    for i, row in enumerate(rows, 1):
        try:
            name = row.get("name", "").strip()
            eq_type = row.get("type", "").strip().lower()

            if not name or not eq_type:
                errors.append(f"Row {i}: missing required fields 'name' or 'type'")
                skipped += 1
                continue

            installed_at = None
            if row.get("installed_at", "").strip():
                try:
                    installed_at = datetime.fromisoformat(row["installed_at"].strip())
                except ValueError:
                    pass

            db.execute(text("""
                INSERT INTO equipment (id, name, type, location, serial_number, installed_at, status, health_score, rul_days)
                VALUES (:id, :name, :type, :location, :serial, :installed_at, 'active', :health, :rul)
                ON CONFLICT (serial_number) DO UPDATE SET
                    name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    location = EXCLUDED.location,
                    updated_at = NOW()
            """), {
                "id": str(uuid.uuid4()),
                "name": name,
                "type": eq_type,
                "location": row.get("location", "").strip() or None,
                "serial": row.get("serial_number", "").strip() or None,
                "installed_at": installed_at,
                "health": float(row["health_score"]) if row.get("health_score", "").strip() else None,
                "rul": int(row["rul_days"]) if row.get("rul_days", "").strip() else None,
            })
            inserted += 1

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1

    db.commit()
    return {
        "status": "complete",
        "inserted": inserted,
        "skipped": skipped,
        "errors": errors[:10]  # return first 10 errors max
    }


# ── POST /import/pipelines ─────────────────────────────────────────────
@router.post("/pipelines")
async def import_pipelines(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    rows = parse_csv(await file.read())
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    inserted = 0
    skipped = 0
    errors = []

    for i, row in enumerate(rows, 1):
        try:
            name = row.get("name", "").strip()
            material = row.get("material", "").strip().lower()

            if not name:
                errors.append(f"Row {i}: missing required field 'name'")
                skipped += 1
                continue

            db.execute(text("""
                INSERT INTO pipelines (id, name, segment_code, material, diameter_mm, length_km, location, status, installed_at)
                VALUES (:id, :name, :code, :material, :diameter, :length, :location, 'normal', :installed_at)
                ON CONFLICT (segment_code) DO UPDATE SET
                    name = EXCLUDED.name,
                    material = EXCLUDED.material,
                    diameter_mm = EXCLUDED.diameter_mm,
                    length_km = EXCLUDED.length_km,
                    location = EXCLUDED.location,
                    updated_at = NOW()
            """), {
                "id": str(uuid.uuid4()),
                "name": name,
                "code": row.get("segment_code", "").strip() or None,
                "material": material or None,
                "diameter": float(row["diameter_mm"]) if row.get("diameter_mm", "").strip() else None,
                "length": float(row["length_km"]) if row.get("length_km", "").strip() else None,
                "location": row.get("location", "").strip() or None,
                "installed_at": None,
            })
            inserted += 1

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1

    db.commit()
    return {"status": "complete", "inserted": inserted, "skipped": skipped, "errors": errors[:10]}


# ── POST /import/sensors ───────────────────────────────────────────────
@router.post("/sensors")
async def import_sensors(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    rows = parse_csv(await file.read())
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    inserted = 0
    skipped = 0
    errors = []

    for i, row in enumerate(rows, 1):
        try:
            name = row.get("name", "").strip()
            sensor_type = row.get("type", "").strip().lower()
            ref_code = row.get("equipment_serial_or_pipeline_code", "").strip()

            if not name or not sensor_type or not ref_code:
                errors.append(f"Row {i}: missing required fields")
                skipped += 1
                continue

            # Try to find equipment first, then pipeline
            eq_row = db.execute(text(
                "SELECT id FROM equipment WHERE serial_number = :code"
            ), {"code": ref_code}).fetchone()

            pl_row = None
            if not eq_row:
                pl_row = db.execute(text(
                    "SELECT id FROM pipelines WHERE segment_code = :code"
                ), {"code": ref_code}).fetchone()

            if not eq_row and not pl_row:
                errors.append(f"Row {i}: no equipment or pipeline found with code '{ref_code}'")
                skipped += 1
                continue

            db.execute(text("""
                INSERT INTO sensors (id, name, type, unit, equipment_id, pipeline_id, is_active, min_threshold, max_threshold)
                VALUES (:id, :name, :type, :unit, :eq_id, :pl_id, true, :min_t, :max_t)
            """), {
                "id": str(uuid.uuid4()),
                "name": name,
                "type": sensor_type,
                "unit": row.get("unit", "").strip() or None,
                "eq_id": str(eq_row[0]) if eq_row else None,
                "pl_id": str(pl_row[0]) if pl_row else None,
                "min_t": float(row["min_threshold"]) if row.get("min_threshold", "").strip() else None,
                "max_t": float(row["max_threshold"]) if row.get("max_threshold", "").strip() else None,
            })
            inserted += 1

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1

    db.commit()
    return {"status": "complete", "inserted": inserted, "skipped": skipped, "errors": errors[:10]}


# ── POST /import/readings ──────────────────────────────────────────────
@router.post("/readings")
async def import_readings(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    rows = parse_csv(await file.read())
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Build sensor name → id lookup
    sensor_rows = db.execute(text("SELECT id, name FROM sensors")).fetchall()
    sensor_map = {row.name: str(row.id) for row in sensor_rows}

    inserted = 0
    skipped = 0
    errors = []
    batch = []

    for i, row in enumerate(rows, 1):
        try:
            sensor_name = row.get("sensor_name", "").strip()
            time_str = row.get("time", "").strip()
            value_str = row.get("value", "").strip()

            if not sensor_name or not time_str or not value_str:
                errors.append(f"Row {i}: missing required fields")
                skipped += 1
                continue

            if sensor_name not in sensor_map:
                errors.append(f"Row {i}: sensor '{sensor_name}' not found")
                skipped += 1
                continue

            batch.append({
                "sensor_id": sensor_map[sensor_name],
                "time": datetime.fromisoformat(time_str.replace("Z", "+00:00")),
                "value": float(value_str),
                "quality": row.get("quality", "good").strip() or "good"
            })
            inserted += 1

            # Insert in batches of 500
            if len(batch) >= 500:
                db.execute(text("""
                    INSERT INTO sensor_readings (time, sensor_id, value, quality)
                    VALUES (:time, :sensor_id, :value, :quality)
                    ON CONFLICT DO NOTHING
                """), batch)
                db.commit()
                batch = []

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1

    # Insert remaining batch
    if batch:
        db.execute(text("""
            INSERT INTO sensor_readings (time, sensor_id, value, quality)
            VALUES (:time, :sensor_id, :value, :quality)
            ON CONFLICT DO NOTHING
        """), batch)
        db.commit()

    return {"status": "complete", "inserted": inserted, "skipped": skipped, "errors": errors[:10]}
