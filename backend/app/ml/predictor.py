"""
Prediction engine implementing 2026 F1 technical regulations.
Focuses on hybrid power management, active aerodynamics, and derating zones.
"""

import random
from datetime import datetime
from typing import Dict, Any
from app.models.schemas import PredictionResponse, DriverMetrics


class PredictionEngine:
    """
    Heuristic-based prediction engine for 2026 F1 season.
    Incorporates 2026 technical regulations:
    - 50:50 hybrid power split (ICE + MGU-K)
    - Active aerodynamics (no manual DRS)
    - Derating zones when MGU-K battery depleted
    """
    
    # 2026 Grid with base performance ratings
    DRIVER_GRID = {
        1: {"name": "Lando Norris", "team": "McLaren", "base_rating": 92},
        33: {"name": "Max Verstappen", "team": "Red Bull Racing", "base_rating": 95},
        11: {"name": "Sergio Perez", "team": "Cadillac", "base_rating": 85},
        16: {"name": "Charles Leclerc", "team": "Ferrari", "base_rating": 90},
        55: {"name": "Carlos Sainz", "team": "Ferrari", "base_rating": 88},
        44: {"name": "Lewis Hamilton", "team": "Ferrari", "base_rating": 91},
        63: {"name": "George Russell", "team": "Mercedes", "base_rating": 87},
        81: {"name": "Oscar Piastri", "team": "McLaren", "base_rating": 89},
        14: {"name": "Fernando Alonso", "team": "Aston Martin", "base_rating": 86},
        18: {"name": "Lance Stroll", "team": "Aston Martin", "base_rating": 80},
    }
    
    # Team performance modifiers (2026 season)
    TEAM_MODIFIERS = {
        "McLaren": 1.05,
        "Red Bull Racing": 1.08,
        "Ferrari": 1.04,
        "Mercedes": 1.03,
        "Cadillac": 0.95,
        "Aston Martin": 0.98,
    }
    
    def __init__(self):
        """Initialize prediction engine."""
        self.random_seed = None
    
    def predict(
        self,
        driver_id: int,
        session_key: str,
        simulation_type: str = "2026_regulations"
    ) -> PredictionResponse:
        """
        Generate a race finish prediction for a driver.
        
        Args:
            driver_id: F1 driver number
            session_key: OpenF1 session key
            simulation_type: Type of simulation
            
        Returns:
            PredictionResponse with finish position and metrics
        """
        if driver_id not in self.DRIVER_GRID:
            raise ValueError(f"Unknown driver: {driver_id}")
        
        driver_info = self.DRIVER_GRID[driver_id]
        team = driver_info["team"]
        base_rating = driver_info["base_rating"]
        
        # Calculate effective rating with team modifier
        team_modifier = self.TEAM_MODIFIERS.get(team, 1.0)
        effective_rating = base_rating * team_modifier
        
        # Predict qualifying position (1-10)
        quali_pos = self._predict_quali_position(effective_rating)
        
        # Predict race finish (1-10)
        race_finish = self._predict_race_finish(quali_pos, effective_rating)
        
        # Calculate hybrid efficiency score (0-100)
        hybrid_score = self._calculate_hybrid_efficiency(effective_rating)
        
        # Estimate derating impact (0-30%)
        derating_impact = self._estimate_derating_impact(effective_rating)
        
        # Safety car probability (0-1)
        safety_car_prob = self._estimate_safety_car_probability()
        
        # Confidence score based on rating consistency
        confidence = min(0.95, 0.5 + (effective_rating / 100) * 0.45)
        
        metrics = DriverMetrics(
            qualifying_position=quali_pos,
            race_finish_position=race_finish,
            safety_car_probability=safety_car_prob,
            hybrid_efficiency_score=hybrid_score,
            derating_impact_percent=derating_impact
        )
        
        return PredictionResponse(
            driver_id=driver_id,
            session_key=session_key,
            predicted_finish=race_finish,
            confidence_score=confidence,
            metrics=metrics,
            simulation_type=simulation_type,
            timestamp=datetime.utcnow().isoformat()
        )
    
    def _predict_quali_position(self, effective_rating: float) -> int:
        """
        Predict qualifying position based on driver rating.
        
        Args:
            effective_rating: Driver's effective performance rating
            
        Returns:
            Predicted qualifying position (1-10)
        """
        # Map rating to position with some randomness
        base_pos = max(1, min(10, int(11 - (effective_rating / 10))))
        
        # Add small random variance
        variance = random.randint(-1, 1)
        final_pos = max(1, min(10, base_pos + variance))
        
        return final_pos
    
    def _predict_race_finish(self, quali_pos: int, effective_rating: float) -> int:
        """
        Predict race finish position considering qualifying and rating.
        
        Args:
            quali_pos: Qualifying position
            effective_rating: Driver's effective performance rating
            
        Returns:
            Predicted race finish position (1-10)
        """
        # Base finish on qualifying with potential for position changes
        base_finish = quali_pos
        
        # Higher rated drivers more likely to gain positions
        if effective_rating > 90:
            position_change = random.randint(-1, 1)  # Can gain up to 1 position
        elif effective_rating > 85:
            position_change = random.randint(-1, 0)
        else:
            position_change = random.randint(-2, 0)
        
        final_finish = max(1, min(10, base_finish + position_change))
        
        return final_finish
    
    def _calculate_hybrid_efficiency(self, effective_rating: float) -> float:
        """
        Calculate hybrid power management efficiency score.
        
        The 2026 regulations mandate 50:50 power split between ICE and MGU-K.
        Better drivers manage this more efficiently.
        
        Args:
            effective_rating: Driver's effective performance rating
            
        Returns:
            Hybrid efficiency score (0-100)
        """
        # Base score on driver rating
        base_score = (effective_rating / 100) * 100
        
        # Add variance
        variance = random.uniform(-5, 5)
        
        return max(0, min(100, base_score + variance))
    
    def _estimate_derating_impact(self, effective_rating: float) -> float:
        """
        Estimate the impact of derating zones on race performance.
        
        Derating occurs when MGU-K battery is depleted mid-straight,
        causing ~15% power reduction.
        
        Args:
            effective_rating: Driver's effective performance rating
            
        Returns:
            Estimated derating impact as percentage (0-30%)
        """
        # Better drivers manage battery more efficiently, less derating impact
        base_impact = 20 - (effective_rating - 80) * 0.5
        
        # Add variance
        variance = random.uniform(-3, 3)
        
        return max(0, min(30, base_impact + variance))
    
    def _estimate_safety_car_probability(self) -> float:
        """
        Estimate probability of safety car during race.
        
        Returns:
            Safety car probability (0-1)
        """
        # Typical F1 race has ~30% chance of safety car
        base_prob = 0.30
        
        # Add variance
        variance = random.uniform(-0.1, 0.1)
        
        return max(0, min(1, base_prob + variance))
