"""
Tests for the feature engineering pipeline.
Run with: pytest tests/ -v
"""

import pytest
import pandas as pd
from app.ml.feature_engineering import (
    compute_acceleration,
    detect_derating_zones,
    compute_energy_deployment,
    engineer_features,
    extract_lap_features,
)


# ─── Fixtures ─────────────────────────────────────────────────

@pytest.fixture
def sample_car_data():
    """Realistic sample car data for a short high-speed straight."""
    return [
        {"speed": 250, "rpm": 13000, "throttle": 100, "brake": 0, "n_gear": 7, "drs": 12, "driver_number": 1, "session_key": 9999, "meeting_key": 9999, "date": "2024-01-01T13:00:00.000000+00:00"},
        {"speed": 270, "rpm": 13500, "throttle": 100, "brake": 0, "n_gear": 8, "drs": 12, "driver_number": 1, "session_key": 9999, "meeting_key": 9999, "date": "2024-01-01T13:00:00.270000+00:00"},
        {"speed": 295, "rpm": 14000, "throttle": 100, "brake": 0, "n_gear": 8, "drs": 12, "driver_number": 1, "session_key": 9999, "meeting_key": 9999, "date": "2024-01-01T13:00:00.540000+00:00"},
        # Derating event: high speed (>290), full throttle, speed drops
        {"speed": 310, "rpm": 13800, "throttle": 100, "brake": 0, "n_gear": 8, "drs": 12, "driver_number": 1, "session_key": 9999, "meeting_key": 9999, "date": "2024-01-01T13:00:00.810000+00:00"},
        {"speed": 305, "rpm": 13600, "throttle": 100, "brake": 0, "n_gear": 8, "drs": 12, "driver_number": 1, "session_key": 9999, "meeting_key": 9999, "date": "2024-01-01T13:00:01.080000+00:00"},
        {"speed": 150, "rpm": 10000, "throttle": 20, "brake": 100, "n_gear": 4, "drs": 0, "driver_number": 1, "session_key": 9999, "meeting_key": 9999, "date": "2024-01-01T13:00:01.350000+00:00"},
    ]


# ─── Tests ────────────────────────────────────────────────────

class TestComputeAcceleration:
    def test_returns_series(self, sample_car_data):
        df = pd.DataFrame(sample_car_data)
        accel = compute_acceleration(df["speed"])
        assert isinstance(accel, pd.Series)
        assert len(accel) == len(df)

    def test_first_value_is_zero(self, sample_car_data):
        df = pd.DataFrame(sample_car_data)
        accel = compute_acceleration(df["speed"])
        assert accel.iloc[0] == 0.0

    def test_positive_on_acceleration(self, sample_car_data):
        df = pd.DataFrame(sample_car_data)
        accel = compute_acceleration(df["speed"])
        # Speed goes 250 -> 270 -> 295, so first diffs are positive
        assert accel.iloc[1] > 0
        assert accel.iloc[2] > 0

    def test_negative_on_braking(self, sample_car_data):
        df = pd.DataFrame(sample_car_data)
        accel = compute_acceleration(df["speed"])
        # Last point: 285 -> 150 = large negative
        assert accel.iloc[-1] < 0


class TestDeratingDetection:
    def test_detects_derating_zone(self, sample_car_data):
        df = pd.DataFrame(sample_car_data)
        df["acceleration"] = compute_acceleration(df["speed"])
        derating = detect_derating_zones(df)
        # Points 3 and 4 (index 3, 4): speed > 290, throttle = 100, accel < 0
        assert derating.iloc[3] == True or derating.iloc[4] == True

    def test_no_derating_at_low_speed(self, sample_car_data):
        df = pd.DataFrame(sample_car_data)
        df["acceleration"] = compute_acceleration(df["speed"])
        derating = detect_derating_zones(df)
        # Last point: speed = 150, should NOT be derating
        assert derating.iloc[-1] == False


class TestEngineerFeatures:
    def test_returns_dataframe(self, sample_car_data):
        df = engineer_features(sample_car_data)
        assert isinstance(df, pd.DataFrame)
        assert len(df) == len(sample_car_data)

    def test_has_required_columns(self, sample_car_data):
        df = engineer_features(sample_car_data)
        required = [
            "acceleration", "jerk", "is_derating",
            "cumulative_energy_kj", "speed_normalised",
            "high_speed_flag", "braking_flag",
        ]
        for col in required:
            assert col in df.columns, f"Missing column: {col}"

    def test_speed_normalised_range(self, sample_car_data):
        df = engineer_features(sample_car_data)
        assert df["speed_normalised"].between(0, 1).all()

    def test_empty_input(self):
        df = engineer_features([])
        assert df.empty


class TestExtractLapFeatures:
    def test_returns_dict(self, sample_car_data):
        df = engineer_features(sample_car_data)
        features = extract_lap_features(df)
        assert isinstance(features, dict)

    def test_has_key_features(self, sample_car_data):
        df = engineer_features(sample_car_data)
        features = extract_lap_features(df)
        assert "mean_speed" in features
        assert "derating_events" in features
        assert "total_energy_deployed_kj" in features

    def test_derating_count_non_negative(self, sample_car_data):
        df = engineer_features(sample_car_data)
        features = extract_lap_features(df)
        assert features["derating_events"] >= 0
