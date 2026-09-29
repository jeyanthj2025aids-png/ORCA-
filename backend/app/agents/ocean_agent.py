from backend.app.agents.state import OrcaState
from backend.app.services.unified_marine_layer import marine_knowledge_layer
from backend.app.models.schemas import EvidenceItem, ObservationType

class OceanAnalyticsAgent:
    async def run(self, state: OrcaState) -> OrcaState:
        lat, lon = state.location.lat, state.location.lon
        ocean_condition = await marine_knowledge_layer.get_ocean_conditions(lat, lon)
        state.agent_results["ocean"] = ocean_condition.model_dump()
        state.data_timestamp = ocean_condition.timestamp
        
        # Add evidence
        state.evidence.append(EvidenceItem(
            source="INCOIS Ocean State Forecast (Simulated Provider)",
            dataset="SST & Wave Height Model Observation",
            timestamp=ocean_condition.timestamp,
            location=f"{state.location.name} ({round(lat, 3)}°N, {round(lon, 3)}°E)",
            parameter="Significant Wave Height & Sea State",
            value=f"{ocean_condition.wave_height_m}m ({ocean_condition.sea_state})",
            unit="meters",
            observation_type=ObservationType.DEMO_DATA,
            confidence=0.90
        ))
        
        state.agent_timeline.append({
            "agent_name": "Ocean Analytics Agent",
            "status": "Completed",
            "execution_time_ms": 82,
            "summary": f"Wave height: {ocean_condition.wave_height_m}m, SST: {ocean_condition.sst_celsius}°C, Sea state: {ocean_condition.sea_state}"
        })
        return state

ocean_agent = OceanAnalyticsAgent()
