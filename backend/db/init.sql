-- ═══════════════════════════════════════════
-- VIGIL — DATABASE SCHEMA
-- TimescaleDB (PostgreSQL)
-- ═══════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ═══════════════════════════════════════════
-- 1. EQUIPMENT
-- ═══════════════════════════════════════════
CREATE TABLE equipment (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    type          VARCHAR(50)  NOT NULL,
    location      VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    installed_at  TIMESTAMPTZ,
    status        VARCHAR(20)  NOT NULL DEFAULT 'active',
    health_score  FLOAT,
    rul_days      INTEGER,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════
-- 2. PIPELINES
-- ═══════════════════════════════════════════
CREATE TABLE pipelines (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    segment_code  VARCHAR(50)  UNIQUE,
    material      VARCHAR(50),
    diameter_mm   FLOAT,
    length_km     FLOAT,
    location      VARCHAR(150),
    status        VARCHAR(20)  NOT NULL DEFAULT 'normal',
    installed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════
-- 3. SENSORS
-- ═══════════════════════════════════════════
CREATE TABLE sensors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    unit            VARCHAR(20),
    equipment_id    UUID REFERENCES equipment(id) ON DELETE SET NULL,
    pipeline_id     UUID REFERENCES pipelines(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    min_threshold   FLOAT,
    max_threshold   FLOAT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sensor_parent CHECK (
        (equipment_id IS NOT NULL AND pipeline_id IS NULL) OR
        (equipment_id IS NULL AND pipeline_id IS NOT NULL)
    )
);


-- ═══════════════════════════════════════════
-- 4. SENSOR READINGS — HYPERTABLE
-- ═══════════════════════════════════════════
CREATE TABLE sensor_readings (
    time        TIMESTAMPTZ  NOT NULL,
    sensor_id   UUID         NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    value       FLOAT        NOT NULL,
    quality     VARCHAR(10)  DEFAULT 'good',
    PRIMARY KEY (time, sensor_id)
);

SELECT create_hypertable('sensor_readings', 'time');

ALTER TABLE sensor_readings SET (
    timescaledb.compress,
    timescaledb.compress_orderby = 'time DESC',
    timescaledb.compress_segmentby = 'sensor_id'
);

SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');
SELECT add_retention_policy('sensor_readings', INTERVAL '2 years');


-- ═══════════════════════════════════════════
-- 5. ML PREDICTIONS
-- ═══════════════════════════════════════════
CREATE TABLE predictions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    equipment_id    UUID         REFERENCES equipment(id) ON DELETE CASCADE,
    pipeline_id     UUID         REFERENCES pipelines(id) ON DELETE CASCADE,
    model_type      VARCHAR(50)  NOT NULL,
    health_score    FLOAT,
    rul_days        INTEGER,
    anomaly_score   FLOAT,
    is_anomaly      BOOLEAN DEFAULT FALSE,
    confidence      FLOAT,
    features_used   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT create_hypertable('predictions', 'time');


-- ═══════════════════════════════════════════
-- 6. ALERTS
-- ═══════════════════════════════════════════
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    severity        VARCHAR(20)  NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    equipment_id    UUID REFERENCES equipment(id) ON DELETE SET NULL,
    pipeline_id     UUID REFERENCES pipelines(id)  ON DELETE SET NULL,
    sensor_id       UUID REFERENCES sensors(id)    ON DELETE SET NULL,
    prediction_id   UUID REFERENCES predictions(id) ON DELETE SET NULL,
    is_acknowledged BOOLEAN     NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),
    resolved        BOOLEAN     NOT NULL DEFAULT FALSE,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════
-- 7. USERS
-- ═══════════════════════════════════════════
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(200) UNIQUE NOT NULL,
    name          VARCHAR(100),
    role          VARCHAR(20) NOT NULL DEFAULT 'operator',
    password_hash VARCHAR(255),
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════
CREATE INDEX idx_readings_sensor_time
    ON sensor_readings (sensor_id, time DESC);

CREATE INDEX idx_alerts_unresolved
    ON alerts (severity, time DESC)
    WHERE resolved = FALSE;

CREATE INDEX idx_predictions_equipment
    ON predictions (equipment_id, time DESC);

CREATE INDEX idx_predictions_pipeline
    ON predictions (pipeline_id, time DESC);


-- ═══════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════
CREATE VIEW latest_sensor_readings AS
    SELECT DISTINCT ON (sensor_id)
        sensor_id, time, value, quality
    FROM sensor_readings
    ORDER BY sensor_id, time DESC;

CREATE VIEW equipment_health AS
    SELECT
        e.id, e.name, e.type, e.location,
        e.status, e.health_score, e.rul_days,
        p.health_score   AS latest_prediction_score,
        p.rul_days       AS latest_rul,
        p.time           AS last_predicted_at
    FROM equipment e
    LEFT JOIN LATERAL (
        SELECT health_score, rul_days, time
        FROM predictions
        WHERE equipment_id = e.id
        ORDER BY time DESC
        LIMIT 1
    ) p ON TRUE;

CREATE VIEW active_critical_alerts AS
    SELECT * FROM alerts
    WHERE severity = 'critical'
    AND resolved = FALSE
    ORDER BY time DESC;
