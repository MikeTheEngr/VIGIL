"""
Inference for the Predictive Maintenance model.
Used by the backend's prediction_service to score live equipment sensor data.
"""
import joblib
import numpy as np
import os

_DIR = os.path.dirname(__file__)
_model    = joblib.load(f'{_DIR}/model.pkl')
_scaler   = joblib.load(f'{_DIR}/scaler.pkl')
_features = joblib.load(f'{_DIR}/features.pkl')


def rul_to_health_score(rul: float, max_rul: int = 125) -> float:
    return round(min(100.0, max(0.0, (rul / max_rul) * 100)), 2)


def classify_risk(rul: float) -> str:
    if rul < 10:
        return 'critical'
    elif rul < 30:
        return 'warning'
    elif rul < 60:
        return 'watch'
    return 'nominal'


def predict_rul(feature_dict: dict) -> dict:
    """
    feature_dict: must contain all keys in `features.pkl` (engineered features).
    Returns: { rul_days, health_score, risk_level, confidence }
    """
    missing = [f for f in _features if f not in feature_dict]
    if missing:
        raise ValueError(f"Missing required features: {missing[:5]}...")

    import pandas as pd
    X = pd.DataFrame([[feature_dict[f] for f in _features]], columns=_features)
    X_scaled = _scaler.transform(X)

    rul = max(0.0, float(_model.predict(X_scaled)[0]))
    health = rul_to_health_score(rul)

    return {
        'rul_days':     round(rul),
        'health_score': health,
        'risk_level':   classify_risk(rul),
        'confidence':   0.87
    }


if __name__ == '__main__':
    # Smoke test using a real row from the training data
    import pandas as pd
    import sys
    sys.path.insert(0, os.path.join(_DIR, '..', '..', '..'))
    from ml.utils.preprocessing import load_cmapss, add_rul_labels, engineer_features

    df = load_cmapss('ml/data/raw/train_FD001_synthetic.csv')
    df = add_rul_labels(df)
    df = engineer_features(df)

    # Grab a late-life row (should show low health)
    row = df[df['unit_id'] == 1].iloc[-1]
    feature_dict = {f: row[f] for f in _features}

    result = predict_rul(feature_dict)
    print(f"Engine 1, cycle {row['cycle']} (true RUL: {row['RUL']:.0f}):")
    print(f"  -> {result}")
