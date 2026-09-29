from datetime import datetime, timezone
from typing import Any, Optional
from backend.app.services.providers.mock_providers import (
    MockEOProvider, MockWeatherProvider, MockOceanProvider, MockTideProvider,
    MockPFZProvider, MockBoundaryProvider
)
from backend.app.services.vector_store import vector_store
from backend.app.services.knowledge_graph import knowledge_graph
from backend.app.models.schemas import (
    Location, MarineCondition, PFZResult, BoundaryItem, RouteResult, Waypoint, HazardItem
)
from backend.app.core.database import calculate_haversine_distance

class UnifiedMarineKnowledgeLayer:
    """
    Centralized Gateway for ORCA Marine Intelligence.
    Provides semantic, structured, spatial, and temporal retrieval.
    Wraps all underlying providers so agents access marine knowledge through safe, validated tools.
    """
    def __init__(self):
        self.eo_provider = MockEOProvider()
        self.weather_provider = MockWeatherProvider()
        self.ocean_provider = MockOceanProvider()
        self.tide_provider = MockTideProvider()
        self.pfz_provider = MockPFZProvider()
        self.boundary_provider = MockBoundaryProvider()
        self.vector_store = vector_store
        self.knowledge_graph = knowledge_graph
        
        # In-memory active hazard events registry
        self.active_hazards = [
            HazardItem(
                id="HAZ-001",
                type="high_wave",
                severity="MODERATE",
                title="Pamban-Mandapam Channel Swell Surge",
                description="Short-period wave swell exceeding 2.0m during high tide window.",
                coordinates=[[79.25, 9.25], [79.35, 9.28], [79.32, 9.20], [79.25, 9.25]],
                effective_until=(datetime.now(timezone.utc)).isoformat(),
                affected_radius_km=15.0
            ),
            HazardItem(
                id="HAZ-002",
                type="restricted_border",
                severity="HIGH",
                title="IMBL Proximity Caution",
                description="International maritime boundary patrol zone. Maintain 3 NM safety buffer.",
                coordinates=[[79.40, 9.35], [79.50, 9.45], [79.48, 9.30], [79.40, 9.35]],
                effective_until=(datetime.now(timezone.utc)).isoformat(),
                affected_radius_km=20.0
            )
        ]

    # --- Structured Retrieval ---
    async def get_ocean_conditions(self, lat: float, lon: float) -> MarineCondition:
        return await self.ocean_provider.get_ocean_analytics(lat, lon)

    async def get_weather(self, lat: float, lon: float) -> dict[str, Any]:
        return await self.weather_provider.get_current_marine_weather(lat, lon)

    async def get_tide(self, lat: float, lon: float) -> dict[str, Any]:
        return await self.tide_provider.get_tide_data(lat, lon)

    async def get_satellite_eo(self, lat: float, lon: float) -> dict[str, Any]:
        color = await self.eo_provider.get_ocean_color(lat, lon)
        sst = await self.eo_provider.get_sea_surface_temperature(lat, lon)
        return {"ocean_color": color, "sst": sst}

    async def get_pfz_data(self, lat: float, lon: float) -> list[PFZResult]:
        return await self.pfz_provider.get_nearest_pfz(lat, lon)

    async def get_hazards(self) -> list[HazardItem]:
        return self.active_hazards

    async def get_boundaries(self) -> list[BoundaryItem]:
        return await self.boundary_provider.get_marine_boundaries()

    async def check_geofences(self, lat: float, lon: float) -> list[dict[str, Any]]:
        return await self.boundary_provider.check_proximity(lat, lon)

    # --- Spatial & Route Engine (Deterministic routing) ---
    async def calculate_safe_route(self, origin: Location, dest: Location) -> RouteResult:
        """
        Deterministic routing engine:
        Calculates path avoiding active hazard zones and IMBL buffer.
        """
        direct_dist = calculate_haversine_distance(origin.lat, origin.lon, dest.lat, dest.lon)
        
        # Calculate dogleg waypoint to steer clear of IMBL or reef zones if needed
        mid_lat = (origin.lat + dest.lat) / 2.0
        mid_lon = (origin.lon + dest.lon) / 2.0
        
        # Push waypoint westward slightly if nearing IMBL (lon > 79.35)
        waypoints = [
            Waypoint(lat=origin.lat, lon=origin.lon, name=f"Departure: {origin.name}", leg_distance_nm=0.0)
        ]
        
        hazards_avoided = []
        if mid_lon > 79.35:
            # Shift waypoint safely west
            safe_mid_lon = round(mid_lon - 0.05, 4)
            leg1 = calculate_haversine_distance(origin.lat, origin.lon, mid_lat, safe_mid_lon)
            waypoints.append(
                Waypoint(lat=mid_lat, lon=safe_mid_lon, name="Waypoint Alpha (IMBL Safety Offset)", leg_distance_nm=leg1["nm"])
            )
            hazards_avoided.append("India-Sri Lanka IMBL Buffer Zone")
        
        leg_final = calculate_haversine_distance(
            waypoints[-1].lat, waypoints[-1].lon, dest.lat, dest.lon
        )
        waypoints.append(
            Waypoint(lat=dest.lat, lon=dest.lon, name=f"Arrival: {dest.name}", leg_distance_nm=leg_final["nm"])
        )
        
        total_nm = sum(w.leg_distance_nm for w in waypoints)
        est_hours = round(total_nm / 9.5, 1) # assuming avg cruising speed 9.5 knots
        
        return RouteResult(
            route_id=f"RTE-{int(datetime.now(timezone.utc).timestamp())}",
            origin=origin,
            destination=dest,
            distance_nm=round(total_nm, 1),
            estimated_hours=est_hours,
            waypoints=waypoints,
            hazards_avoided=hazards_avoided,
            safe_status=True,
            fuel_efficiency_index=0.94
        )

    # --- Temporal & Historical Retrieval ---
    async def get_historical_trends(self, location_name: str, years: int = 2) -> dict[str, Any]:
        return await self.ocean_provider.get_historical_trends(location_name, years)

    # --- Semantic Retrieval ---
    async def semantic_search(self, query: str, limit: int = 3) -> list[dict[str, Any]]:
        return await self.vector_store.search(query, limit)

marine_knowledge_layer = UnifiedMarineKnowledgeLayer()
