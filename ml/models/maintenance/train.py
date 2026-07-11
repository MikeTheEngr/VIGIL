"""
Trains the Predictive Maintenance model — GradientBoostingRegressor
predicting Remaining Useful Life (RUL) from engineered sensor features.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from ml.utils.preprocessing import (
    load_cmapss, add_rul_labels, engineer_features,
    get_feature_columns, rul_to_health_score
)

DATA_PATH  = r'C:\Users\HP\Desktop\V I G I L\ml\data\raw\train_FD001.txt'
MODEL_DIR  = 'ml/models/maintenance'


def train_model():
    print(f"Loading data from {DATA_PATH} ...")
    df = load_cmapss(DATA_PATH)
    df = add_rul_labels(df)
    df = engineer_features(df)

    feature_cols = get_feature_columns(df)
    X = df[feature_cols]
    y = df['RUL']

    print(f"Dataset: {len(df)} rows, {len(feature_cols)} features, "
          f"{df['unit_id'].nunique()} engines")

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    print("Training GradientBoostingRegressor ...")
    model = GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_val)
    mae  = mean_absolute_error(y_val, y_pred)
    rmse = root_mean_squared_error(y_val, y_pred)
    print(f"\nValidation results:")
    print(f"  MAE:  {mae:.2f} cycles")
    print(f"  RMSE: {rmse:.2f} cycles")

    # Quick sanity check — convert a few predictions to health scores
    print(f"\nSample predictions (health score):")
    for true_rul, pred_rul in list(zip(y_val[:5], y_pred[:5])):
        print(f"  True RUL: {true_rul:>6.1f} | Pred RUL: {pred_rul:>6.1f} "
              f"| Health: {rul_to_health_score(pred_rul):>5.1f}%")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model,        f'{MODEL_DIR}/model.pkl')
    joblib.dump(scaler,       f'{MODEL_DIR}/scaler.pkl')
    joblib.dump(feature_cols, f'{MODEL_DIR}/features.pkl')
    print(f"\nSaved model, scaler, and feature list to {MODEL_DIR}/")

    return model, scaler, {'mae': mae, 'rmse': rmse}


if __name__ == '__main__':
    train_model()
