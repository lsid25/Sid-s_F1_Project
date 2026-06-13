"""
Telemetry API Routes
GET /api/telemetry/compare   — Side-by-side driver telemetry comparison
GET /api/telemetry/sessions  — Available sessions from OpenF1
GET /api/telemetry/drivers   — Driver roster for a session
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.openf1_client import openf1_client
from app.ml.feature_engineering import engineer_features

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Response Models ──────────────────────────────────────────

class TelemetryPoint(BaseModel):
    time_index: int
    driver1_speed: float
    driver1_rpm: float
    driver1_gear: int
    driver1_accel: float
    driver1_derating: bool
    driver2_speed: float
    driver2_rpm: float
    driver2_gear: int
    driver2_accel: float
    driver2_derating: bool


class TelemetryComparisonResponse(BaseModel):
    session_key: str
    driver1_id: int
    driver2_id: int
    data_points: int
    data: list[dict]


# ─── Telemetry Comparison Endpoint ───────────────────────────

@router.get("/compare", response_model=TelemetryComparisonResponse)
async def get_telemetry_comparison(
    session_key: str = Query(..., description="OpenF1 session key"),
    driver1: int = Query(..., ge=1, le=99, description="First driver number"),
    driver2: int = Query(..., ge=1, le=99, description="Second driver number"),
    limit: int = Query(default=200, ge=10, le=1000, description="Max data points per driver"),
):
    """
    Fetch and process telemetry for two drivers.
    Computes acceleration (dv/dt) and detects derating zones.
    Returns merged time-series data for Recharts rendering.
    """
    try:
        # Fetch both drivers' data concurrently
        import asyncio
        raw1, raw2 = await asyncio.gather(
            openf1_client.get_car_data(session_key, driver1, limit),
            openf1_client.get_car_data(session_key, driver2, limit),
        )
    except Exception as e:
        logger.warning(f"OpenF1 fetch failed: {e}")
        raise HTTPException(status_code=502, detail=f"OpenF1 API error: {str(e)}")

    # Feature engineer both datasets
    df1 = engineer_features(raw1) if raw1 else _empty_df()
    df2 = engineer_features(raw2) if raw2 else _empty_df()

    # Merge into unified time-series for frontend
    min_len = min(len(df1), len(df2), limit)
    result = []

    for i in range(min_len):
        row1 = df1.iloc[i]
        row2 = df2.iloc[i]
        result.append({
            "time_index": i,
            f"driver_{driver1}_speed": float(row1.get("speed", 0)),
            f"driver_{driver1}_rpm": float(row1.get("rpm", 0)),
            f"driver_{driver1}_gear": int(row1.get("n_gear", 0)),
            f"driver_{driver1}_accel": round(float(row1.get("acceleration", 0)), 2),
            f"driver_{driver1}_derating": bool(row1.get("is_derating", False)),
            f"driver_{driver2}_speed": float(row2.get("speed", 0)),
            f"driver_{driver2}_rpm": float(row2.get("rpm", 0)),
            f"driver_{driver2}_gear": int(row2.get("n_gear", 0)),
            f"driver_{driver2}_accel": round(float(row2.get("acceleration", 0)), 2),
            f"driver_{driver2}_derating": bool(row2.get("is_derating", False)),
        })

    return TelemetryComparisonResponse(
        session_key=session_key,
        driver1_id=driver1,
        driver2_id=driver2,
        data_points=len(result),
        data=result,
    )


# ─── Sessions Endpoint ────────────────────────────────────────

@router.get("/sessions")
async def get_sessions(year: int = Query(default=2024, ge=2018, le=2026)):
    """Fetch all sessions for a given year from OpenF1."""
    try:
        sessions = await openf1_client.get_sessions(year)
        return {"year": year, "sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenF1 API error: {str(e)}")


# ─── Drivers Endpoint ─────────────────────────────────────────

@router.get("/drivers")
async def get_drivers(session_key: str = Query(...)):
    """Fetch driver roster for a session from OpenF1."""
    try:
        drivers = await openf1_client.get_drivers(session_key)
        return {"session_key": session_key, "drivers": drivers}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenF1 API error: {str(e)}")


# ─── Helpers ──────────────────────────────────────────────────

def _empty_df():
    import pandas as pd
    return pd.DataFrame()
