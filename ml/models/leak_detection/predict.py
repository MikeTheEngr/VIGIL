"""
Inference for the Pipeline Leak Detection model.
Combines supervised classifier probability with unsupervised anomaly score.
"""
import joblib
import numpy as np
import pandas as pd
import os

_DIR = os.path.dirname(__file__)
_clf      = joblib.load(f'{_DIR}/classifier.pkl')
_iso      = joblib.load(f'{_DIR}/isolation_forest.pkl')
_scaler   = joblib.load(f'{_DIR}/scaler.pkl')
_features = joblib.load(f'{_DIR}/features.pkl')


def classify_severity(score: float) -> str:
    if score > 0.85:
        return 'critical'
    elif score > 0.65:
        return 'warning'
    elif score > 0.5:
        return 'watch'
    return 'nominal'


def predict_leak(sensor_readings: dict) -> dict:
    """
    sensor_readings: dict with keys matching raw sensor names
                      (pressure_inlet, pressure_outlet, flow_rate,
                       temperature, acoustic_db, vibration_mms)
    Derived features (pressure_diff, flow_pressure_ratio) computed here.
    Returns: { is_anomaly, anomaly_score, confidence, severity }
    """
    readings = dict(sensor_readings)
    readings['pressure_diff'] = readings['pressure_inlet'] - readings['pressure_outlet']
    readings['flow_pressure_ratio'] = readings['flow_rate'] / readings['pressure_outlet']

    missing = [f for f in _features if f not in readings]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    X = pd.DataFrame([[readings[f] for f in _features]], columns=_features)
    X_scaled = _scaler.transform(X)

    prob = _clf.predict_proba(X_scaled)[0][1]

    iso_raw = _iso.decision_function(X_scaled)[0]
    iso_score = float(np.clip(1 - (iso_raw - (-0.5)) / (0.5 - (-0.5)), 0, 1))

    anomaly_score = round(float((prob * 0.7) + (iso_score * 0.3)), 4)
    is_anomaly = anomaly_score > 0.5

    return {
        'is_anomaly':    bool(is_anomaly),
        'anomaly_score': anomaly_score,
        'confidence':    round(float(prob), 4),
        'severity':      classify_severity(anomaly_score)
    }


if __name__ == '__main__':
    # Smoke test: one normal reading, one leak-signature reading
    normal_reading = {
        'pressure_inlet': 8.5, 'pressure_outlet': 7.8,
        'flow_rate': 120, 'temperature': 22,
        'acoustic_db': 42, 'vibration_mms': 0.8
    }
    leak_reading = {
        'pressure_inlet': 8.5, 'pressure_outlet': 6.1,
        'flow_rate': 95, 'temperature': 22,
        'acoustic_db': 71, 'vibration_mms': 2.6
    }

    print("Normal reading:", predict_leak(normal_reading))
    print("Leak signature:", predict_leak(leak_reading))
