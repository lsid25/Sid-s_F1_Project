
import httpx
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

ERGAST_BASE_URL = "https://ergast.com/api/f1"
DEFAULT_TIMEOUT = 30.0

class ErgastClient:
    """Async HTTP client for the Ergast API."""
    def __init__(self, base_url: str = ERGAST_BASE_URL, timeout: float = DEFAULT_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout

    async def _get(self, endpoint: str, params: Optional[dict[str, Any]] = None) -> dict:
        """Generic GET request to the Ergast API."""
        url = f"{self.base_url}/{endpoint}.json"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Ergast HTTP error {e.response.status_code} for {url}: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Ergast request error for {url}: {e}")
                raise

    async def get_race_results(self, year: int, round_num: int) -> list[dict]:
        """Fetch race results for a specific year and round."""
        data = await self._get(f"{year}/{round_num}/results")
        if data and "MRData" in data and "RaceTable" in data["MRData"] and "Races" in data["MRData"]["RaceTable"]:
            if data["MRData"]["RaceTable"]["Races"]:
                return data["MRData"]["RaceTable"]["Races"][0]["Results"]
        return []

    async def get_qualifying_results(self, year: int, round_num: int) -> list[dict]:
        """Fetch qualifying results for a specific year and round."""
        data = await self._get(f"{year}/{round_num}/qualifying")
        if data and "MRData" in data and "RaceTable" in data["MRData"] and "Races" in data["MRData"]["RaceTable"]:
            if data["MRData"]["RaceTable"]["Races"]:
                return data["MRData"]["RaceTable"]["Races"][0]["QualifyingResults"]
        return []

    async def get_driver_standings(self, year: int, round_num: Optional[int] = None) -> list[dict]:
        """Fetch driver standings for a specific year and optional round."""
        endpoint = f"{year}/driverStandings" if round_num is None else f"{year}/{round_num}/driverStandings"
        data = await self._get(endpoint)
        if data and "MRData" in data and "StandingsTable" in data["MRData"] and "StandingsLists" in data["MRData"]["StandingsTable"]:
            if data["MRData"]["StandingsTable"]["StandingsLists"]:
                return data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
        return []

    async def get_constructor_standings(self, year: int, round_num: Optional[int] = None) -> list[dict]:
        """Fetch constructor standings for a specific year and optional round."""
        endpoint = f"{year}/constructorStandings" if round_num is None else f"{year}/{round_num}/constructorStandings"
        data = await self._get(endpoint)
        if data and "MRData" in data and "StandingsTable" in data["MRData"] and "StandingsLists" in data["MRData"]["StandingsTable"]:
            if data["MRData"]["StandingsTable"]["StandingsLists"]:
                return data["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]
        return []

# Singleton instance
ergast_client = ErgastClient()
