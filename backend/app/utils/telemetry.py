"""Telemetry data generation and utilities."""

import random
from typing import List, Dict, Any


class TelemetryGenerator:
    """Generate realistic mock telemetry data for 2026 F1 cars."""
    
    def __init__(self):
        """Initialize telemetry generator."""
        self.lap_count = 50  # Typical race lap count
    
    def generate_mock_telemetry(self, driver_id: int, lap_count: int = None) -> List[Dict[str, Any]]:
        """
        Generate mock telemetry data for a driver.
        
        Simulates 2026 regulations:
        - Hybrid power (ICE + MGU-K)
        - Active aerodynamics
        - Derating zones
        
        Args:
            driver_id: F1 driver number
            lap_count: Number of laps (default: 50)
            
        Returns:
            List of telemetry data points
        """
        if lap_count is None:
            lap_count = self.lap_count
        
        telemetry = []
        
        for lap in range(1, lap_count + 1):
            # Generate points for each lap (simulating straights and corners)
            for point_idx in range(20):
                time_ms = (lap - 1) * 90000 + point_idx * 4500  # ~90s per lap
                
                # Simulate speed profile (higher on straights, lower in corners)
                if point_idx % 5 == 0:  # Straight sections
                    speed = random.uniform(300, 330)
                    throttle = random.uniform(85, 100)
                    brake = random.uniform(0, 5)
                else:  # Corner sections
                    speed = random.uniform(150, 250)
                    throttle = random.uniform(20, 60)
                    brake = random.uniform(40, 80)
                
                # Hybrid power distribution (50:50 ICE + MGU-K)
                ice_power = random.uniform(300, 350)
                mgu_k_power = random.uniform(200, 350)
                total_power = ice_power + mgu_k_power
                
                # MGU-K battery state (depletes on straights, recovers in corners)
                if point_idx % 5 == 0:  # Straight - depletes
                    battery_state = max(0, 100 - (point_idx * 5))
                else:  # Corner - recovers
                    battery_state = min(100, 50 + (point_idx * 3))
                
                # Derating occurs when battery is very low
                is_derating = battery_state < 20 and point_idx % 5 == 0
                
                telemetry.append({
                    "lap": lap,
                    "time_ms": time_ms,
                    "speed_kmh": round(speed, 1),
                    "throttle_percent": round(throttle, 1),
                    "brake_percent": round(brake, 1),
                    "power_kw": round(total_power, 1),
                    "mgu_k_battery_percent": round(battery_state, 1),
                    "is_derating": is_derating
                })
        
        return telemetry
