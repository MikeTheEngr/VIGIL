"""
Generates synthetic turbofan engine degradation data in NASA CMAPSS format.
Used to validate the training pipeline end-to-end before swapping in the
real CMAPSS dataset (download from NASA's open data portal).

Real CMAPSS format: space-separated, no header, columns are:
unit_id, cycle, op1, op2, op3, s1..s21
"""
import numpy as np
import pandas as pd

np.random.seed(42)

N_ENGINES = 80
SENSOR_COUNT = 21

def generate_engine_run(unit_id: int):
    """Simulate one engine's full life from healthy to failure."""
    max_cycle = np.random.randint(140, 280)
    cycles = np.arange(1, max_cycle + 1)

    # Degradation curve: flat then accelerating decline near end of life
    progress = cycles / max_cycle
    safe_tail = np.clip(progress - 0.6, 0, None)
    degradation = np.where(progress < 0.6, progress * 0.3, safe_tail ** 1.8 * 3 + 0.18)

    rows = []
    for i, cycle in enumerate(cycles):
        deg = degradation[i]
        noise = np.random.normal(0, 1, SENSOR_COUNT)

        # Base sensor values with degradation trend baked in
        sensors = {
            's1':  518.67 + noise[0]*0.1,
            's2':  642.0 + deg*15 + noise[1]*0.4,
            's3':  1590.0 + deg*45 + noise[2]*1.5,
            's4':  1400.0 + deg*40 + noise[3]*1.2,
            's5':  14.62 + noise[4]*0.01,
            's6':  21.61 + noise[5]*0.02,
            's7':  553.0 - deg*20 + noise[6]*0.6,
            's8':  2388.0 + deg*5 + noise[7]*0.2,
            's9':  9050.0 + deg*60 + noise[8]*3,
            's10': 1.30 + noise[9]*0.001,
            's11': 47.3 + deg*2.5 + noise[10]*0.1,
            's12': 522.0 - deg*15 + noise[11]*0.5,
            's13': 2388.0 + deg*4 + noise[12]*0.2,
            's14': 8140.0 - deg*70 + noise[13]*3,
            's15': 8.4 + deg*0.4 + noise[14]*0.03,
            's16': 0.03 + noise[15]*0.001,
            's17': 393.0 + deg*8 + noise[16]*0.6,
            's18': 2388.0 + noise[17]*0.1,
            's19': 100.0 + noise[18]*0.05,
            's20': 39.0 - deg*1.5 + noise[19]*0.1,
            's21': 23.4 - deg*1.0 + noise[20]*0.08,
        }
        row = {'unit_id': unit_id, 'cycle': cycle,
               'op1': np.random.normal(0, 0.001),
               'op2': np.random.normal(0, 0.0002),
               'op3': 100.0}
        row.update(sensors)
        rows.append(row)

    return pd.DataFrame(rows)

def generate_dataset():
    all_engines = [generate_engine_run(uid) for uid in range(1, N_ENGINES + 1)]
    df = pd.concat(all_engines, ignore_index=True)
    return df

if __name__ == '__main__':
    df = generate_dataset()
    out_path = 'ml/data/raw/train_FD001_synthetic.csv'
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows across {N_ENGINES} engines -> {out_path}")
    print(df.groupby('unit_id')['cycle'].max().describe())
