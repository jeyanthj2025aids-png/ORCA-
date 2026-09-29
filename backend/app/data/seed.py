import asyncio
from datetime import datetime, timezone, timedelta
from backend.app.core.database import AsyncSessionLocal, engine, Base
from backend.app.models.db_models import (
    LocationModel, PFZZoneModel, MarineObservationModel,
    WeatherObservationModel, HazardEventModel, MarineBoundaryModel
)

async def seed_all():
    print("Initializing ORCA Marine Database Tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        print("Seeding Strategic Maritime Locations (Tamil Nadu / Palk Bay)...")
        locations = [
            LocationModel(name="Rameswaram Fishing Harbor", state="Tamil Nadu", lat=9.2876, lon=79.3129, region_type="Major Coastal Harbor"),
            LocationModel(name="Mandapam Marine Station", state="Tamil Nadu", lat=9.2780, lon=79.1250, region_type="Fisheries Research Center"),
            LocationModel(name="Palk Strait Deep Channel", state="Tamil Nadu", lat=9.5500, lon=79.3500, region_type="Deep Shelf Navigational Strait"),
            LocationModel(name="Gulf of Mannar Biosphere", state="Tamil Nadu", lat=9.1500, lon=79.2000, region_type="Marine Protected Reserve"),
            LocationModel(name="Nagapattinam Port", state="Tamil Nadu", lat=10.7656, lon=79.8424, region_type="Deep Sea Trawling Port"),
            LocationModel(name="Chennai Marina Waters", state="Tamil Nadu", lat=13.0827, lon=80.2707, region_type="Coromandel Coast Anchorage")
        ]
        session.add_all(locations)
        
        print("Seeding Potential Fishing Zones (PFZs)...")
        now = datetime.now(timezone.utc)
        pfzs = [
            PFZZoneModel(
                name="Rameswaram East Outer Bank",
                lat=9.3250,
                lon=79.4680,
                sst_celsius=28.7,
                chlorophyll_mg_m3=1.42,
                depth_m=16.5,
                validity_start=now,
                validity_end=now + timedelta(hours=36),
                target_species=["Indian Mackerel", "Sardinella", "Ribbonfish"],
                confidence_score=0.89,
                advisory_text="Strong chlorophyll-a gradient front intersecting 28.7°C isotherm.",
                status="ACTIVE"
            ),
            PFZZoneModel(
                name="Mandapam South Shelf",
                lat=9.2150,
                lon=79.2240,
                sst_celsius=28.9,
                chlorophyll_mg_m3=1.35,
                depth_m=14.0,
                validity_start=now,
                validity_end=now + timedelta(hours=24),
                target_species=["Tuna", "Seer fish"],
                confidence_score=0.85,
                advisory_text="Thermal front observed near Gulf of Mannar outer drop-off.",
                status="ACTIVE"
            ),
            PFZZoneModel(
                name="Palk Strait Deep Channel",
                lat=9.5120,
                lon=79.3850,
                sst_celsius=28.4,
                chlorophyll_mg_m3=1.65,
                depth_m=12.0,
                validity_start=now,
                validity_end=now + timedelta(hours=48),
                target_species=["Trevally", "Pomfret"],
                confidence_score=0.92,
                advisory_text="High productivity zone. Maintain 3.5 NM buffer from IMBL.",
                status="ACTIVE"
            )
        ]
        session.add_all(pfzs)
        
        print("Seeding Marine and Weather Observations...")
        obs = MarineObservationModel(
            location_name="Rameswaram",
            lat=9.2876,
            lon=79.3129,
            timestamp=now,
            sst_celsius=29.2,
            wave_height_m=1.95,
            wave_direction_deg=135.0,
            current_velocity_m_s=0.45,
            salinity_psu=34.6,
            chlorophyll_mg_m3=1.28,
            sea_state="Moderate",
            dataset_type="SIMULATED",
            source_agency="INCOIS/NRSC"
        )
        weather = WeatherObservationModel(
            location_name="Rameswaram",
            lat=9.2876,
            lon=79.3129,
            timestamp=now,
            wind_speed_knots=19.5,
            wind_gust_knots=24.0,
            wind_direction_deg=135.0,
            air_temp_celsius=29.8,
            humidity_pct=78.0,
            pressure_hpa=1010.5,
            precipitation_mm=0.0,
            cyclone_risk="NONE",
            lightning_risk="LOW",
            dataset_type="SIMULATED"
        )
        session.add(obs)
        session.add(weather)
        
        print("Seeding Hazard Events & Boundaries...")
        hazard = HazardEventModel(
            title="Pamban-Mandapam Channel Swell Surge",
            hazard_type="high_wave",
            severity="MODERATE",
            description="Wave swells exceeding 2.0m during high tide window in shallow navigation channel.",
            center_lat=9.278,
            center_lon=79.200,
            affected_radius_km=15.0,
            valid_from=now,
            valid_until=now + timedelta(hours=24),
            is_active=True
        )
        boundary = MarineBoundaryModel(
            name="International Maritime Boundary Line (IMBL) - India/Sri Lanka",
            boundary_type="IMBL",
            country_primary="India",
            country_secondary="Sri Lanka",
            is_restricted=True,
            coordinates_geojson={
                "type": "LineString",
                "coordinates": [
                    [79.520, 10.080],
                    [79.480, 9.850],
                    [79.410, 9.600],
                    [79.380, 9.400],
                    [79.350, 9.200],
                    [79.280, 9.000],
                    [79.200, 8.800]
                ]
            },
            warning_buffer_nm=3.0,
            description="Strictly restricted maritime international border. Crossing prohibited under maritime law."
        )
        session.add(hazard)
        session.add(boundary)
        
        await session.commit()
        print("ORCA Marine Knowledge Layer Seed Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_all())
