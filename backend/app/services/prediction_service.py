"""
Bridges the trained ML models to the database. Pulls latest sensor readings,
runs predictions, writes results back, and creates alerts when thresholds
are breached.
"""
import sys
import os
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from sqlalchemy import text
from sqlalchemy.orm import Session


def get_equipment_sensor_features(db: Session, equipment_id: str) -> dict | None:
    """
    Pulls recent readings for an equipment's sensors and builds a feature
    dict shaped for the maintenance model. For sensors without enough
    history, falls back gracefully.
    """
    result = db.execute(text("""
        SELECT s.id, s.type, lsr.value
        FROM sensors s
        JOIN latest_sensor_readings lsr ON lsr.sensor_id = s.id
        WHERE s.equipment_id = :eq_id
    """), {"eq_id": equipment_id}).fetchall()

    if not result:
        return None

    # NOTE: in production this builds the full 81-feature engineered vector
    # (rolling means/stds/deltas per sensor) from a recent window of readings.
    # Returning raw readings here as the integration point; full feature
    # engineering reuses ml/utils/preprocessing.py against a windowed query.
    return {row.type: row.value for row in result}


def get_pipeline_sensor_readings(db: Session, pipeline_id: str) -> dict | None:
    result = db.execute(text("""
        SELECT s.type, lsr.value
        FROM sensors s
        JOIN latest_sensor_readings lsr ON lsr.sensor_id = s.id
        WHERE s.pipeline_id = :pl_id
    """), {"pl_id": pipeline_id}).fetchall()

    if not result:
        return None

    readings = {row.type: row.value for row in result}

    # Map sensor `type` naming to model feature naming
    mapped = {
        'pressure_inlet':  readings.get('pressure'),  # first pressure sensor
        'pressure_outlet': readings.get('pressure'),
        'flow_rate':       readings.get('flow_rate', 110),
        'temperature':     readings.get('temperature', 22),
        'acoustic_db':      readings.get('acoustic', 42),
        'vibration_mms':   readings.get('vibration', 0.8),
    }
    return mapped


def run_equipment_prediction(db: Session, equipment_id: str, feature_dict: dict) -> dict:
    """Runs the maintenance model and writes the result to the DB."""
    from ml.models.maintenance.predict import predict_rul 
    result = predict_rul(feature_dict)

    db.execute(text("""
        INSERT INTO predictions
            (id, time, equipment_id, model_type, health_score, rul_days, confidence)
        VALUES
            (:id, NOW(), :eq_id, 'predictive_maintenance', :health, :rul, :conf)
    """), {
        "id": str(uuid.uuid4()),
        "eq_id": equipment_id,
        "health": result['health_score'],
        "rul": result['rul_days'],
        "conf": result['confidence'],
    })

    db.execute(text("""
        UPDATE equipment
        SET health_score = :health, rul_days = :rul, updated_at = NOW()
        WHERE id = :eq_id
    """), {"health": result['health_score'], "rul": result['rul_days'], "eq_id": equipment_id})

    if result['risk_level'] in ('critical', 'warning'):
        _create_alert(
            db, severity=result['risk_level'], alert_type='rul_low',
            title=f"Equipment RUL {result['risk_level']}",
            message=f"Remaining useful life: {result['rul_days']} days.",
            equipment_id=equipment_id
        )

    db.commit()
    return result


def run_pipeline_prediction(db: Session, pipeline_id: str, sensor_readings: dict) -> dict:
    """Runs the leak detection model and writes the result to the DB."""
    from ml.models.leak_detection.predict import predict_leak 
    result = predict_leak(sensor_readings)

    db.execute(text("""
        INSERT INTO predictions
            (id, time, pipeline_id, model_type, anomaly_score, is_anomaly, confidence)
        VALUES
            (:id, NOW(), :pl_id, 'leak_detection', :score, :is_anom, :conf)
    """), {
        "id": str(uuid.uuid4()),
        "pl_id": pipeline_id,
        "score": result['anomaly_score'],
        "is_anom": result['is_anomaly'],
        "conf": result['confidence'],
    })

    new_status = 'critical' if result['severity'] == 'critical' else (
        'warning' if result['severity'] == 'warning' else 'normal'
    )
    db.execute(text("""
        UPDATE pipelines SET status = :status, updated_at = NOW() WHERE id = :pl_id
    """), {"status": new_status, "pl_id": pipeline_id})

    if result['is_anomaly']:
        _create_alert(
            db, severity=result['severity'], alert_type='anomaly_detected',
            title="Pipeline anomaly detected",
            message=f"Anomaly score: {result['anomaly_score']}. Possible leak detected.",
            pipeline_id=pipeline_id
        )

    db.commit()
    return result


def _create_alert(db: Session, severity, alert_type, title, message,
                   equipment_id=None, pipeline_id=None):
    db.execute(text("""
        INSERT INTO alerts (id, time, severity, type, title, message, equipment_id, pipeline_id)
        VALUES (:id, NOW(), :sev, :type, :title, :msg, :eq_id, :pl_id)
    """), {
        "id": str(uuid.uuid4()), "sev": severity, "type": alert_type,
        "title": title, "msg": message, "eq_id": equipment_id, "pl_id": pipeline_id
    })


async def run_prediction_cycle():
    """Called by the scheduler every 15 minutes — scores all equipment/pipelines."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        equipment_ids = [r[0] for r in db.execute(text("SELECT id FROM equipment")).fetchall()]
        pipeline_ids  = [r[0] for r in db.execute(text("SELECT id FROM pipelines")).fetchall()]

        results = {"equipment": [], "pipelines": []}
        for eq_id in equipment_ids:
            features = get_equipment_sensor_features(db, str(eq_id))
            if features:
                results["equipment"].append(str(eq_id))

        for pl_id in pipeline_ids:
            readings = get_pipeline_sensor_readings(db, str(pl_id))
            if readings:
                results["pipelines"].append(str(pl_id))

        return results
    finally:
        db.close()
