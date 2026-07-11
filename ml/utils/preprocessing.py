import pandas as pd
import numpy as np

DROP_SENSORS = ['s1', 's5', 's6', 's10', 's16', 's18', 's19']
ALL_SENSORS = [f's{i}' for i in range(1, 22)]
USED_SENSORS = [s for s in ALL_SENSORS if s not in DROP_SENSORS]


def load_cmapss(path: str) -> pd.DataFrame:
    if path.endswith('.csv'):
        df = pd.read_csv(path)
    else:
        df = pd.read_csv(path, sep=r'\s+', header=None)
        df.dropna(axis=1, how='all', inplace=True)
        expected_cols = ['unit_id', 'cycle', 'op1', 'op2', 'op3'] + ALL_SENSORS
        df = df.iloc[:, :len(expected_cols)]
        df.columns = expected_cols
    return df


def add_rul_labels(df: pd.DataFrame, cap: int = 125) -> pd.DataFrame:
    df = df.copy()
    max_cycles = df.groupby('unit_id')['cycle'].max().reset_index()
    max_cycles.columns = ['unit_id', 'max_cycle']
    df = df.merge(max_cycles, on='unit_id')
    df['RUL'] = (df['max_cycle'] - df['cycle']).clip(upper=cap)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in USED_SENSORS:
        grp = df.groupby('unit_id')[col]
        df[f'{col}_mean5']  = grp.transform(lambda x: x.rolling(5,  min_periods=1).mean())
        df[f'{col}_std5']   = grp.transform(lambda x: x.rolling(5,  min_periods=1).std().fillna(0))
        df[f'{col}_mean10'] = grp.transform(lambda x: x.rolling(10, min_periods=1).mean())
        df[f'{col}_delta']  = grp.transform(lambda x: x.diff().fillna(0))
    df['cycle_norm'] = df.groupby('unit_id')['cycle'].transform(
        lambda x: (x - x.min()) / (x.max() - x.min() + 1e-8)
    )
    return df


def get_feature_columns(df: pd.DataFrame) -> list:
    exclude = {'unit_id', 'cycle', 'max_cycle', 'RUL'}
    return [c for c in df.columns if c not in exclude]


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