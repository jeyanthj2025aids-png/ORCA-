from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from backend.app.services.providers.base import (
    EODataProvider, WeatherProvider, OceanProvider, TideProvider, PFZProvider, BoundaryProvider
)
from backend.app.models.schemas import (
    Location, MarineCondition, PFZResult, BoundaryItem, ObservationType
)
from backend.app.core.database import calculate_haversine_distance, is_point_in_polygon

class MockEOProvider(EODataProvider):
    """
    Simulated Earth Observation data provider adhering to ISRO Oceansat-3/EOS-06 & INSAT-3DR schemas.
    """
    async def get_ocean_color(self, lat: float, lon: float, timestamp: Optional[str] = None) -> dict[str, Any]:
        # Realistic gradient based on coastal proximity (Palk Bay / Gulf of Mannar)
        dist_factor = abs(lat - 9.28) + abs(lon - 79.31)
        chlorophyll = round(max(0.25, 1.65 - (dist_factor * 0.4)), 3)
        return {
            "source": "SIMULATED DATA (Oceansat-3 / OCM-3 Optical Ocean Colour)",
            "observation_type": ObservationType.DEMO_DATA.value,
            "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
            "lat": lat,
            "lon": lon,
            "chlorophyll_mg_m3": chlorophyll,
            "turbidity_ntu": round(2.1 + (chlorophyll * 0.8), 2),
            "cloud_cover_pct": 12.0,
            "spatial_resolution": "360m",
            "is_demo": True
        }

    async def get_sea_surface_temperature(self, lat: float, lon: float, timestamp: Optional[str] = None) -> dict[str, Any]:
        # Palk Bay / Gulf of Mannar SST ranges between 28.2°C to 30.1°C
        sst = round(29.1 - ((lat - 9.0) * 0.25), 2)
        return {
            "source": "SIMULATED DATA (INSAT-3DR SSTM / Thermal IR)",
            "observation_type": ObservationType.DEMO_DATA.value,
            "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
            "lat": lat,
            "lon": lon,
            "sst_celsius": sst,
            "thermal_front_detected": True if sst < 29.0 else False,
            "spatial_resolution": "1000m",
            "is_demo": True
        }


class MockWeatherProvider(WeatherProvider):
    """
    Simulated marine weather provider adhering to IMD / ECMWF marine meteorology schemas.
    """
    async def get_current_marine_weather(self, lat: float, lon: float) -> dict[str, Any]:
        # Elevated wind speeds typical for Palk Strait funneling
        is_palk_strait = 9.2 <= lat <= 10.1 and 79.0 <= lon <= 79.8
        wind_speed = 19.5 if is_palk_strait else 14.0
        gusts = wind_speed + 5.5
        
        return {
            "source": "SIMULATED DATA (IMD Marine Weather Bulletin Schema)",
            "observation_type": ObservationType.DEMO_DATA.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "location": {"lat": lat, "lon": lon},
            "wind_speed_knots": wind_speed,
            "wind_gust_knots": gusts,
            "wind_direction_deg": 135.0, # SE wind
            "air_temperature_c": 29.8,
            "pressure_hpa": 1010.5,
            "precipitation_mm": 0.0,
            "cyclone_warning": "NONE",
            "squally_weather": True if wind_speed > 18.0 else False,
            "is_demo": True
        }

    async def get_marine_forecast(self, lat: float, lon: float, hours: int = 24) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        forecasts = []
        for i in range(1, hours + 1, 3):
            fc_time = now + timedelta(hours=i)
            forecasts.append({
                "forecast_time": fc_time.isoformat(),
                "hour_offset": i,
                "wind_speed_knots": round(15.0 + (i * 0.4), 1),
                "wave_height_m": round(1.2 + (i * 0.08), 2),
                "visibility_km": 10.0,
                "weather_condition": "Partly Cloudy with occasional moderate swells"
            })
        return forecasts


class MockOceanProvider(OceanProvider):
    """
    Simulated ocean dynamics provider matching INCOIS Ocean State Forecast (OSF).
    """
    async def get_ocean_analytics(self, lat: float, lon: float) -> MarineCondition:
        # Wave height: 1.4m to 2.3m in the Palk Bay / Gulf of Mannar
        wave_ht = 1.95 if (lat >= 9.2 and lon >= 79.2) else 1.35
        
        return MarineCondition(
            location=Location(name=f"Point ({round(lat, 3)}°N, {round(lon, 3)}°E)", lat=lat, lon=lon),
            timestamp=datetime.now(timezone.utc).isoformat(),
            sst_celsius=29.2,
            wave_height_m=wave_ht,
            wind_speed_knots=18.5,
            wind_direction_deg=140.0,
            chlorophyll_mg_m3=1.28,
            sea_state="Moderate (Rough in channels)",
            tide_status="Flood Tide (Incoming)",
            active_alerts=["High swell alert: Mandapam channel"],
            source="SIMULATED DATA (INCOIS Ocean State Forecast Schema)",
            demo_mode=True
        )

    async def get_historical_trends(self, location_name: str, years: int = 2) -> dict[str, Any]:
        """
        Historical trend data distinguishing correlation from causation for research queries.
        """
        return {
            "region": location_name,
            "timeframe": f"Past {years} Years (2024-2026)",
            "source": "SIMULATED DATA (Historical Marine Reanalysis Dataset)",
            "observation_type": ObservationType.DEMO_DATA.value,
            "sst_trend": {
                "change_celsius": "+0.42°C",
                "thermal_anomalies_days": 38,
                "significance": "Elevated coastal warming during summer peaks"
            },
            "chlorophyll_trend": {
                "change_percent": "-14.2%",
                "driver": "Altered coastal upwelling and nutrient transport"
            },
            "fisheries_productivity_trend": {
                "pelagic_catch_change_percent": "-18.5%",
                "demersal_catch_change_percent": "-6.1%",
                "correlation_coefficient_sst_catch": -0.68
            },
            "scientific_interpretation": {
                "correlation_statement": "There is a strong negative statistical correlation (r = -0.68) between rising SST thermal anomalies and pelagic fish school concentration.",
                "causation_caution": "CORRELATION DOES NOT EQUAL CAUSATION: Fish productivity shifts are co-driven by seasonal monsoonal variation, localized benthic disturbance, fuel economics altering trawling effort, and migration towards cooler deeper shelf waters."
            },
            "monthly_points": [
                {"month": "2024-Q1", "sst": 28.4, "chlorophyll": 1.45, "catch_index": 100},
                {"month": "2024-Q2", "sst": 29.8, "chlorophyll": 1.10, "catch_index": 88},
                {"month": "2024-Q3", "sst": 28.9, "chlorophyll": 1.35, "catch_index": 94},
                {"month": "2024-Q4", "sst": 28.2, "chlorophyll": 1.52, "catch_index": 102},
                {"month": "2025-Q1", "sst": 28.7, "chlorophyll": 1.38, "catch_index": 92},
                {"month": "2025-Q2", "sst": 30.2, "chlorophyll": 0.98, "catch_index": 79},
                {"month": "2025-Q3", "sst": 29.2, "chlorophyll": 1.25, "catch_index": 87},
                {"month": "2025-Q4", "sst": 28.5, "chlorophyll": 1.40, "catch_index": 93},
                {"month": "2026-Q1", "sst": 28.9, "chlorophyll": 1.31, "catch_index": 85},
            ]
        }


class MockTideProvider(TideProvider):
    async def get_tide_data(self, lat: float, lon: float) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "source": "SIMULATED DATA (Survey of India Tidal Tables Schema)",
            "observation_type": ObservationType.DEMO_DATA.value,
            "station": "Pamban / Rameswaram Station (ID: 434)",
            "timestamp": now.isoformat(),
            "current_phase": "Flood Tide (Rising)",
            "current_height_m": 0.72,
            "tidal_range_m": 0.85,
            "daily_events": [
                {"event": "Low Tide", "time": (now - timedelta(hours=2)).strftime("%H:%M UTC"), "height_m": 0.22},
                {"event": "High Tide", "time": (now + timedelta(hours=4)).strftime("%H:%M UTC"), "height_m": 0.94},
                {"event": "Low Tide", "time": (now + timedelta(hours=10)).strftime("%H:%M UTC"), "height_m": 0.28},
                {"event": "High Tide", "time": (now + timedelta(hours=16)).strftime("%H:%M UTC"), "height_m": 0.91}
            ],
            "navigational_clearance": "Sufficient for artisanal & mechanized fishing craft (>1.8m draught in main channels)."
        }


class MockPFZProvider(PFZProvider):
    """
    Simulated Potential Fishing Zone (PFZ) advisory provider matching INCOIS/NRSC parameters.
    """
    def __init__(self):
        # Realistic PFZ zones mapped across Tamil Nadu coastal waters
        self._zones = [
            PFZResult(
                zone_id="PFZ-TN-01",
                name="Rameswaram East Outer Bank",
                lat=9.3250,
                lon=79.4680,
                distance_km=18.4,
                sst_celsius=28.7,
                chlorophyll_mg_m3=1.42,
                validity="Valid for next 36 hours",
                confidence=0.89,
                depth_m=16.5,
                target_species=["Indian Mackerel (Rastrelliger kanagurta)", "Sardinella", "Ribbonfish"],
                recommendation="Optimal thermal-chlorophyll gradient intersection. Moderate sea state."
            ),
            PFZResult(
                zone_id="PFZ-TN-02",
                name="Mandapam South Shelf",
                lat=9.2150,
                lon=79.2240,
                distance_km=14.2,
                sst_celsius=28.9,
                chlorophyll_mg_m3=1.35,
                validity="Valid for next 24 hours",
                confidence=0.85,
                depth_m=14.0,
                target_species=["Tuna (Thunnus albacares)", "Seer fish (Scomberomorus commerson)"],
                recommendation="Strong chlorophyll front observed near Gulf of Mannar outer drop-off."
            ),
            PFZResult(
                zone_id="PFZ-TN-03",
                name="Palk Strait Deep Channel",
                lat=9.5120,
                lon=79.3850,
                distance_km=27.6,
                sst_celsius=28.4,
                chlorophyll_mg_m3=1.65,
                validity="Valid for next 48 hours",
                confidence=0.92,
                depth_m=12.0,
                target_species=["Carangids (Trevally)", "Silver pomfret"],
                recommendation="High productivity zone. Note proximity to IMBL boundary (remain 3.5 NM West)."
            ),
            PFZResult(
                zone_id="PFZ-TN-04",
                name="Nagapattinam Offshore Ground",
                lat=10.7420,
                lon=80.0210,
                distance_km=82.0,
                sst_celsius=28.6,
                chlorophyll_mg_m3=1.28,
                validity="Valid for next 24 hours",
                confidence=0.87,
                depth_m=32.0,
                target_species=["Yellowfin Tuna", "Skipjack", "Snapper"],
                recommendation="Deep shelf margin upwelling."
            )
        ]

    async def get_nearest_pfz(self, lat: float, lon: float) -> list[PFZResult]:
        # Recalculate dynamic distance from current user coordinates
        results = []
        for z in self._zones:
            dist = calculate_haversine_distance(lat, lon, z.lat, z.lon)
            # Create a copy with accurate distance
            z_dict = z.model_dump()
            z_dict["distance_km"] = dist["km"]
            results.append(PFZResult(**z_dict))
        
        # Sort by distance
        results.sort(key=lambda x: x.distance_km)
        return results


class MockBoundaryProvider(BoundaryProvider):
    """
    Simulated Maritime boundaries: IMBL (India - Sri Lanka), EEZ, and MPAs.
    """
    def __init__(self):
        # IMBL coordinates in Palk Bay / Gulf of Mannar
        self._imbl_coords = [
            [79.520, 10.080],
            [79.480, 9.850],
            [79.410, 9.600],
            [79.380, 9.400],
            [79.350, 9.200],
            [79.280, 9.000],
            [79.200, 8.800]
        ]
        
        # Gulf of Mannar Marine National Park / Biosphere Reserve boundary polygon
        self._mpa_coords = [
            [79.10, 9.20],
            [79.30, 9.15],
            [79.25, 9.05],
            [79.05, 9.10],
            [79.10, 9.20]
        ]
        
        self._boundaries = [
            BoundaryItem(
                id="IMBL-IND-LKA",
                name="International Maritime Boundary Line (IMBL) - India/Sri Lanka",
                type="IMBL",
                coordinates=self._imbl_coords,
                description="Strictly restricted maritime international border. Crossing prohibited under maritime law.",
                restricted=True
            ),
            BoundaryItem(
                id="MPA-GOM-01",
                name="Gulf of Mannar Marine Biosphere Reserve Core Zone",
                type="MPA",
                coordinates=self._mpa_coords,
                description="Ecologically sensitive coral reef zone. Commercial bottom-trawling prohibited.",
                restricted=True
            )
        ]

    async def get_marine_boundaries(self) -> list[BoundaryItem]:
        return self._boundaries

    async def check_proximity(self, lat: float, lon: float, buffer_nm: float = 5.0) -> list[dict[str, Any]]:
        warnings = []
        # Check distance to each IMBL segment
        for i, coord in enumerate(self._imbl_coords):
            dist = calculate_haversine_distance(lat, lon, coord[1], coord[0])
            if dist["nm"] <= buffer_nm:
                warnings.append({
                    "boundary_id": "IMBL-IND-LKA",
                    "boundary_name": "India - Sri Lanka IMBL",
                    "distance_nm": dist["nm"],
                    "severity": "CRITICAL" if dist["nm"] < 2.0 else "HIGH",
                    "warning_message": f"WARNING: Vessel is {dist['nm']} NM from the International Maritime Boundary Line! Risk of maritime border crossing."
                })
                break
        
        # Check point in MPA polygon
        in_mpa = is_point_in_polygon(lat, lon, self._mpa_coords)
        if in_mpa:
            warnings.append({
                "boundary_id": "MPA-GOM-01",
                "boundary_name": "Gulf of Mannar Core Zone",
                "distance_nm": 0.0,
                "severity": "MODERATE",
                "warning_message": "Vessel is inside Gulf of Mannar Marine Biosphere Reserve. Commercial trawling is restricted."
            })
            
        return warnings
