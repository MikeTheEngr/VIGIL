from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import equipment, pipelines, sensors, predictions, alerts, import_data
from app.services.prediction_service import run_prediction_cycle

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(run_prediction_cycle, "interval", minutes=15)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Vigil API",
    description="Industrial AI Monitoring — Predictive Intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(equipment.router,    prefix="/api/v1/equipment",   tags=["Equipment"])
app.include_router(pipelines.router,    prefix="/api/v1/pipelines",   tags=["Pipelines"])
app.include_router(sensors.router,      prefix="/api/v1/sensors",     tags=["Sensors"])
app.include_router(predictions.router,  prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(alerts.router,       prefix="/api/v1/alerts",      tags=["Alerts"])
app.include_router(import_data.router,  prefix="/api/v1/import",      tags=["Import"])


@app.get("/health")
async def health_check():
    return {"status": "online", "system": "VIGIL-001"}
