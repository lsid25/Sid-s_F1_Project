"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum


class SimulationType(str, Enum):
    """Simulation type options."""
    REGULATIONS_2026 = "2026_regulations"
    HYBRID_ANALYSIS = "hybrid_analysis"
    DERATING_SIMULATION = "derating_simulation"


class PredictionRequest(BaseModel):
    """Request model for race predictions."""
    session_key: str = Field(..., description="OpenF1 session key")
    driver_id: int = Field(..., description="F1 driver number")
    simulation_type: str = Field(
        default="2026_regulations",
        description="Type of simulation to run"
    )


class DriverMetrics(BaseModel):
    """Driver performance metrics."""
    qualifying_position: int = Field(..., description="Predicted qualifying position")
    race_finish_position: int = Field(..., description="Predicted race finish position")
    safety_car_probability: float = Field(..., description="Probability of safety car (0-1)")
    hybrid_efficiency_score: float = Field(..., description="Hybrid power management score (0-100)")
    derating_impact_percent: float = Field(..., description="Estimated derating impact on race (%)")


class PredictionResponse(BaseModel):
    """Response model for race predictions."""
    driver_id: int = Field(..., description="F1 driver number")
    session_key: str = Field(..., description="OpenF1 session key")
    predicted_finish: int = Field(..., description="Predicted finishing position")
    confidence_score: float = Field(..., description="Prediction confidence (0-1)")
    metrics: DriverMetrics = Field(..., description="Detailed driver metrics")
    simulation_type: str = Field(..., description="Type of simulation used")
    timestamp: str = Field(..., description="Prediction timestamp")


class TelemetryPoint(BaseModel):
    """Single telemetry data point."""
    lap: int = Field(..., description="Lap number")
    time_ms: int = Field(..., description="Time in milliseconds")
    speed_kmh: float = Field(..., description="Speed in km/h")
    throttle_percent: float = Field(..., description="Throttle percentage (0-100)")
    brake_percent: float = Field(..., description="Brake percentage (0-100)")
    power_kw: float = Field(..., description="Current power output (kW)")
    mgu_k_battery_percent: float = Field(..., description="MGU-K battery state (0-100)")
    is_derating: bool = Field(..., description="Whether car is in derating zone")


class TelemetryResponse(BaseModel):
    """Response model for telemetry data."""
    driver_id: int = Field(..., description="F1 driver number")
    session_key: Optional[str] = Field(None, description="OpenF1 session key")
    telemetry: list[TelemetryPoint] = Field(..., description="List of telemetry points")
    timestamp: str = Field(..., description="Data timestamp")
