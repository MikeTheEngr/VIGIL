"""
Trains the Pipeline Leak Detection model — an ensemble of:
  - RandomForestClassifier (supervised, catches known leak patterns)
  - IsolationForest         (unsupervised, catches novel/unknown anomalies)
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

from ml.utils.generate_leak_data import generate_pipeline_data

FEATURES = [
    'pressure_inlet', 'pressure_outlet',
    'flow_rate', 'temperature',
    'acoustic_db', 'vibration_mms',
    'pressure_diff', 'flow_pressure_ratio'
]

MODEL_DIR = 'ml/models/leak_detection'


def train_model():
    print("Generating synthetic pipeline data ...")
    df = generate_pipeline_data()

    X = df[FEATURES]
    y = df['label']

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, stratify=y, random_state=42
    )

    print("\nTraining RandomForestClassifier (supervised) ...")
    clf = RandomForestClassifier(
        n_estimators=200, max_depth=8,
        class_weight='balanced', random_state=42
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]
    print(classification_report(y_test, y_pred, target_names=['normal', 'anomaly']))
    auc = roc_auc_score(y_test, y_prob)
    print(f"ROC-AUC: {auc:.4f}")

    print("\nTraining IsolationForest (unsupervised) ...")
    iso = IsolationForest(contamination=0.1, random_state=42)
    iso.fit(X_train)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf,      f'{MODEL_DIR}/classifier.pkl')
    joblib.dump(iso,      f'{MODEL_DIR}/isolation_forest.pkl')
    joblib.dump(scaler,   f'{MODEL_DIR}/scaler.pkl')
    joblib.dump(FEATURES, f'{MODEL_DIR}/features.pkl')
    print(f"\nSaved classifier, isolation forest, scaler, features -> {MODEL_DIR}/")

    return clf, iso, scaler, {'roc_auc': auc}


if __name__ == '__main__':
    train_model()
