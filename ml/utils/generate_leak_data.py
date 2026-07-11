"""
Generates synthetic pipeline sensor data with physics-informed leak signatures:
a leak causes pressure drop downstream, flow loss, and an acoustic emission spike.
"""
import numpy as np
import pandas as pd


def generate_pipeline_data(n_normal: int = 5000, n_anomaly: int = 500, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)

    normal = pd.DataFrame({
        'pressure_inlet':  np.random.normal(8.5, 0.3,  n_normal),
        'pressure_outlet': np.random.normal(7.8, 0.25, n_normal),
        'flow_rate':       np.random.normal(120, 5,    n_normal),
        'temperature':     np.random.normal(22,  1.5,  n_normal),
        'acoustic_db':     np.random.normal(42,  3,    n_normal),
        'vibration_mms':   np.random.normal(0.8, 0.2,  n_normal),
        'label': 0
    })

    anomaly = pd.DataFrame({
        'pressure_inlet':  np.random.normal(8.5,  0.3,  n_anomaly),
        'pressure_outlet': np.random.normal(6.2,  0.8,  n_anomaly),
        'flow_rate':       np.random.normal(98,   12,   n_anomaly),
        'temperature':     np.random.normal(22,   2,    n_anomaly),
        'acoustic_db':     np.random.normal(68,   8,    n_anomaly),
        'vibration_mms':   np.random.normal(2.4,  0.6,  n_anomaly),
        'label': 1
    })

    df = pd.concat([normal, anomaly]).sample(frac=1, random_state=seed).reset_index(drop=True)
    df['pressure_diff'] = df['pressure_inlet'] - df['pressure_outlet']
    df['flow_pressure_ratio'] = df['flow_rate'] / df['pressure_outlet']

    return df


if __name__ == '__main__':
    df = generate_pipeline_data()
    out_path = 'ml/data/processed/pipeline_sensor_data.csv'
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows ({df['label'].sum()} anomalies) -> {out_path}")
    print(df.groupby('label').mean(numeric_only=True).round(2))
