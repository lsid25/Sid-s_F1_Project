"""
Predictor API Route
POST /api/predict/
Accepts session_key + driver_id, runs feature engineering,
and returns a 2026-regulation-aware prediction.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging
import asyncio

from app.services.openf1_client import openf1_client
from app.ml.feature_engineering import engineer_features, extract_lap_features
from app.ml.predictor import predictor

logger = logging.getLogger(__name__)
router = APIRouter()

CIRCUIT_LENGTHS_KM = {
    "Albert Park": 5.278,
    "Bahrain International Circuit": 5.412,
    "Jeddah Corniche Circuit": 6.174,
    "Suzuka Circuit": 5.807,
    "Shanghai International Circuit": 5.451,
    "Miami International Autodrome": 5.412,
    "Autodromo Enzo e Dino Ferrari": 4.909,
    "Circuit de Monaco": 3.337,
    "Circuit de Barcelona-Catalunya": 4.657,
    "Circuit Gilles Villeneuve": 4.361,
    "Red Bull Ring": 4.318,
    "Silverstone Circuit": 5.891,
    "Circuit de Spa-Francorchamps": 7.004,
    "Hungaroring": 4.381,
    "Circuit Zandvoort": 4.259,
    "Autodromo Nazionale Monza": 5.793,
    "Baku City Circuit": 6.003,
    "Marina Bay Street Circuit": 4.940,
    "Circuit of the Americas": 5.513,
    "Autodromo Hermanos Rodriguez": 4.304,
    "Autodromo Jose Carlos Pace": 4.309,
    "Las Vegas Strip Circuit": 6.201,
    "Lusail International Circuit": 5.419,
    "Yas Marina Circuit": 5.281,
}


# ─── Request / Response Models ────────────────────────────────

class PredictionRequest(BaseModel):
    session_key: str = Field(..., description="OpenF1 session key (e.g. '9159' or 'latest')")
    year: int = Field(..., description="Year of the session (e.g., 2024)")
    round_num: int = Field(..., description="Round number of the session (e.g., 1 for Bahrain)")
    driver_id: int = Field(..., ge=1, le=99, description="F1 driver number (1-99)")
    circuit: Optional[str] = Field(default=None, description="Circuit name for lap-time normalization")
    session_type: Optional[str] = Field(default=None, description="Session type for simulation context")
    field_size: int = Field(default=1, ge=1, description="Number of drivers being compared")
    simulation_type: str = Field(
        default="2026_regulations",
        description="Simulation model type: '2026_regulations' or 'baseline'"
    )
    model_path: Optional[str] = Field(
        default=None,
        description="Optional path to a trained XGBoost model (.pkl/.joblib)"
    )


class SimulationRequest(BaseModel):
    year: int = Field(..., description="Year of the session (e.g., 2024)")
    round_num: int = Field(..., description="Round number of the session (e.g., 1 for Bahrain)")
    driver_1: int = Field(..., ge=1, le=99, description="First F1 driver number")
    driver_2: int = Field(..., ge=1, le=99, description="Second F1 driver number")
    circuit: str = Field(..., description="Circuit name")
    session_type: str = Field(..., description="Session type")
    session_key: str = Field(..., description="OpenF1 session key")
    simulation_type: str = Field(
        default="2026_regulations",
        description="Simulation model type: '2026_regulations' or 'baseline'"
    )
    model_path: Optional[str] = Field(
        default=None,
        description="Optional path to a trained XGBoost model (.pkl/.joblib)"
    )


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class PredictionResponse(BaseModel):
    driver_id: int
    predicted_position: int
    confidence_score: float
    simulated_lap_time: float
    derating_impact_seconds: float
    feature_importances: list[FeatureImportance]
    message: str
    session_key: str
    data_points_used: int


class SimulationResponse(BaseModel):
    driver_1: PredictionResponse
    driver_2: PredictionResponse
    circuit: str
    session_type: str


# ─── Prediction Endpoint ──────────────────────────────────────

@router.post("/", response_model=PredictionResponse)
async def run_prediction(request: PredictionRequest):
    """
    Full prediction pipeline:
    1. Fetch car telemetry from OpenF1 API
    2. Run feature engineering (acceleration, derating detection, energy model)
    3. Run 2026-regulation-aware predictor (XGBoost or heuristic fallback)
    4. Return structured prediction JSON
    """
    return await _run_prediction(request)


@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    prediction_1, prediction_2 = await asyncio.gather(
        _run_prediction(PredictionRequest(
            session_key=request.session_key,
            driver_id=request.driver_1,
            year=request.year,
            round_num=request.round_num,
            circuit=request.circuit,
            session_type=request.session_type,
            field_size=2,
            simulation_type=request.simulation_type,
            model_path=request.model_path,
        )),
        _run_prediction(PredictionRequest(
            session_key=request.session_key,
            driver_id=request.driver_2,
            year=request.year,
            round_num=request.round_num,
            circuit=request.circuit,
            session_type=request.session_type,
            field_size=2,
            simulation_type=request.simulation_type,
            model_path=request.model_path,
        )),
    )

    ordered = sorted([prediction_1, prediction_2], key=lambda item: item.simulated_lap_time)
    for index, item in enumerate(ordered, start=1):
        item.predicted_position = index

    return SimulationResponse(
        driver_1=prediction_1,
        driver_2=prediction_2,
        circuit=request.circuit,
        session_type=request.session_type,
    )


async def _run_prediction(request: PredictionRequest) -> PredictionResponse:
    try:
        logger.info(f"Running prediction for driver {request.driver_id}, session {request.session_key}")
        if not request.circuit:
            raise HTTPException(status_code=422, detail="circuit is required for prediction.")

        # ── Step 1: Fetch Telemetry ────────────────────────────
        try:
            raw_car_data = await openf1_client.get_car_data(
                session_key=request.session_key,
                driver_number=request.driver_id,
                limit=500,
            )
            raw_lap_data = await openf1_client.get_laps(
                session_key=request.session_key,
                driver_number=request.driver_id,
            )
        except Exception as e:
            logger.warning(f"OpenF1 API unavailable: {e}")
            raise HTTPException(status_code=502, detail=f"OpenF1 API unavailable: {str(e)}")

        data_points = len(raw_car_data)

        # ── Step 2: Feature Engineering ───────────────────────
        enriched_df = await engineer_features(raw_car_data, request.year, request.round_num)
        features = extract_lap_features(enriched_df, raw_lap_data)

        if not features:
            raise HTTPException(
                status_code=422,
                detail="Feature engineering produced no output. Check session_key and driver_id."
            )

        _add_request_features(features, request, data_points)

        # ── Step 3: Prediction ────────────────────────────────
        result = await predictor.predict(
            features=features,
            driver_id=request.driver_id,
            year=request.year,
            round_num=request.round_num,
            model_path=request.model_path,
        )

        # ── Step 4: Format Response ───────────────────────────
        feature_importances = [
            FeatureImportance(feature=k, importance=v)
            for k, v in result.feature_importances.items()
        ]

        return PredictionResponse(
            driver_id=result.driver_id,
            predicted_position=result.predicted_position,
            confidence_score=result.confidence_score,
            simulated_lap_time=result.simulated_lap_time,
            derating_impact_seconds=result.derating_impact_seconds,
            feature_importances=feature_importances,
            message=result.message,
            session_key=request.session_key,
            data_points_used=data_points,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Prediction pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


def _add_request_features(features: dict, request: PredictionRequest, data_points: int) -> None:
    circuit_length = CIRCUIT_LENGTHS_KM.get(request.circuit or "")
    if circuit_length is None:
        raise HTTPException(status_code=422, detail=f"Unknown circuit: {request.circuit}")

    features["circuit"] = request.circuit
    features["session_type"] = request.session_type
    features["circuit_length_km"] = circuit_length
    features["field_size"] = request.field_size
    features["data_points_used"] = data_points

    mean_speed = max(float(features.get("mean_speed", 0) or 0), 1.0)
    reference_lap_time = features.get("mean_lap_time") or (circuit_length / mean_speed) * 3600.0
    speed_std = abs(float(features.get("speed_std", 0) or 0))
    speed_variation = speed_std / mean_speed
    features["reference_lap_time"] = reference_lap_time
    features["lap_time_step"] = features.get("lap_time_std") or max(reference_lap_time * speed_variation, 0.001)
