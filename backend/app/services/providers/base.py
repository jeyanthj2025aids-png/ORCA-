from abc import ABC, abstractmethod
from typing import Any, Optional
from backend.app.models.schemas import (
    Location, MarineCondition, PFZResult, HazardItem, BoundaryItem, EvidenceItem
)

class EODataProvider(ABC):
    @abstractmethod
    async def get_ocean_color(self, lat: float, lon: float, timestamp: Optional[str] = None) -> dict[str, Any]:
        """Retrieve chlorophyll and spectral ocean color reflectance."""
        pass

    @abstractmethod
    async def get_sea_surface_temperature(self, lat: float, lon: float, timestamp: Optional[str] = None) -> dict[str, Any]:
        """Retrieve satellite-derived SST data."""
        pass


class WeatherProvider(ABC):
    @abstractmethod
    async def get_current_marine_weather(self, lat: float, lon: float) -> dict[str, Any]:
        """Fetch wind speed, direction, gusts, pressure, and cyclone status."""
        pass

    @abstractmethod
    async def get_marine_forecast(self, lat: float, lon: float, hours: int = 24) -> list[dict[str, Any]]:
        """Fetch multi-hour marine forecast."""
        pass


class OceanProvider(ABC):
    @abstractmethod
    async def get_ocean_analytics(self, lat: float, lon: float) -> MarineCondition:
        """Fetch SST, wave height, wave direction, currents, sea state."""
        pass

    @abstractmethod
    async def get_historical_trends(self, location_name: str, years: int = 2) -> dict[str, Any]:
        """Fetch multi-year oceanographic trends for research analysis."""
        pass


class TideProvider(ABC):
    @abstractmethod
    async def get_tide_data(self, lat: float, lon: float) -> dict[str, Any]:
        """Fetch high/low tide timetable and current tide phase."""
        pass


class PFZProvider(ABC):
    @abstractmethod
    async def get_nearest_pfz(self, lat: float, lon: float) -> list[PFZResult]:
        """Retrieve validated Potential Fishing Zones closest to the coordinates."""
        pass


class BoundaryProvider(ABC):
    @abstractmethod
    async def get_marine_boundaries(self) -> list[BoundaryItem]:
        """Retrieve Maritime boundaries: IMBL, EEZ, Marine Protected Areas."""
        pass

    @abstractmethod
    async def check_proximity(self, lat: float, lon: float, buffer_nm: float = 5.0) -> list[dict[str, Any]]:
        """Detect proximity or infringement of sensitive maritime zones."""
        pass
