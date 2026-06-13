
"""
Feature Engineering Pipeline
Transforms raw OpenF1 telemetry into ML-ready features,
with specific handling for 2026 regulation constraints.
"""

import numpy as np
import pandas as pd
from typing import Optional
import logging
from datetime import datetime
from app.services.ergast_client import ergast_client

logger = logging.getLogger(__name__)

# ─── 2026 Regulation Constants ────────────────────────────────
HYBRID_SPLIT_RATIO = 0.5          # 50:50 ICE/MGU-K power split
MGU_K_POWER_KW = 350              # MGU-K maximum power output (kW)
DERATING_SPEED_THRESHOLD = 290    # km/h above which derating is monitored
ENERGY_PER_LAP_KJ = 4000          # Estimated energy deployment per lap (kJ)
SAMPLE_RATE_HZ = 3.7              # OpenF1 car_data sample rate
DT_SECONDS = 1.0 / SAMPLE_RATE_HZ


def compute_acceleration(speed_series: pd.Series) -> pd.Series:
    """
    Compute acceleration as dv/dt using finite differences.
    Units: km/h per sample (divide by DT_SECONDS for km/h/s).
    """
    return speed_series.diff().fillna(0.0)


def compute_jerk(accel_series: pd.Series) -> pd.Series:
    """
    Compute jerk (rate of change of acceleration) as da/dt.
    Useful for detecting abrupt derating events.
    """
    return accel_series.diff().fillna(0.0)


def detect_derating_zones(df: pd.DataFrame) -> pd.Series:
    """
    Identify derating zones per the 2026 regulation model.

    Derating occurs when:
      - Speed > DERATING_SPEED_THRESHOLD (high-speed straight)
      - Throttle >= 95% (driver demanding full power)
      - Acceleration is negative (car is slowing despite full throttle)

    This is the signature of MGU-K battery depletion on a straight.
    """
    if not all(col in df.columns for col in ["speed", "throttle", "acceleration"]):
        return pd.Series(False, index=df.index)

    return (
        (df["speed"] > DERATING_SPEED_THRESHOLD)
        & (df["throttle"] >= 95)
        & (df["acceleration"] < -1.5)
    )


def compute_energy_deployment(df: pd.DataFrame) -> pd.Series:
    """
    Estimate cumulative energy deployment from throttle and speed.
    Simplified model: E ≈ throttle_fraction * MGU_K_POWER_KW * dt
    Returns cumulative kJ deployed.
    """
    if "throttle" not in df.columns:
        return pd.Series(0.0, index=df.index)

    power_kw = (df["throttle"] / 100.0) * MGU_K_POWER_KW * HYBRID_SPLIT_RATIO
    energy_kj = power_kw * DT_SECONDS  # kW * s = kJ
    return energy_kj.cumsum()


def compute_drs_efficiency(df: pd.DataFrame) -> pd.Series:
    """
    Compute DRS efficiency score.
    DRS active (values 10, 12, 14) at high speed = positive.
    In 2026, active aero replaces DRS, but we model it similarly.
    """
    if "drs" not in df.columns or "speed" not in df.columns:
        return pd.Series(0.0, index=df.index)

    drs_active = df["drs"].isin([10, 12, 14]).astype(float)
    return drs_active * (df["speed"] / 350.0)  # Normalised by max speed


async def engineer_features(raw_car_data: list[dict], year: int, round_num: int) -> pd.DataFrame:
    """
    Full feature engineering pipeline for a single driver's car data.

    Input: Raw JSON list from OpenF1 /car_data endpoint
    Output: Feature-enriched DataFrame ready for ML inference

    Features produced:
      - speed, rpm, throttle, brake, n_gear, drs (raw)
      - acceleration (dv/dt)
      - jerk (da/dt)
      - is_derating (bool flag)
      - cumulative_energy_kj
      - drs_efficiency
      - speed_normalised
      - rpm_normalised
      - high_speed_flag (speed > 280 km/h)
      - braking_flag
      - driver_points, driver_wins, constructor_points, constructor_wins (from Ergast API)
    """
    if not raw_car_data:
        logger.warning("Empty car data received for feature engineering.")
        return pd.DataFrame()

    df = pd.DataFrame(raw_car_data)

    # Ensure required columns exist and add placeholders for merging
    required_openf1_cols = ["speed", "rpm", "throttle", "brake", "n_gear", "drs", "driver_number", "constructor_id"]
    for col in required_openf1_cols:
        if col not in df.columns:
            # Provide sensible defaults or infer from context if possible
            if col == "driver_number":
                df[col] = raw_car_data[0].get("driver_number", 0) if raw_car_data else 0 # Assuming consistent driver_number
            elif col == "constructor_id":
                df[col] = "unknown" # Placeholder, ideally derived from driver_number or session data
            else:
                df[col] = 0

    # Fetch historical data for driver/team statistics from Ergast
    driver_standings_data = await ergast_client.get_driver_standings(year, round_num)
    constructor_standings_data = await ergast_client.get_constructor_standings(year, round_num)

    driver_df = pd.DataFrame(driver_standings_data)
    constructor_df = pd.DataFrame(constructor_standings_data)

    # Add driver and constructor statistics as features
    if not driver_df.empty:
        # Ergast driverId is string, OpenF1 driver_number is int. Convert OpenF1 driver_number to string for merge.
        driver_df["driverId_ergast"] = driver_df["Driver"].apply(lambda x: x["driverId"])
        df["driver_number_str"] = df["driver_number"].astype(str)
        df = df.merge(driver_df[["driverId_ergast", "points", "wins"]], left_on="driver_number_str", right_on="driverId_ergast", how="left", suffixes=('_driver', None))
        df["driver_points"] = df["points"].fillna(0)
        df["driver_wins"] = df["wins"].fillna(0)
        df.drop(columns=["driverId_ergast", "points", "wins", "driver_number_str"], inplace=True)

    if not constructor_df.empty:
        # Ergast constructorId is string, OpenF1 constructor_id is string. Direct merge.
        constructor_df["constructorId_ergast"] = constructor_df["Constructor"].apply(lambda x: x["constructorId"])
        df = df.merge(constructor_df[["constructorId_ergast", "points", "wins"]], left_on="constructor_id", right_on="constructorId_ergast", how="left", suffixes=('_constructor', None))
        df["constructor_points"] = df["points"].fillna(0)
        df["constructor_wins"] = df["wins"].fillna(0)
        df.drop(columns=["constructorId_ergast", "points", "wins"], inplace=True)

    # ── Derived Kinematics ─────────────────────────────────────
    df["acceleration"] = compute_acceleration(df["speed"])
    df["jerk"] = compute_jerk(df["acceleration"])

    # ── 2026-Specific Features ─────────────────────────────────
    df["is_derating"] = detect_derating_zones(df)
    df["cumulative_energy_kj"] = compute_energy_deployment(df)
    df["energy_budget_remaining_pct"] = (
        1.0 - (df["cumulative_energy_kj"] / ENERGY_PER_LAP_KJ)
    ).clip(0.0, 1.0)
    df["drs_efficiency"] = compute_drs_efficiency(df)

    # ── Normalised Features ────────────────────────────────────
    df["speed_normalised"] = df["speed"] / 350.0
    df["rpm_normalised"] = df["rpm"] / 15000.0
    df["throttle_normalised"] = df["throttle"] / 100.0

    # ── Binary Flags ──────────────────────────────────────────
    df["high_speed_flag"] = (df["speed"] > 280).astype(int)
    df["braking_flag"] = (df["brake"] > 50).astype(int)
    df["full_throttle_flag"] = (df["throttle"] >= 95).astype(int)

    # ── Rolling Statistics (window = 10 samples ≈ 2.7 seconds) ─
    df["speed_rolling_mean"] = df["speed"].rolling(10, min_periods=1).mean()
    df["speed_rolling_std"] = df["speed"].rolling(10, min_periods=1).std().fillna(0)
    df["accel_rolling_mean"] = df["acceleration"].rolling(10, min_periods=1).mean()

    # ── Lap Summary Statistics ─────────────────────────────────
    df["derating_count"] = df["is_derating"].cumsum()

    return df


def extract_lap_features(
    car_df: pd.DataFrame,
    lap_data: Optional[list[dict]] = None,
) -> dict:
    """
    Aggregate per-lap features from the enriched car data DataFrame.
    These are the features fed into the XGBoost predictor.
    """
    if car_df.empty:
        return {}

    features = {
        # Speed statistics
        "mean_speed": car_df["speed"].mean(),
        "max_speed": car_df["speed"].max(),
        "min_speed": car_df["speed"].min(),
        "speed_std": car_df["speed"].std(),

        # RPM statistics
        "mean_rpm": car_df["rpm"].mean(),
        "max_rpm": car_df["rpm"].max(),

        # Throttle & braking
        "mean_throttle": car_df["throttle"].mean(),
        "full_throttle_pct": car_df["full_throttle_flag"].mean() * 100,
        "braking_pct": car_df["braking_flag"].mean() * 100,

        # 2026 Regulation features
        "derating_events": int(car_df["is_derating"].sum()),
        "derating_pct": car_df["is_derating"].mean() * 100,
        "total_energy_deployed_kj": car_df["cumulative_energy_kj"].iloc[-1] if len(car_df) > 0 else 0,
        "energy_budget_remaining_pct": car_df["energy_budget_remaining_pct"].iloc[-1] if len(car_df) > 0 else 1.0,
        "mean_drs_efficiency": car_df["drs_efficiency"].mean(),

        # Acceleration
        "mean_acceleration": car_df["acceleration"].mean(),
        "max_acceleration": car_df["acceleration"].max(),
        "min_acceleration": car_df["acceleration"].min(),  # Most negative = hardest braking

        # High-speed performance
        "high_speed_pct": car_df["high_speed_flag"].mean() * 100,

        # Driver/Constructor Statistics
        "driver_points": car_df["driver_points"].iloc[-1] if "driver_points" in car_df.columns and len(car_df) > 0 else 0,
        "driver_wins": car_df["driver_wins"].iloc[-1] if "driver_wins" in car_df.columns and len(car_df) > 0 else 0,
        "constructor_points": car_df["constructor_points"].iloc[-1] if "constructor_points" in car_df.columns and len(car_df) > 0 else 0,
        "constructor_wins": car_df["constructor_wins"].iloc[-1] if "constructor_wins" in car_df.columns and len(car_df) > 0 else 0,
    }

    # Merge lap timing data if available
    if lap_data:
        lap_df = pd.DataFrame(lap_data)
        if not lap_df.empty and "lap_duration" in lap_df.columns:
            valid_laps = lap_df[lap_df["lap_duration"].notna() & (lap_df["lap_duration"] > 60)]
            if not valid_laps.empty:
                features["best_lap_time"] = valid_laps["lap_duration"].min()
                features["mean_lap_time"] = valid_laps["lap_duration"].mean()
                features["lap_time_std"] = valid_laps["lap_duration"].std()

    return features
