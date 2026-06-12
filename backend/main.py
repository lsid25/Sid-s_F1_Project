"""
F1 2026 Telemetry & Finish Predictor - FastAPI Backend
Implements 2026 technical regulations with hybrid power management and active aerodynamics.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from app.ml.predictor import PredictionEngine
from app.models.schemas import PredictionRequest, PredictionResponse
from app.utils.telemetry import TelemetryGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="F1 2026 Predictor API",
    description="Real-time telemetry and race finish prediction for 2026 F1 season",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize prediction engine and telemetry generator
prediction_engine = PredictionEngine()
telemetry_gen = TelemetryGenerator()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "F1 2026 Predictor API"
    }


@app.post("/api/predict")
async def predict_race_finish(request: PredictionRequest) -> PredictionResponse:
    """
    Predict race finish position and metrics for a driver in a specific session.
    
    Args:
        request: PredictionRequest containing session_key, driver_id, and simulation_type
        
    Returns:
        PredictionResponse with predicted finish position, confidence, and metrics
    """
    try:
        logger.info(f"Prediction request: driver_id={request.driver_id}, session_key={request.session_key}")
        
        # Validate driver_id is in 2026 grid
        valid_drivers = [1, 81, 16, 44, 3, 6, 63, 12, 14, 18, 10, 43, 31, 87, 30, 41, 23, 55, 27, 5, 11, 77]
        if request.driver_id not in valid_drivers:
            raise HTTPException(status_code=400, detail=f"Invalid driver_id: {request.driver_id}")
        
        # Generate prediction
        prediction = prediction_engine.predict(
            driver_id=request.driver_id,
            session_key=request.session_key,
            simulation_type=request.simulation_type
        )
        
        logger.info(f"Prediction generated: {prediction.predicted_finish}")
        return prediction
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/telemetry/{driver_id}")
async def get_telemetry(driver_id: int, session_key: Optional[str] = None):
    """
    Get real-time telemetry data for a driver.
    
    Args:
        driver_id: F1 driver number
        session_key: Optional session key for specific session
        
    Returns:
        Telemetry data points with speed, throttle, brake, and power metrics
    """
    try:
        logger.info(f"Telemetry request: driver_id={driver_id}, session_key={session_key}")
        
        telemetry = telemetry_gen.generate_mock_telemetry(driver_id)
        
        return {
            "driver_id": driver_id,
            "session_key": session_key,
            "telemetry": telemetry,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Telemetry error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/regulations/2026")
async def get_2026_regulations():
    """Get 2026 F1 technical regulations summary."""
    return {
        "season": 2026,
        "regulations": {
            "hybrid_power": {
                "description": "50:50 power split between ICE and MGU-K",
                "ice_power_kw": 350,
                "mgu_k_power_kw": 350,
                "total_power_kw": 700
            },
            "active_aerodynamics": {
                "description": "Automated active aero system replaces manual DRS",
                "features": [
                    "Continuous drag/downforce adjustment",
                    "No manual DRS flap",
                    "Automated based on speed and circuit conditions"
                ]
            },
            "derating_zones": {
                "description": "Power reduction when MGU-K battery depleted",
                "power_reduction_percent": 15,
                "visible_on_telemetry": True
            },
            "tire_regulations": {
                "compounds": ["Soft", "Medium", "Hard"],
                "mandatory_pit_stops": 1,
                "description": "Pirelli 2026 compounds with enhanced durability"
            }
        }
    }


@app.get("/api/grid/2026")
async def get_2026_grid():
    """Get 2026 F1 grid configuration."""
    return {
        "season": 2026,
        "grid": [
            {"number": 1, "driver": "Lando Norris", "team": "McLaren", "acronym": "NOR"},
            {"number": 81, "driver": "Oscar Piastri", "team": "McLaren", "acronym": "PIA"},
            {"number": 16, "driver": "Charles Leclerc", "team": "Ferrari", "acronym": "LEC"},
            {"number": 44, "driver": "Lewis Hamilton", "team": "Ferrari", "acronym": "HAM"},
            {"number": 3, "driver": "Max Verstappen", "team": "Red Bull Racing", "acronym": "VER"},
            {"number": 6, "driver": "Isack Hadjar", "team": "Red Bull Racing", "acronym": "HAD"},
            {"number": 63, "driver": "George Russell", "team": "Mercedes", "acronym": "RUS"},
            {"number": 12, "driver": "Kimi Antonelli", "team": "Mercedes", "acronym": "ANT"},
            {"number": 14, "driver": "Fernando Alonso", "team": "Aston Martin", "acronym": "ALO"},
            {"number": 18, "driver": "Lance Stroll", "team": "Aston Martin", "acronym": "STR"},
            {"number": 10, "driver": "Pierre Gasly", "team": "Alpine", "acronym": "GAS"},
            {"number": 43, "driver": "Franco Colapinto", "team": "Alpine", "acronym": "COL"},
            {"number": 31, "driver": "Esteban Ocon", "team": "Haas", "acronym": "OCO"},
            {"number": 87, "driver": "Oliver Bearman", "team": "Haas", "acronym": "BEA"},
            {"number": 30, "driver": "Liam Lawson", "team": "Racing Bulls (VCARB)", "acronym": "LAW"},
            {"number": 41, "driver": "Arvid Lindblad", "team": "Racing Bulls (VCARB)", "acronym": "LIN"},
            {"number": 23, "driver": "Alex Albon", "team": "Williams", "acronym": "ALB"},
            {"number": 55, "driver": "Carlos Sainz", "team": "Williams", "acronym": "SAI"},
            {"number": 27, "driver": "Nico Hülkenberg", "team": "Audi", "acronym": "HUL"},
            {"number": 5, "driver": "Gabriel Bortoleto", "team": "Audi", "acronym": "BOR"},
            {"number": 11, "driver": "Sergio Pérez", "team": "Cadillac", "acronym": "PER"},
            {"number": 77, "driver": "Valtteri Bottas", "team": "Cadillac", "acronym": "BOT"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
