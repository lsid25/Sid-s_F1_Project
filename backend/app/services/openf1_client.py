"""
OpenF1 API Client Service
Handles all HTTP communication with the OpenF1 REST API.
Endpoint reference: https://openf1.org
"""

import httpx
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

OPENF1_BASE_URL = "https://api.openf1.org/v1"
DEFAULT_TIMEOUT = 30.0


class OpenF1Client:
    """Async HTTP client for the OpenF1 API."""

    def __init__(self, base_url: str = OPENF1_BASE_URL, timeout: float = DEFAULT_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout

    async def _get(self, endpoint: str, params: dict[str, Any]) -> list[dict]:
        """Generic GET request to the OpenF1 API."""
        url = f"{self.base_url}/{endpoint}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"OpenF1 HTTP error {e.response.status_code} for {url}: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"OpenF1 request error for {url}: {e}")
                raise

    async def get_car_data(
        self,
        session_key: str,
        driver_number: int,
        limit: Optional[int] = 500,
    ) -> list[dict]:
        """
        Fetch car telemetry data (speed, RPM, throttle, brake, DRS, gear).
        Sampled at ~3.7 Hz by the OpenF1 API.
        """
        params: dict[str, Any] = {
            "session_key": session_key,
            "driver_number": driver_number,
        }
        data = await self._get("car_data", params)
        return data[:limit] if limit else data

    async def get_laps(self, session_key: str, driver_number: int) -> list[dict]:
        """Fetch lap timing data for a driver in a session."""
        return await self._get("laps", {
            "session_key": session_key,
            "driver_number": driver_number,
        })

    async def get_drivers(self, session_key: str) -> list[dict]:
        """Fetch all driver info for a given session."""
        return await self._get("drivers", {"session_key": session_key})

    async def get_sessions(self, year: int = 2024) -> list[dict]:
        """Fetch all sessions for a given year."""
        return await self._get("sessions", {"year": year})

    async def get_meetings(self, year: int = 2024) -> list[dict]:
        """Fetch all race meetings (GPs) for a given year."""
        return await self._get("meetings", {"year": year})

    async def get_intervals(self, session_key: str) -> list[dict]:
        """Fetch live race interval data (gap to leader, gap to car ahead)."""
        return await self._get("intervals", {"session_key": session_key})

    async def get_stints(self, session_key: str, driver_number: int) -> list[dict]:
        """Fetch tyre stint data for a driver."""
        return await self._get("stints", {
            "session_key": session_key,
            "driver_number": driver_number,
        })


# Singleton instance
openf1_client = OpenF1Client()
