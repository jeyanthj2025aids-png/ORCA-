from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import EvidenceItem, ObservationType

class SatelliteEOAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        lat, lon = state.location.lat, state.location.lon
        eo_data = await marine_knowledge_layer.get_satellite_eo(lat, lon)
        state.agent_results["satellite_eo"] = eo_data
        
        color_obs = eo_data["ocean_color"]
        sst_obs = eo_data["sst"]
        
        state.evidence.append(EvidenceItem(
            source=color_obs["source"],
            dataset="Chlorophyll-a Concentration (OCM-3 Level-3)",
            timestamp=color_obs["timestamp"],
            location=f"{round(lat, 3)}°N, {round(lon, 3)}°E",
            parameter="Chlorophyll-a",
            value=f"{color_obs['chlorophyll_mg_m3']} mg/m³",
            unit="mg/m³",
            observation_type=ObservationType.DEMO_DATA,
            confidence=0.88
        ))
        
        state.evidence.append(EvidenceItem(
            source=sst_obs["source"],
            dataset="Sea Surface Temperature (SSTM / INSAT-3DR)",
            timestamp=sst_obs["timestamp"],
            location=f"{round(lat, 3)}°N, {round(lon, 3)}°E",
            parameter="Satellite SST",
            value=f"{sst_obs['sst_celsius']}°C",
            unit="°C",
            observation_type=ObservationType.DEMO_DATA,
            confidence=0.91
        ))
        
        state.agent_timeline.append({
            "agent_name": "Satellite Earth Observation Agent",
            "status": "Completed",
            "execution_time_ms": 95,
            "summary": f"OCM-3 Chlorophyll: {color_obs['chlorophyll_mg_m3']} mg/m³, Thermal front SST: {sst_obs['sst_celsius']}°C"
        })
        return state

satellite_eo_agent = SatelliteEOAgent()
