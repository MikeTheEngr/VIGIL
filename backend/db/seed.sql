-- ═══════════════════════════════════════════
-- VIGIL — SEED DATA (for local dev/testing)
-- ═══════════════════════════════════════════

-- ── EQUIPMENT ──────────────────────────────
INSERT INTO equipment (id, name, type, location, serial_number, installed_at, status, health_score, rul_days)
VALUES
    ('a1111111-0000-0000-0000-000000000001', 'Turbine-01',   'turbine',    'Plant A - Bay 1', 'GT-001', NOW() - INTERVAL '3 years', 'active', 82.0, 44),
    ('a1111111-0000-0000-0000-000000000002', 'Compressor-A', 'compressor', 'Plant A - Bay 2', 'CP-014', NOW() - INTERVAL '5 years', 'active', 28.0, 8),
    ('a1111111-0000-0000-0000-000000000003', 'Pump-03',      'pump',       'Plant B - Bay 1', 'PM-031', NOW() - INTERVAL '1 years', 'active', 61.0, 30);

-- ── PIPELINES ──────────────────────────────
INSERT INTO pipelines (id, name, segment_code, material, diameter_mm, length_km, location, status, installed_at)
VALUES
    ('b2222222-0000-0000-0000-000000000001', 'PL-North', 'PL-N-001', 'steel', 48, 12.4, 'North Corridor', 'normal',   NOW() - INTERVAL '8 years'),
    ('b2222222-0000-0000-0000-000000000002', 'PL-East',  'PL-E-002', 'steel', 48, 9.7,  'East Corridor',  'critical', NOW() - INTERVAL '6 years');

-- ── SENSORS (equipment) ────────────────────
INSERT INTO sensors (id, name, type, unit, equipment_id, min_threshold, max_threshold)
VALUES
    ('c3333333-0000-0000-0000-000000000001', 'Turbine-01 Temp',      'temperature', '°C',  'a1111111-0000-0000-0000-000000000001', 300, 550),
    ('c3333333-0000-0000-0000-000000000002', 'Turbine-01 Vibration', 'vibration',   'mm/s','a1111111-0000-0000-0000-000000000001', 0,   2.5),
    ('c3333333-0000-0000-0000-000000000003', 'Compressor-A Temp',    'temperature', '°C',  'a1111111-0000-0000-0000-000000000002', 280, 520),
    ('c3333333-0000-0000-0000-000000000004', 'Compressor-A RPM',     'rpm',         'rpm', 'a1111111-0000-0000-0000-000000000002', 2800,3600);

-- ── SENSORS (pipeline) ─────────────────────
INSERT INTO sensors (id, name, type, unit, pipeline_id, min_threshold, max_threshold)
VALUES
    ('c3333333-0000-0000-0000-000000000005', 'PL-East Pressure In',  'pressure', 'bar', 'b2222222-0000-0000-0000-000000000002', 7.5, 9.5),
    ('c3333333-0000-0000-0000-000000000006', 'PL-East Pressure Out', 'pressure', 'bar', 'b2222222-0000-0000-0000-000000000002', 6.5, 8.5),
    ('c3333333-0000-0000-0000-000000000007', 'PL-East Acoustic',     'acoustic', 'dB',  'b2222222-0000-0000-0000-000000000002', 30,  55);

-- ── SENSOR READINGS — last 24h, every 15 min ────────────
-- Turbine-01 Temp — stable around 487°C
INSERT INTO sensor_readings (time, sensor_id, value)
SELECT
    NOW() - (n * INTERVAL '15 minutes'),
    'c3333333-0000-0000-0000-000000000001',
    487 + (random() * 6 - 3)
FROM generate_series(0, 95) AS n;

-- Compressor-A Temp — trending upward (degradation)
INSERT INTO sensor_readings (time, sensor_id, value)
SELECT
    NOW() - (n * INTERVAL '15 minutes'),
    'c3333333-0000-0000-0000-000000000003',
    495 + (96 - n) * 0.15 + (random() * 4 - 2)
FROM generate_series(0, 95) AS n;

-- PL-East Pressure Out — dropping (leak signature)
INSERT INTO sensor_readings (time, sensor_id, value)
SELECT
    NOW() - (n * INTERVAL '15 minutes'),
    'c3333333-0000-0000-0000-000000000006',
    7.8 - (96 - n) * 0.012 + (random() * 0.3 - 0.15)
FROM generate_series(0, 95) AS n;

-- PL-East Acoustic — spiking (leak signature)
INSERT INTO sensor_readings (time, sensor_id, value)
SELECT
    NOW() - (n * INTERVAL '15 minutes'),
    'c3333333-0000-0000-0000-000000000007',
    42 + (96 - n) * 0.25 + (random() * 4 - 2)
FROM generate_series(0, 95) AS n;

-- ── PREDICTIONS ────────────────────────────
INSERT INTO predictions (time, equipment_id, model_type, health_score, rul_days, confidence)
VALUES
    (NOW() - INTERVAL '2 minutes', 'a1111111-0000-0000-0000-000000000001', 'predictive_maintenance', 82.0, 44, 0.91),
    (NOW() - INTERVAL '2 minutes', 'a1111111-0000-0000-0000-000000000002', 'predictive_maintenance', 28.0, 8,  0.88),
    (NOW() - INTERVAL '2 minutes', 'a1111111-0000-0000-0000-000000000003', 'predictive_maintenance', 61.0, 30, 0.85);

INSERT INTO predictions (time, pipeline_id, model_type, anomaly_score, is_anomaly, confidence)
VALUES
    (NOW() - INTERVAL '2 minutes', 'b2222222-0000-0000-0000-000000000001', 'leak_detection', 0.12, FALSE, 0.94),
    (NOW() - INTERVAL '2 minutes', 'b2222222-0000-0000-0000-000000000002', 'leak_detection', 0.87, TRUE,  0.91);

-- ── ALERTS ─────────────────────────────────
INSERT INTO alerts (time, severity, type, title, message, equipment_id)
VALUES
    (NOW() - INTERVAL '4 minutes', 'critical', 'rul_low', 'Compressor-A RUL below critical threshold',
     'Remaining useful life: 8 days. Maintenance required.', 'a1111111-0000-0000-0000-000000000002');

INSERT INTO alerts (time, severity, type, title, message, pipeline_id)
VALUES
    (NOW() - INTERVAL '17 minutes', 'critical', 'anomaly_detected', 'Pipeline PL-East anomaly detected',
     'Anomaly score: 0.87. Possible leak detected.', 'b2222222-0000-0000-0000-000000000002');

INSERT INTO alerts (time, severity, type, title, message, equipment_id, is_acknowledged)
VALUES
    (NOW() - INTERVAL '42 minutes', 'warning', 'health_degraded', 'Turbine-03 health score degraded to 45%',
     'Health score dropped 12 points in the last 24 hours.', 'a1111111-0000-0000-0000-000000000003', TRUE);
