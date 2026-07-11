# VIGIL

**Predictive Intelligence for Industrial Infrastructure**

Vigil is an AI-powered industrial monitoring platform that watches over critical equipment and pipeline infrastructure — forecasting failures before they happen and detecting leaks through real-time anomaly detection.

---

## What it does

**Predictive Maintenance Engine** — analyzes equipment sensor data (temperature, vibration, RPM) and forecasts Remaining Useful Life (RUL) using a GradientBoosting regression model trained on turbofan degradation data, surfacing a health score and risk level before failure occurs.

**Pipeline Leak Detection** — monitors pipeline sensor streams (pressure, flow rate, acoustic emission) for the physical signature of a leak, using an ensemble of a supervised classifier and an unsupervised isolation forest to catch both known and novel anomaly patterns.

Both systems feed a single live dashboard, complete with health trends, alert management, and automatic alert generation when risk thresholds are crossed.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Recharts |
| Backend | FastAPI, SQLAlchemy, APScheduler |
| Database | TimescaleDB (PostgreSQL) — hypertables for sensor time-series |
| ML | scikit-learn (GradientBoosting, RandomForest, IsolationForest) |
| Infra | Docker Compose, designed for Vercel (frontend) + GCP Cloud Run (backend) |

---

## Project structure

```
vigil/
├── frontend/        Next.js + TypeScript dashboard
├── backend/          FastAPI REST API
├── ml/                Model training, inference, synthetic data generation
└── docker/          Dockerfiles + docker-compose for local/prod parity
```

---

## Running locally

### With Docker (recommended)

```bash
cp .env.example .env
# edit .env with your own POSTGRES_PASSWORD

cd docker
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

### Without Docker

**1. Database** — install PostgreSQL with the TimescaleDB extension, then:
```bash
psql -d vigil_db -f backend/db/init.sql
psql -d vigil_db -f backend/db/seed.sql   # optional demo data
```

**2. ML models** — train both models (synthetic data ships with the repo):
```bash
pip install -r backend/requirements.txt
PYTHONPATH=. python3 ml/models/maintenance/train.py
PYTHONPATH=. python3 ml/models/leak_detection/train.py
```

**3. Backend**
```bash
cd backend
PYTHONPATH=.:.. uvicorn app.main:app --reload
```

**4. Frontend**
```bash
cd frontend
npm install
npm run dev
```

**5. Sensor simulator** (optional — generates live streaming demo data)
```bash
API_URL=http://localhost:8000 python3 ml/utils/simulator.py
```

---

## A note on the ML data

The NASA CMAPSS turbofan degradation dataset (used for the maintenance model) lives outside this repo's network-installable sources, so `ml/data/raw/train_FD001_synthetic.csv` is a generated stand-in matching CMAPSS's exact column format. Drop the real file in at the same path and `train.py` requires no code changes. The leak detection dataset is synthetic by design — it encodes the actual physics of a pipeline leak (pressure drop downstream, flow loss, acoustic spike) rather than relying on proprietary sensor logs.

---

## License

Personal portfolio project.
