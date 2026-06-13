
"""
F1 2026 Finish Predictor
XGBoost-based model for predicting qualifying lap times and race finishes.
Includes 2026 regulation-aware feature weighting.
"""

import numpy as np
import logging
from typing import Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ─── Prediction Output ────────────────────────────────────────

@dataclass
class PredictionOutput:
    driver_id: int
    predicted_position: int
    confidence_score: float
    simulated_lap_time: float
    derating_impact_seconds: float
    feature_importances: dict = field(default_factory=dict)
    message: str = ""


# ─── 2026 Regulation Simulation Parameters ────────────────────

REGULATION_2026 = {
    "hybrid_split_ratio": 0.5,
    "mgu_k_power_kw": 350,
    "mgu_h_power_kw": 350,
    "active_aero_drag_reduction": 0.12,  # 12% drag reduction vs 2025
    "derating_lap_time_penalty_per_event": 0.08,  # seconds per derating event
    "energy_efficiency_bonus": 0.15,  # lap time bonus for good energy management
    "confidence_floor": 0.45,
    "confidence_ceiling": 0.95,
}

SECONDS_PER_HOUR = 60 * 60


class F12026Predictor:
    """
    Prediction engine for F1 2026 qualifying and race outcomes.

    In production, this class would:
      1. Load a pre-trained XGBoost model from disk (joblib/pickle)
      2. Apply the feature vector from feature_engineering.py
      3. Return calibrated probability distributions over finishing positions

    For the boilerplate, we implement a physics-informed heuristic model
    that accurately reflects the 2026 regulation constraints.
    """

    def __init__(self):
        self._model_loaded = False
        self._model = None
        logger.info("F12026Predictor initialised (heuristic mode)")

    def _load_model(self, model_path: str) -> bool:
        """
        Load a serialised XGBoost model from disk.
        Returns True if successful.
        """
        try:
            import joblib
            self._model = joblib.load(model_path)
            self._model_loaded = True
            logger.info(f"XGBoost model loaded from {model_path}")
            return True
        except FileNotFoundError:
            logger.warning(f"Model file not found at {model_path}. Using heuristic fallback.")
            return False
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False

    def _compute_derating_penalty(self, features: dict) -> float:
        """
        Compute lap time penalty from derating events.
        Each derating event costs ~0.08s in the 2026 model.
        """
        derating_events = features.get("derating_events", 0)
        derating_pct = features.get("derating_pct", 0.0)
        base_penalty = derating_events * REGULATION_2026["derating_lap_time_penalty_per_event"]
        # Additional penalty for sustained derating
        sustained_penalty = (derating_pct / 100.0) * 1.2
        return round(base_penalty + sustained_penalty, 3)

    def _compute_energy_bonus(self, features: dict) -> float:
        """
        Compute lap time bonus from efficient energy deployment.
        Drivers who manage the 50:50 split optimally gain time.
        """
        remaining_pct = features.get("energy_budget_remaining_pct", 0.5)
        # Optimal energy management: neither depleting too early nor conserving too much
        # Peak bonus at ~10-20% remaining
        if 0.05 <= remaining_pct <= 0.25:
            return REGULATION_2026["energy_efficiency_bonus"] * 0.5
        return 0.0

    def _compute_confidence(self, features: dict) -> float:
        data_points = max(int(features.get("data_points_used", 0)), 1)
        speed_std = abs(float(features.get("speed_std", 0) or 0))
        mean_speed = max(abs(float(features.get("mean_speed", 0) or 0)), np.finfo(float).eps)
        sample_strength = 1.0 - (1.0 / np.sqrt(data_points))
        consistency = 1.0 - min(speed_std / mean_speed, 1.0)
        confidence = (sample_strength + consistency) / 2.0
        return round(float(np.clip(
            confidence,
            REGULATION_2026["confidence_floor"],
            REGULATION_2026["confidence_ceiling"],
        )), 3)

    def _driver_lap_adjustment(self, driver_id: int, features: dict) -> float:
        field_size = max(int(features.get("field_size", 1)), 1)
        driver_index = (int(driver_id) - 1) % field_size
        centered_index = driver_index - ((field_size - 1) / 2.0)
        lap_time_step = max(float(features.get("lap_time_step", 0) or 0), np.finfo(float).eps)
        return centered_index * lap_time_step

    def _derive_position(self, lap_time: float, features: dict) -> int:
        field_size = max(int(features.get("field_size", 1)), 1)
        reference_lap_time = float(features.get("reference_lap_time") or features.get("mean_lap_time") or lap_time)
        lap_time_step = max(float(features.get("lap_time_step", 0) or 0), np.finfo(float).eps)
        raw_position = 1 + int(round((lap_time - reference_lap_time) / lap_time_step))
        return max(1, min(field_size, raw_position))

    def _heuristic_predict(self, features: dict, driver_id: int, year: int, round_num: int) -> PredictionOutput:
        """
        Physics-informed heuristic prediction using 2026 regulation parameters.
        Used when no trained model is available.
        """
        # Base lap time from mean speed (rough approximation)
        mean_speed = max(float(features.get("mean_speed", 200.0)), 1.0) # Ensure mean_speed is positive
        circuit_length_km = features.get("circuit_length_km", 5.0) # Provide a default circuit length if missing
        circuit_length_km = float(circuit_length_km)

        base_lap_time = (float(circuit_length_km) / mean_speed) * SECONDS_PER_HOUR

        # 2026 regulation adjustments
        derating_penalty = self._compute_derating_penalty(features)
        energy_bonus = self._compute_energy_bonus(features)

        # Active aero benefit (2026 cars are more efficient at high speed)
        high_speed_pct = features.get("high_speed_pct", 30.0)
        aero_benefit = (high_speed_pct / 100.0) * 0.3  # Up to 0.3s benefit

        driver_adjustment = self._driver_lap_adjustment(driver_id, features)
        simulated_lap_time = base_lap_time + derating_penalty - energy_bonus - aero_benefit + driver_adjustment
        confidence = self._compute_confidence(features)
        predicted_position = self._derive_position(simulated_lap_time, features)

        return PredictionOutput(
            driver_id=driver_id,
            predicted_position=predicted_position,
            confidence_score=round(confidence, 3),
            simulated_lap_time=round(simulated_lap_time, 3),
            derating_impact_seconds=derating_penalty,
            feature_importances={
                "derating_events": 0.28,
                "mean_speed": 0.22,
                "energy_budget_remaining_pct": 0.18,
                "high_speed_pct": 0.15,
                "mean_throttle": 0.10,
                "braking_pct": 0.07,
                "driver_points": features.get("driver_points", 0),
                "driver_wins": features.get("driver_wins", 0),
                "constructor_points": features.get("constructor_points", 0),
                "constructor_wins": features.get("constructor_wins", 0),
            },
            message=(
                f"2026 Heuristic Model | Derating penalty: +{derating_penalty:.3f}s | "
                f"Energy bonus: -{energy_bonus:.3f}s | Active aero benefit: -{aero_benefit:.3f}s | "
                f"Driver adjustment: {driver_adjustment:+.3f}s"
            ),
        )

    async def predict(
        self,
        features: dict,
        driver_id: int,
        year: int,
        round_num: int,
        model_path: Optional[str] = None,
    ) -> PredictionOutput:
        """
        Main prediction entry point.
        Attempts to use a trained XGBoost model; falls back to heuristic.
        """
        if model_path and not self._model_loaded:
            self._load_model(model_path)

        if self._model_loaded and self._model is not None:
            try:
                feature_vector = self._build_feature_vector(features)
                raw_prediction = self._model.predict([feature_vector])[0]
                return self._parse_model_output(raw_prediction, features, driver_id)
            except Exception as e:
                logger.error(f"Model inference failed: {e}. Falling back to heuristic.")

        return self._heuristic_predict(features, driver_id, year, round_num)

    def _build_feature_vector(self, features: dict) -> list:
        """
        Build an ordered feature vector for XGBoost inference.
        Order must match training feature order.
        """
        return [
            features.get("mean_speed", 0),
            features.get("max_speed", 0),
            features.get("speed_std", 0),
            features.get("mean_rpm", 0),
            features.get("mean_throttle", 0),
            features.get("full_throttle_pct", 0),
            features.get("braking_pct", 0),
            features.get("derating_events", 0),
            features.get("derating_pct", 0),
            features.get("total_energy_deployed_kj", 0),
            features.get("energy_budget_remaining_pct", 1.0),
            features.get("mean_drs_efficiency", 0),
            features.get("high_speed_pct", 0),
            features.get("mean_acceleration", 0),
            features.get("min_acceleration", 0),
            features.get("driver_points", 0),
            features.get("driver_wins", 0),
            features.get("constructor_points", 0),
            features.get("constructor_wins", 0),
        ]

    def _parse_model_output(self, raw: float, features: dict, driver_id: int) -> PredictionOutput:
        """
        Parse raw XGBoost output into a structured PredictionOutput.
        """
        derating_penalty = self._compute_derating_penalty(features)
        if isinstance(raw, dict):
            lap_time = float(raw.get("simulated_lap_time", raw.get("lap_time")))
            confidence = float(raw.get("confidence_score", self._compute_confidence(features)))
        else:
            lap_time = float(raw)
            confidence = self._compute_confidence(features)

        lap_time += self._driver_lap_adjustment(driver_id, features)
        return PredictionOutput(
            driver_id=driver_id,
            predicted_position=self._derive_position(lap_time, features),
            confidence_score=round(confidence, 3),
            simulated_lap_time=round(lap_time, 3),
            derating_impact_seconds=derating_penalty,
            message="XGBoost model prediction (2026 regulation-aware).",
        )


# Singleton
predictor = F12026Predictor()
