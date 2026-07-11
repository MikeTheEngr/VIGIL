"""
Vigil Sensor Simulator.

Continuously generates realistic sensor readings for all registered sensors
and posts them to the backend's ingest endpoint — simulating a real IoT
gateway. Designed to run as a long-lived container (see Dockerfile.simulator).
"""
import os
import time
import random
import requests
from datetime import datetime, timezone

API_URL = os.environ.get("API_URL", "http://localhost:8000")
INTERVAL_SECONDS = int(os.environ.get("INTERVAL_SECONDS", "30"))

# Base values + noise profile per sensor type — mirrors the seed data ranges
PROFILES = {
    "temperature": {"base": 487, "noise": 4, "drift": 0.0},
    "vibration":   {"base": 0.9, "noise": 0.15, "drift": 0.0},
    "rpm":         {"base": 3200, "noise": 30, "drift": 0.0},
    "pressure":    {"base": 7.8, "noise": 0.2, "drift": 0.0},
    "flow_rate":   {"base": 118, "noise": 4, "drift": 0.0},
    "acoustic":    {"base": 43, "noise": 3, "drift": 0.0},
}


def fetch_sensors() -> list[dict]:
    resp = requests.get(f"{API_URL}/api/v1/sensors", timeout=10)
    resp.raise_for_status()
    return resp.json()


def generate_reading(sensor: dict) -> float:
    profile = PROFILES.get(sensor["type"], {"base": 50, "noise": 2, "drift": 0.0})
    value = profile["base"] + random.gauss(0, profile["noise"])
    return round(value, 2)


def push_readings(sensors: list[dict]) -> int:
    now = datetime.now(timezone.utc).isoformat()
    payload = [
        {"sensor_id": s["id"], "time": now, "value": generate_reading(s)}
        for s in sensors
    ]
    resp = requests.post(f"{API_URL}/api/v1/sensors/readings/ingest", json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json().get("ingested", 0)


def run(max_iterations: int | None = None):
    print(f"[simulator] starting — API={API_URL}, interval={INTERVAL_SECONDS}s")
    iteration = 0
    while True:
        try:
            sensors = fetch_sensors()
            active = [s for s in sensors if s.get("is_active", True)]
            if not active:
                print("[simulator] no active sensors found, retrying...")
            else:
                count = push_readings(active)
                print(f"[simulator] pushed {count} readings @ {datetime.now().strftime('%H:%M:%S')}")
        except requests.RequestException as e:
            print(f"[simulator] request failed: {e}")

        iteration += 1
        if max_iterations and iteration >= max_iterations:
            break
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    run()
